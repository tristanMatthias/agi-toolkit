import chalk from "chalk";
import inquirer from "inquirer";
import { Module } from "../../toolkit/typescript/Module";
import { ModuleExecutor, ModulePlannerTask, ModuleType } from "../../toolkit/typescript/types";
import executeTask from "./executeTask";

export default class extends Module implements ModuleExecutor {
  type = "executor" as ModuleType;

  llm = this.toolkit.module("llm");
  memory = this.toolkit.module("memory");
  planner = this.toolkit.module("planner");

  async executeTask(task: ModulePlannerTask) {
    this.toolkit.ui.say("Executor", `Ok, I'll execute task "${task.description}"`);
    const result = await executeTask(task, this.toolkit);
    await this.planner.completeTask({ taskId: task.id, result });
    this.toolkit.ui.success(`Task completed!`);
    return result;
  }
}
