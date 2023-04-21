import { Module } from "@agi-toolkit//Module/Module";
import {
  ModuleLLM,
  ModuleMemory,
  ModulePlanner,
  ModulePlannerCompleteTaskOptions,
  ModulePlannerCreateTaskOptions,
  ModulePlannerGetTaskTreeOptions,
  ModulePlannerPlanOptions,
  ModulePlannerPrioritizeOptions,
  ModulePlannerTask,
  ModuleType
} from "@agi-toolkit//types";
import getTaskTree from "./getTaskTree";
import { planTask } from "./planTask";


export default class TreePlanner extends Module implements ModulePlanner {
  type = "planner" as ModuleType
  llm: ModuleLLM;
  memory: ModuleMemory;

  async initialize() {
    await super.initialize();
    this.llm = this.container.module("llm");
    this.memory = this.container.module("memory");
  }

  async createTask(opts: ModulePlannerCreateTaskOptions): Promise<ModulePlannerTask> {
    return this.memory.create({
      entity: "task",
      data: {
        completed: false,
        planned: false,
        ...opts
      }
    });
  }

  async planTask(opts: ModulePlannerPlanOptions): Promise<ModulePlannerTask[]> {
    return planTask(opts.taskId, this);
  }

  async prioritize(opts: ModulePlannerPrioritizeOptions) {
    return []
    // const JSON = opts.taskTree;

    // const prompt = replaceVariables(promptPrioritize, {
    //   hierarchy: opts.context,
    //   task: opts.goal,
    //   tasks: JSON
    // });

    // this.llm.ask({ prompt });
  }

  async getTaskTree({ taskId }: ModulePlannerGetTaskTreeOptions) {
    return getTaskTree(taskId, this.memory);
  }

  async completeTask({ taskId }: ModulePlannerCompleteTaskOptions) {
    const { data: task } = await this.memory.findById({ entity: "task", id: taskId });
    task.completed = true;

    await this.memory.update({
      entity: "task",
      data: task
    });

    this.container.ui.success(`Completed task: ${task.description.slice(0, 100)}...`);

    // if (task.parentTaskId) {
    //   // Check if each subtask is completed
    //   const { data: subtasks } = await this.memory.query({
    //     entity: "task",
    //     query: { parentTaskId: task.parentTaskId }
    //   });

    //   // If all subtasks are completed, complete the parent task
    //   if (subtasks.every(subtask => subtask.completed)) {
    //     await this.completeTask(task.parentTaskId);
    //   }
    // }
  }
}
