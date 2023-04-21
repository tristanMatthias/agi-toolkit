export class ContainerConfigurationFile {
  // TODO: Make this optional for local development
  registryUrl: string;
  port?: number;
  modules: {
    [name: string]: ContainerConfigurationModule
  }
}

export type ContainerConfigurationModule =
  // TODO: Support default modules
  // boolean |
  string |
  ContainerConfigurationModuleSettings;

export interface ContainerConfigurationModuleSettings {
  from: string;
  settings: Record<string, string>
}
