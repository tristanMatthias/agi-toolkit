import joi from 'joi';
import { Container } from '.';
import { ConfigurationFile } from '../lib/ConfigurationFile';
import { ContainerConfigurationFile } from './types';
const FILE_NAME = 'agi.container.yml';

// TODO: Add validation
export const containerConfigurationFileSchema = joi.object().keys({
  registryUrl: joi.string().required(),
  port: joi.number(),
  modules: joi.object().pattern(/.*/, joi.alternatives().try(
    joi.string(),
    joi.object().keys({
      from: joi.string().required(),
      settings: joi.object().pattern(/.*/, joi.string())
    })
  )).required()
});


export class ContainerConfiguration extends ConfigurationFile<ContainerConfigurationFile> {
  constructor(filePath?: string) {
    super({
      type: "container",
      schema: containerConfigurationFileSchema,
      fileName: FILE_NAME,
      filePath
    });
  }

  async initialize() {
    return new Container(this.config);
  }
}
