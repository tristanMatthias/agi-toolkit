import { ModulePlannerTask } from "./ModulePlanner";

export interface ModuleExecutor {
  executeTask(task: ModulePlannerTask): Promise<any>;
}
