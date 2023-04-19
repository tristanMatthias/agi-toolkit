import { Module } from "../../toolkit/typescript/Module/Module";
import { ModuleExecutor, ModuleExecutorExecuteCommandOpts, ModulePlannerTask, ModuleType } from "../../toolkit/typescript/types";
import executeTask from "./executeTask";

export default class extends Module implements ModuleExecutor {
  type = "executor" as ModuleType;

  llm = this.toolkit.module("llm");
  memory = this.toolkit.module("memory");
  planner = this.toolkit.module("planner");

  async executeTask(task: ModulePlannerTask) {
    await this.toolkit.ui.say("Executor", `Ok, I'll execute task "${task.description}"`);
    const result = await executeTask(task, this.toolkit);
    await this.planner.completeTask({ taskId: task.id, result });
    this.toolkit.ui.success(`Task completed!`);
    return result;
  }

  async executeCommand(opts: ModuleExecutorExecuteCommandOpts): Promise<any> {
    const cmd = this.toolkit.command(opts.name);
    if (!cmd) throw new Error(`Command ${opts.name} not found`);
    return cmd.run(opts.args);
  }
}
