import * as dotenv from 'dotenv';
import fs from 'fs';
import * as _ from 'lodash';
import path from 'path';
import yaml from 'yaml';
import { AGIToolkitConfiguration } from './types/Configuration';
dotenv.config();

const CONFIG_FILENAMES = "agi.config.yml"

export default class Configuration implements AGIToolkitConfiguration {

  modules: AGIToolkitConfiguration['modules'] = {
    executor: {
      uri: path.resolve(__dirname, "../../modules/executor")
    },
    llm: {
      uri: path.resolve(__dirname, "../../modules/llm/openai")
    },
    memory: {
      uri: path.resolve(__dirname, "../../modules/memory/sqlite"),
      database: "./memory.db"
    },
    planner: {
      uri: path.resolve(__dirname, "../../modules/planner/TreePlanner")
    },
  }

  constructor() {
    const rawYaml = fs.readFileSync(CONFIG_FILENAMES, 'utf8');
    // Replace ${ENV_VAR} with the value of ENV_VAR
    const config = rawYaml.replace(/\$\{(\w+)\}/g, (_, name) => process.env[name] || '');
    const json = yaml.parse(config);
    _.merge(this, json);
  }
}
