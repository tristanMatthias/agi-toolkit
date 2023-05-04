import joi from 'joi';
import _ from 'lodash';
import path from 'path';
import { Container } from '../Container';
import { ConfigurationFile } from '../lib/ConfigurationFile';
import { Constructor } from '../lib/types';
import { Module } from './Module';
import { ModuleConfigurationFile } from './types';
const FILE_NAME = 'agi.module.yml';

const configFileSchema = joi.object().keys({
  name: joi.string().required(),
  entry: joi.string().required(),
  settings: joi.object().pattern(/.*/, joi.object().keys({
    type: joi.string().required(),
    required: joi.boolean().default(false),
    default: joi.any()
  }))
});

export class ModuleConfiguration extends ConfigurationFile<ModuleConfigurationFile> {
  private defaultSettings: Record<string, any>;
  private settingsSchema: joi.Schema;
  private module: Constructor<Module>;

  constructor(filePath: string, private container: Container) {
    super({
      type: "module",
      schema: configFileSchema,
      fileName: FILE_NAME,
      filePath
    });
    this.loadSchemaAndModule();;
  }

  protected loadSchemaAndModule() {
    this.settingsSchema = this.buildSettingsSchema(this.config.settings);
    this.defaultSettings = this.getDefaultSettings(this.config.settings);
    const moduleDir = path.dirname(this.filePath);
    const entryPath = path.resolve(moduleDir, this.config.entry);
    const res = require(entryPath);
    if (!res.default) throw new Error(`Module ${entryPath} does not export a default class`);
    this.module = res.default;
  }


  buildSettingsSchema(settings?: ModuleConfigurationFile['settings']) {
    if (!settings) return joi.object();

    const keys: joi.PartialSchemaMap<any> = {};
    for (const [name, setting] of Object.entries(settings)) {
      const { type, required, default: defaultValue } = setting;
      const property = joi[type]();
      if (required) property.required();
      if (defaultValue) property.default(defaultValue);
      keys[name] = property;
    }
    return joi.object().keys(keys);
  }

  getDefaultSettings(settings?: ModuleConfigurationFile['settings']) {
    if (!settings) return {};
    const defaults: Record<string, any> = {};
    for (const [name, setting] of Object.entries(settings)) {
      const { default: defaultValue } = setting;
      if (defaultValue) defaults[name] = defaultValue;
    }
    return defaults;
  }

  initialize(args: Record<string, any>) {
    const mergedSettings = _.merge({}, this.defaultSettings, args);
    const { error } = this.settingsSchema.validate(mergedSettings);
    this.handleValidationError(error);
    return new this.module(this.container, mergedSettings);
  }
}


