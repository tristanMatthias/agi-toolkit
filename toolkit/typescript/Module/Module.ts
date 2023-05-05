import { Container } from '../Container';
import { RegistryModuleParametersMetadata } from '../Registry';
import { Command } from '../Command/Command';
import { ModuleType } from '../types';

export class Module<Config = Record<string, any>> {
  public name: string;
  public type: ModuleType;
  public methods: RegistryModuleParametersMetadata = {};
  public commands: Command[] = [];

  constructor(public container: Container, protected config?: Config) { }

  async initialize(): Promise<any> {
    await Promise.all(this.commands.map(command => command.initialize()));
  }

  async destroy() { }
}
