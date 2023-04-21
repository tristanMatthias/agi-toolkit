import { Module } from '@agi-toolkit/Module';
import Module2 from '../module-2/Module2';

export class Module1 extends Module {
  public name = 'module-1';

  async testMethod() {
    console.log(await this.container.module<Module2>("module-2").testMethod());
    return "Test method from module 2"
  }
}

export default Module1;
