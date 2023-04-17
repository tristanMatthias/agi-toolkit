export interface ModuleExecutor {
  mainLoop(): Promise<void>;
}
