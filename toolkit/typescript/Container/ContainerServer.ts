import axios from 'axios';
import express from 'express';
import { RegistryManifest } from '../Registry';
import { Container } from './Container';
import chalk from 'chalk';


type Call = (args: any) => Promise<any>;

export interface ContainerServerOptions {
  port: number;
  manifest: RegistryManifest;
  container: Container;
  localModules: string[];
}

export class ContainerServer {
  #server = express();
  #port: number;
  #manifest: RegistryManifest;
  #container: Container;

  #externalModules: Record<string, Record<string, Call>> = {};
  #externalCommands: Record<string, Call> = {};

  constructor(options: ContainerServerOptions) {
    const { port, manifest, container, localModules } = options;
    this.#port = port;
    this.#manifest = manifest;
    this.#container = container;

    this.#server.use(express.json());
    this.#server.use(express.urlencoded({ extended: true }));

    for (const moduleName in manifest.modules) {
      if (localModules.includes(moduleName)) {
        this.buildLocalModuleRoutes(moduleName);
      } else {
        this.buildExternalModuleBindings(moduleName);
      }
    }

    for (const commandName in manifest.commands) {
      if (localModules.includes(commandName)) {
        this.buildLocalCommandRoutes(commandName);
      } else {
        this.buildExternalCommandBindings(commandName);
      }
    }
  }

  externalModule(moduleName: string) {
    const module = this.#externalModules[moduleName];
    if (!module) throw new Error(`Module ${moduleName} not found`);
    return module;
  }

  externalCommand(commandName: string) {
    const cmd = this.#externalCommands[commandName];
    if (!cmd) throw new Error(`Command ${commandName} not found`);
    return cmd;
  }

  start() {
    return new Promise<void>((resolve) => {
      this.#server.listen(this.#port, () => {
        this.#container.ui.debug("Container", `ContainerServer listening on port ${this.#port}`);
        resolve();
      });
    });
  }

  /**
   * Build a "module" with methods bound to the external container's module
   * @param moduleName Name of the module to register methods for
   * @returns
   */
  private buildExternalModuleBindings(moduleName: string) {
    const containerId = this.#manifest.modules[moduleName].containerId;
    const container = this.#manifest.containers[containerId];
    // TODO: Explore https
    const host = `http://${container.ip}:${container.port}`;
    const module = this.#manifest.modules[moduleName];
    const methods: Record<string, Call> = {};
    for (const methodName in module.methods) {
      methods[methodName] = async (args: any) => {
        const res = await axios.post(
          `${host}/module/${moduleName}/${methodName}`,
          args
        );
        return res.data;
      };
    }
    this.#externalModules[moduleName] = methods;
    return methods;
  }

  /**
   * Bind "module method" routes on Express to a local module
   * @param moduleName Name of the module to register routes for
   */
  private buildLocalModuleRoutes(moduleName: string) {
    const module = this.#manifest.modules[moduleName];
    const containerModule = this.#container.module<any>(moduleName);
    // Run on the Container
    Object.entries(module.methods).forEach(([methodName, method]) => {
      this.#server.post(
        `/module/${moduleName}/${methodName}`,
        async (req, res) => {
          try {
            const result = await containerModule[methodName](req.body);
            res.send(result);
          } catch (e) {
            res.status(500).send((e as Error).message);
          }
        }
      );
    });
  }

  /**
   * Build a "command" with methods bound to the external container's command
   * @param commandName Name of the command to register methods for
   * @returns
   */
  private buildExternalCommandBindings(commandName: string) {
    const containerId = this.#manifest.commands[commandName].containerId;
    const container = this.#manifest.containers[containerId];
    // TODO: Explore https
    const host = `http://${container.ip}:${container.port}`;
    // TODO: Validation of arguments
    const call = async (args: any) => {
      const res = await axios.post(`${host}/command/${commandName}`, args);
      return res.data;
    }
    this.#externalCommands[commandName] = call;
    return call;
  }

  /**
   * Register method routes to bind to a local command
   * @param commandName Name of the command to register routes for
   */
  private buildLocalCommandRoutes(commandName: string) {
    // Run on the Container
    this.#container.ui.debug(
      "Container",
      `Building POST route ${chalk.yellow`/command/${commandName}`}`
    );

    this.#server.post(
      `/command/${commandName}`,
      async (req, res) => {
        try {
          const result = await this.#container.command(commandName, req.body);
          res.send(result);
        } catch (e) {
          res.status(500).send((e as Error).message);
        }
      }
    );
  }
}
