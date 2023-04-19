import chalk from "chalk";
import express from "express";
import { Command, CommandConstructor } from "./command/Command";
import Config from "./Configuration";
import { Module } from "./Module/Module";
import { Shell } from "./Shell";
import * as defaultCommands from "./commands";
import { ModuleExecutor, ModuleLLM, ModuleMemory, ModulePlanner, ModuleType } from "./types";
import { ModuleAgent } from "./types/ModuleAgent";

export class Toolkit {
  app = express();
  ui = new Shell();

  constructor(public host: string, public config: Config) { }

  async initialize() {
    Object.keys(this.config.modules).map(type =>
      this.#loadModule(type as ModuleType)
    );

    for (const module of this.#modulesToInitialize) {
      await module.initialize();
    }

    for (const cmd of Object.values(defaultCommands)) {
      this.registerCommand(cmd);
    }
  }

  #modules = new Map<string, Module>();
  #modulesToInitialize = new Set<Module>();

  #loadModule(type: ModuleType) {
    if (this.#modules.has(type)) return this.#modules.get(type);

    const settings = this.config.modules[type];

    const uri = settings.uri ?? this.host;
    // Set a variable called module that's type is the constructor for a Module class
    let constructor: typeof Module;
    let module: Module;

    if (uri.startsWith("http")) {
      // Construct a module from a remote URI
      constructor = require(`./http-modules/${type}`);
      module = new constructor(uri, this);

    } else {
      // Construct a module from a local path
      constructor = require(uri).default;
      if (!constructor) {
        this.ui.error("Toolkit", `Module ${chalk.yellow(type)} not found at ${chalk.blue(uri)}. Does it export a default class?`);
        process.exit(1);
      }
      module = new constructor(this.host, this);
      this.#modulesToInitialize.add(module);
    }


    this.ui.debug("Toolkit", `Loaded module ${chalk.yellow(type)} from ${chalk.blue(uri)}`);
    this.#modules.set(type, module);
    return module;
  }

  module(type: "executor"): ModuleExecutor
  module(type: "memory"): ModuleMemory
  module(type: "llm"): ModuleLLM
  module(type: "planner"): ModulePlanner
  module(type: "agent"): ModuleAgent
  module(type: ModuleType) {
    let m = this.#modules.get(type);

    if (!m) m = this.#loadModule(type)
    if (!m) throw new Error(`Module ${type} not found`);

    switch (type) {
      case "executor":
        return m as unknown as ModuleExecutor;
      case "llm":
        return m as unknown as ModuleMemory;
      case "memory":
        return m as unknown as ModuleLLM;
      case "planner":
        return m as unknown as ModulePlanner;
      case "agent":
        return m as unknown as ModuleAgent;
    }
  }

  #commands = new Map<string, Command>();
  registerCommand(cmd: CommandConstructor) {
    const command = new cmd(this);
    this.#commands.set(command.name, command);
    this.ui.debug("Toolkit", `Registered command ${chalk.yellow(command.name)}`);
  }

  command(name: string) {
    return this.#commands.get(name);
  }

  async runCommand(name: string, args: string[]) {
    const command = this.#commands.get(name);
    if (!command) throw new Error(`Command "${name}" not found`);
    return command.run(args);
  }

  getCommandListString() {
    // TODO: Filter by context
    const commands = Array.from(this.#commands.values());

    let str = "";

    for (const command of commands) {
      str += `${command.name}(${Object.entries(command.args)
        .map(([name, type]) => `${name}: ${type}`)
        .join(", ")})\n`;
    }

    return str;
  }


  start() {
    // Get port from the host property
    const port = parseInt(this.host.split(":")[1]);

    return new Promise<void>(res => {
      this.app.listen(port, this.host, () => {
        console.log(`Server started at ${this.host}:${port}`);
        res();
      });
    })
  }
}
