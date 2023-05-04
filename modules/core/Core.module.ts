import { Module } from "@agi-toolkit/Module";
import * as cmd from './commands';

export default class CoreModule extends Module {
  name = "core";
  commands = [
    new cmd.CommandReadFile(this.container),
    new cmd.CommandWriteFile(this.container),
    new cmd.CommandReadDirectory(this.container),
    new cmd.CommandCompleteTask(this.container),
  ]
}
