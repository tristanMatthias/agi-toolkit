import { Module } from "../Module/Module"

export interface ModulePlanner extends Module {
  // Create a new task
  createTask(opts: ModulePlannerCreateTaskOptions): Promise<ModulePlannerTask>
  // Returns a task tree
  planTask(opts: ModulePlannerPlanOptions): Promise<ModulePlannerTask[]>
  // Returns a prioritized task tree
  prioritize(opts: ModulePlannerPrioritizeOptions): Promise<ModulePlannerTask[]>
  // Returns a task tree
  getTaskTree(opts: ModulePlannerGetTaskTreeOptions): Promise<ModulePlannerTask>
  // Marks a task as completed
  completeTask(opts: ModulePlannerCompleteTaskOptions): Promise<void>
}

export interface ModulePlannerCreateTaskOptions {
  description: string;
  command?: string;
  parentTaskId?: string;
}

export interface ModulePlannerPlanOptions {
  // The current goal
  taskId: string
}

export interface ModulePlannerPrioritizeOptions {
  // The task tree to prioritize
  taskTree: ModulePlannerTask[]
  // The current context
  context: string
  // The current goal
  goal: string
}

export interface ModulePlannerGetTaskTreeOptions {
  taskId: string
}

export interface ModulePlannerCompleteTaskOptions {
  taskId: string;
  result?: any;
}

export interface ModulePlannerTask {
  id: string;
  parentTaskId?: string;
  description: string;
  command?: string;
  completed: boolean;
  planned: boolean;
  children: ModulePlannerTask[];
}
