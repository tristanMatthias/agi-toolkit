import { ContainerConfigurationFile } from "../Container";

// =============================================================== Configuration
export class RegistryConfigurationFile {
  port?: number
  requiredModules: string[];
  command?: string;
  containers?: Exclude<ContainerConfigurationFile, 'registryUrl'>[]
}

// ================================================= Metadata (from Container)
export interface RegistryContainerMetadata {
  id: string;
  port: number;
  modules: Record<string, RegistryModuleMetadata>
}

export interface RegistryModuleMetadata {
  methods: RegistryModuleParametersMetadata;
  commands: RegistryModuleParametersMetadata;
}

export interface RegistryModuleParametersMetadata {
  [name: string]: {
    [param: string]: string
  }
}


// =========================================================== Registry Manifest
export interface RegistryManifest {
  containers: Record<string, RegistryManifestContainer>;
  modules: Record<string, RegistryManifestModule>;
  commands: Record<string, RegistryManifestCommand>;
}

export interface RegistryManifestContainer {
  ip: string;
  port: number;
  modules: string[];
  commands: string[];
}

export interface RegistryManifestModule {
  containerId: string;
  methods: RegistryModuleParametersMetadata;
}

export interface RegistryManifestCommand {
  containerId: string;
  moduleName: string;
  params: Record<string, string>
}

export enum RegistryEvent {
  Connection = 'connection',
  Disconnect = 'disconnect',
  RegistrationClosed = 'registration-closed',
  ContainerPrepared = 'module-agent-prepared',
  Initialize = 'initialize',
  ContainerInitialized = 'module-agent-initialized',
  Started = 'started',
}
