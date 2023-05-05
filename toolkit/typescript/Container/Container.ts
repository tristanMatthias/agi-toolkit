/**
 * Container communicates with the registry to register the modules and commands.
 * It receives the manifest from the registry and builds the API wrappers for the
 * external commands and modules.
 * It also handles requests from it's peers to run commands and module methods.
 */

import axios, { AxiosError } from 'axios';
import chalk from 'chalk';
import { Socket, io } from 'socket.io-client';
import { v4 as uuid } from 'uuid';
import { Module } from '../Module/Module';
import { RegistryContainerMetadata, RegistryEvent, RegistryManifest, RegistryModuleParametersMetadata } from '../Registry';
import { Command } from '../Command/Command';
import { Shell } from '../lib/Shell';
import loadModule from './loadModule';
import { ContainerConfigurationFile } from './types';
import { ContainerServer } from './ContainerServer';
import getPort from 'get-port';

export class Container {
  public manifest: RegistryManifest | null = null;
  public ui = new Shell();

  private id = uuid();
  private registryUrl: string;
  private modules: Map<string, Module> = new Map();
  private commands: Map<string, Command> = new Map();
  private moduleCommands: Map<Module, Command[]> = new Map();
  private socket: Socket;
  private api: ContainerServer;
  private port: number;

  private setReady: () => void;
  private readyPromise = new Promise<void>(resolve => {
    this.setReady = () => resolve();
  });
  ready() { return this.readyPromise; }
  #loadedLocalModules = false;

  constructor(private configuration: ContainerConfigurationFile) {
    this.registryUrl = configuration.registryUrl;
    this.initialize();
  }

  module<T>(name: string) {
    if (!this.#loadedLocalModules) {
      throw new Error("Container not ready yet. Please wait for the container to be ready before calling module()");
    }
    const module = this.modules.get(name);
    if (!module) this.throw(`Module ${chalk.yellow(name)} not registered. Did you forget to add it to the container?`);
    return module as T;
  }

  registerCommand(module: Module, command: Command): void {
    if (this.commands.has(command.name)) {
      this.throw(`Command ${command} already registered`);
    }
    this.commands.set(command.name, command);

    // Link the command to the module
    if (!this.moduleCommands.has(module)) {
      this.moduleCommands.set(module, []);
    }
    this.moduleCommands.get(module)!.push(command);
  }

  command(command: string, data?: any): Promise<any> {
    // Attempt to run the command locally
    let cmd = this.commands.get(command)?.run;
    // Otherwise, attempt to run the command from the registry
    if (!cmd) cmd = this.api.externalCommand(command);
    if (!cmd) this.throw(`Command ${chalk.yellow(command)} not registered`);
    return cmd(data);
  }

  private initialize(): void {
    this.socket = io(this.registryUrl);
    this.ui.inform(`Connecting to registry at ${this.registryUrl}...`);

    this.socket.on("connect", async () => {
      this.ui.success(`Connected to registry as Container ${this.id}`);
      await this.loadLocalModules();
      await this.registerSelfToRegistry();
    });

    this.socket.on(RegistryEvent.Disconnect, () => {
      this.ui.error("Container", `Disconnected from registry`);
    });

    this.socket.on(RegistryEvent.RegistrationClosed, this.onRegistrationClosed.bind(this));

    this.socket.on(RegistryEvent.Initialize, async () => {
      this.ui.inform(`Received "initialize" signal from registry`);
      await this.api.start();
      await this.initializeModules();
      this.socket.emit(RegistryEvent.ContainerInitialized, this.id);
    });
  }

  async destroy() {
    this.socket.disconnect();
    await this.api.stop();
    await Promise.all(
      Array.from(this.modules.values()).map(module => module.destroy())
    );
  }

  private async onRegistrationClosed(manifest: RegistryManifest) {
    this.manifest = manifest;
    this.ui.inform(`Received manifest from registry. Preparing…`);
    this.api = new ContainerServer({
      container: this,
      port: this.port,
      manifest,
      localModules: Array.from(this.modules.keys())
    });
    this.ui.success(`Prepared. Letting registry know…`);
    this.socket.emit(RegistryEvent.ContainerPrepared, this.id);
  }

  private async loadLocalModules() {
    const modules: Record<string, Record<string, string>> = {};
    for (const [name, settingsOrURI] of Object.entries(this.configuration.modules)) {
      if (typeof settingsOrURI === 'string') {
        modules[settingsOrURI] = {}
      } else {
        modules[settingsOrURI.from] = settingsOrURI.settings;
      }
    }

    for (const uri in modules) {
      const settings = modules[uri];
      // Get the args for this module
      const [config, module] = await loadModule(uri, this, settings);
      // Register the module's commands to this agent
      for (const command of module.commands) this.registerCommand(module, command);
      this.modules.set(config.name, module);
    };
    this.#loadedLocalModules = true;
  }

  private async registerSelfToRegistry() {
    if (!this.port) this.port = await getPort();
    // Build the metadata object to send to the registry
    const metadata: RegistryContainerMetadata = {
      id: this.id,
      port: this.port,
      modules: {}
    };

    const buildCommandMetadata = (module: Module): RegistryModuleParametersMetadata => {
      const metadata: RegistryModuleParametersMetadata = {};
      const commands = this.moduleCommands.get(module) || [];
      for (const command of commands) {
        metadata[command.name] = command.args;
      }
      return metadata;
    }

    for (const [name, module] of this.modules.entries()) {
      metadata.modules[name] = {
        commands: buildCommandMetadata(module),
        methods: module.methods
      };
    }

    this.ui.debug("Container", `Registering metadata`);

    try {
      await axios.post(`${this.registryUrl}/register`, metadata);
      this.ui.success("Successfully registered to registry");
    } catch (e) {
      const err = e as AxiosError<{ error: string }>;
      this.ui.error("Container", `Error with registration: ${chalk.yellow(err.response!.data.error)}`);
      process.exit(1);
    }
    return
  }

  private async initializeModules() {
    for (const module of this.modules.values()) {
      await module.initialize();
    }
    this.ui.success("All modules initialized. Container is ready");
    this.setReady();
  }

  private throw(message: string): never {
    this.ui.error("Container", message);
    process.exit(1);
  }
}
