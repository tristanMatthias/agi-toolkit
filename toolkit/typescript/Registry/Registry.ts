import chalk from 'chalk';
import express from 'express';
import { Server } from 'http';
import { ServerOptions, Socket, Server as WSServer } from 'socket.io';
import { Shell } from '../lib/Shell';
import { RegistryConfigurationFile, RegistryContainerMetadata, RegistryEvent, RegistryManifest } from './types';

const ioConfig: Partial<ServerOptions> = {
  cors: {
    origin: '*',
  },
};

enum ContainerStatus {
  Unprepared = 'unprepared',
  Prepared = 'prepared',
  Initialized = 'initialized',
}

export class Registry {
  private app = express();
  private httpServer = new Server(this.app);
  private io = new WSServer(this.httpServer, ioConfig);
  private requiredModules: string[] = [];
  private manifest: RegistryManifest = {
    containers: {},
    modules: {},
    commands: {}
  };
  private agentStatuses: Record<string, ContainerStatus> = {};
  private ui = new Shell();

  constructor(private config: RegistryConfigurationFile) {
    this.parseConfig(config);

    this.io.on(RegistryEvent.Connection, (socket: Socket) => {
      this.inform("Connection", socket.handshake.address)
      socket.on(RegistryEvent.Disconnect, this.onDisconnect(socket).bind(this));
      socket.on(RegistryEvent.ContainerPrepared, this.onContainerPrepared.bind(this));
      socket.on(RegistryEvent.ContainerInitialized, this.onContainerInitialized.bind(this));
    });

    this.app.use(express.json());
    this.app.post("/register", this.onContainerRegistration.bind(this));
  }

  private parseConfig(config: RegistryConfigurationFile) {
    for (const module of config.requiredModules) {
      if (this.requiredModules.includes(module)) {
        throw new Error(`Module ${module} is required more than once`);
      }
      this.requiredModules.push(module);
    }
  }

  private onContainerRegistration(req: express.Request, res: express.Response) {
    const metadata: RegistryContainerMetadata = req.body;
    const commands: string[] = [];
    const modules: string[] = [];

    try {
      for (const moduleName in metadata.modules) {
        if (this.manifest.modules[moduleName]) {
          throw new Error(`Module "${moduleName}" is already registered`);
        }

        modules.push(moduleName);
        const module = metadata.modules[moduleName];
        this.manifest.modules[moduleName] = {
          containerId: metadata.id,
          ...module
        };

        for (const cmdName in module.commands) {
          const params = module.commands[cmdName];
          if (this.manifest.commands[cmdName]) {
            throw new Error(`Command "${cmdName}" is already registered`);
          }
          commands.push(cmdName);
          this.manifest.commands[cmdName] = {
            containerId: metadata.id,
            moduleName,
            params
          };
        }
      }

      this.manifest.containers[metadata.id] = {
        ip: req.ip,
        port: metadata.port,
        commands,
        modules
      };
      this.agentStatuses[metadata.id] = ContainerStatus.Unprepared;
      this.inform("Registration", metadata.id);

      if (this.checkIfAllContainersAreRegistered()) {
        this.io.emit(RegistryEvent.RegistrationClosed, this.manifest);
        this.ui.success('All required modules are registered');
        this.ui.inform(`Sending ${RegistryEvent.RegistrationClosed} event to all Containers`);
      }

      return res.send({ success: true });

    } catch (e) {
      const error = (e as Error).message;
      this.ui.error("Registry", `Container ${chalk.yellow(metadata.id)} registration failed: ${chalk.redBright(error)}`);
      return res.status(400).send({ error });
    }
  }

  private checkIfAllContainersAreRegistered() {
    for (const module of this.requiredModules) {
      if (!this.manifest.modules[module]) return false;
    }
    return true;
  }

  private onDisconnect(socket: Socket) {
    return () => this.ui.error("Registry", `Container disconnected ${socket.handshake.address}`);
  }

  private onContainerPrepared(ContainerId: string) {
    this.inform(RegistryEvent.ContainerPrepared, ContainerId);
    this.agentStatuses[ContainerId] = ContainerStatus.Prepared;
    if (this.checkIfAllContainersArePrepared()) {
      this.io.emit(RegistryEvent.Initialize);
      this.ui.inform('Sending initialize event to all Containers');
    }
  }

  private checkIfAllContainersArePrepared() {
    for (const ContainerId in this.agentStatuses) {
      if (this.agentStatuses[ContainerId] != ContainerStatus.Prepared) {
        return false;
      }
    }
    return true;
  }

  private onContainerInitialized(ContainerId: string) {
    this.inform(RegistryEvent.ContainerInitialized, ContainerId);
    this.agentStatuses[ContainerId] = ContainerStatus.Initialized;
    if (this.checkIfAllContainersAreInitialized()) {
      this.io.emit(RegistryEvent.Started);
      this.ui.inform('Sending started event to all Containers');
      this.ui.success('All Containers are initialized');
    }
  }

  private checkIfAllContainersAreInitialized() {
    for (const ContainerId in this.agentStatuses) {
      if (this.agentStatuses[ContainerId] != ContainerStatus.Initialized) {
        return false;
      }
    }
    return true;
  }


  private inform(event: string, id: string) {
    this.ui.inform(`${chalk.yellow(event)}: ${chalk.blue(id)}`);
  }

  start() {
    return new Promise<void>(resolve => {
      this.httpServer.listen(this.config.port, () => {
        this.ui.success(`Registry listening on port ${this.config.port}`);
        resolve();
      });
    });
  }
}
