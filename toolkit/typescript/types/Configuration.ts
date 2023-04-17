export type ModuleType =
  "executor" |
  "llm" |
  "memory" |
  "planner" |
  "cli";

export interface AGIToolkitConfiguration {
  modules: Record<ModuleType, AGIToolkitConfigurationModule>

  tasks?: {
    [key: string]: string;
  }
}

export interface AGIToolkitConfigurationModule {
  uri?: string;
  [key: string]: any;
}
