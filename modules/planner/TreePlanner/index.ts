import { Module } from "../../../toolkit/typescript/Module";
import { registerPost } from "../../../toolkit/typescript/lib/registerPath";
import {
  ModulePlanner,
  ModulePlannerCompleteTaskOptions,
  ModulePlannerCreateTaskOptions,
  ModulePlannerGetTaskTreeOptions,
  ModulePlannerPlanOptions,
  ModulePlannerPrioritizeOptions,
  ModulePlannerTask,
  ModuleType
} from "../../../toolkit/typescript/types";
import getTaskTree from "./getTaskTree";
import { planTask } from "./planTask";


export default class TreePlanner extends Module implements ModulePlanner {
  type = "planner" as ModuleType

  llm = this.toolkit.module("llm");
  memory = this.toolkit.module("memory");

  @registerPost("/completeTask")
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

  @registerPost("/planTask")
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

  @registerPost("/getTaskTree")
  async getTaskTree({ taskId }: ModulePlannerGetTaskTreeOptions) {
    return getTaskTree(taskId, this.memory);
  }

  @registerPost("/completeTask")
  async completeTask({ taskId }: ModulePlannerCompleteTaskOptions) {
    const task = await this.memory.findById({ entity: "task", id: taskId });
    task.completed = true;

    await this.memory.update({
      entity: "task",
      data: task
    });

    this.toolkit.ui.success(`Completed task: ${task.description.slice(0, 20)}...`);

    if (task.parentTaskId) {
      // Check if each subtask is completed
      const { data: subtasks } = await this.memory.query({
        entity: "task",
        query: { parentTaskId: task.parentTaskId }
      });

      // If all subtasks are completed, complete the parent task
      if (subtasks.every(subtask => subtask.completed)) {
        await this.completeTask(task.parentTaskId);
      }
    }
  }
}
