export interface ModuleConfigurationFile {
  name: string;
  entry: string;
  settings: Record<string, ModuleConfigurationFileSetting>;
}

export interface ModuleConfigurationFileSetting {
  type: "string" | "number" | "boolean";
  default: string | number | boolean;
  description: string;
  required: boolean;
}
