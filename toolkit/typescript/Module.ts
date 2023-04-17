import axios from 'axios';
import { Toolkit } from './Toolkit';
import { ModuleType } from './types';

export class Module {
  // @ts-ignore
  public type: ModuleType;
  constructor(public basePath: string, public toolkit: Toolkit) { }

  async initialize(): Promise<any> {}

  protected async request(path: string, data?: any) {
    const res = await axios.post(`${this.basePath}/${path}`, data);
    return res.data;
  }
}
