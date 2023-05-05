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
}
