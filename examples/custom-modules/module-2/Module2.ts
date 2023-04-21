import { Module } from '@agi-toolkit/Module';

export class Module2 extends Module {
  public name = 'module-2';

  async testMethod() {
    return "Test method from module 2"
  }
}

export default Module2;
