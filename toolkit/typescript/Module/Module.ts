import axios from 'axios';
import { Toolkit } from '../Toolkit';
import { ModuleType } from '../types';
import { Command } from '../Command';

export class Module {
  public name: string;
  public type: ModuleType;
  #commands: Command[] = [];

  constructor(public basePath: string, public toolkit: Toolkit) { }

  protected addCommand(command: Command) {
    this.#commands.push(command);
  }

  async initialize(): Promise<any> {}

  protected async request(path: string, data?: any) {
    const res = await axios.post(`${this.basePath}/${path}`, data);
    return res.data;
  }
}
