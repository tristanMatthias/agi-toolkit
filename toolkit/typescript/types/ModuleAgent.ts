export interface ModuleAgent {
  mainLoop(): Promise<void>;
}


export interface ModuleAgentAgent {
  id: string;
  name: string;
  role: string;
}
