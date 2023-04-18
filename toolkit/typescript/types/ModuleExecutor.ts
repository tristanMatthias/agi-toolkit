import { ModulePlannerTask } from "./ModulePlanner";

export interface ModuleExecutor {
  executeTask(task: ModulePlannerTask): Promise<any>;
  executeCommand(opts: ModuleExecutorExecuteCommandOpts): Promise<any>;
}

export interface ModuleExecutorExecuteCommandOpts {
  name: string;
  args: {
    [key: string]: string;
  };
}
