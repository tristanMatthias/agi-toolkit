import joi from 'joi';
import { Registry } from '.';
import { Container } from '../Container';
import { ConfigurationFile } from '../lib/ConfigurationFile';
import { RegistryConfigurationFile } from './types';
const FILE_NAME = 'agi.config.yml';

const registryConfigurationFileSchema = joi.object<RegistryConfigurationFile>().keys({
  port: joi.number().required(),
  requiredModules: joi.array().items(joi.string()).required(),
  command: joi.string()
  // TODO: Fix this and remove the unknown(true) below
  // containers: joi.array().items(joi.object().pattern(/.*/, joi.alternatives().try(
  //   joi.string(),
  //   joi.object().keys({
  //     from: joi.string().required(),
  //     settings: joi.object().pattern(/.*/, joi.string())
  //   })
  // )).required())
}).unknown(true);


export class RegistryConfiguration extends ConfigurationFile<RegistryConfigurationFile> {
  constructor(filePath?: string) {
    super({
      type: "registry",
      schema: registryConfigurationFileSchema,
      fileName: FILE_NAME,
      filePath
    });
  }

  async createAndStart() {
    const r = new Registry(this.config);
    await r.start();
    let moduleName: string | undefined;
    let methodName: string | undefined;

    if (this.config.command) {
      [moduleName, methodName] = this.config.command.split('.');
    }
    let commandContainer: Container | undefined;

    // Create containers if specified in the config
    for (const containerConfig of this.config.containers ?? []) {
      containerConfig.registryUrl = `http://localhost:${this.config.port}`;
      const c = new Container(containerConfig);
      if (moduleName && containerConfig.modules[moduleName]) {
        commandContainer = c;
      }
    }

    // Run the command if specified (module.methodName)
    if (commandContainer && moduleName && methodName) {
      await commandContainer.ready();
      const module = commandContainer.module<any>(moduleName);
      return module[methodName]();
    }

    this.shutdown();
  }

  shutdown() {
    process.exit(0);
  }
}
