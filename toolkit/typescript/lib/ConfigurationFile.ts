import chalk from "chalk";
import dotenv from "dotenv";
import fs from "fs";
import Joi from "joi";
import yaml from "js-yaml";
import path from "path";
import { Shell } from "./Shell";
dotenv.config();

export interface ConfigurationFileOptions {
  type: string;
  schema: Joi.Schema;
  fileName: string;
  filePath?: string;
}
export class ConfigurationFile<Config = any> {
  config: Config;
  protected type: string;
  protected fileName: string;
  protected filePath: string;
  protected schema: Joi.Schema;
  protected ui = new Shell();

  constructor(opts: ConfigurationFileOptions) {
    this.type = opts.type;
    this.fileName = opts.fileName;
    this.schema = opts.schema;
    this.filePath = opts.filePath || path.resolve(process.cwd(), this.fileName)

    // Support for passing in a directory
    if (!this.filePath.endsWith('.yml')) {
      this.filePath = path.resolve(this.filePath, this.fileName);
    }
    this.loadAndValidate();
  }

  protected loadAndValidate() {
    let data: string;
    try {
      data = fs.readFileSync(this.filePath, 'utf8');
      // Replace any environment variables
      data = data.replace(/\$\{([^\}]+)\}/g, (_, name) => process.env[name] || '');
    } catch (e) {
      this.ui.error(
        this.constructor.name,
        `Could not find ${this.type} configuration file ${chalk.yellow(this.filePath)}`
      );
      process.exit(1);
    }
    this.config = yaml.load(data) as Config;

    const { error } = this.schema.validate(this.config);
    this.handleValidationError(error);
  }

  protected handleValidationError(error?: Joi.ValidationError) {
    if (!error) return;
    const errors = error.details.map(d => ` - ${d.message}`).join('\n');
    this.ui.error(
      this.constructor.name,
      `Invalid ${this.type} configuration file ${chalk.yellow(this.filePath)}\nFailed with errors:\n${errors}`
    );
    process.exit(1);
  }
}
