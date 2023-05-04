import { Module } from "@agi-toolkit/Module/Module";
import { ModuleExecutor, ModuleExecutorExecuteCommandOpts, ModuleLLM, ModuleData, ModulePlanner, ModulePlannerTask, ModuleType } from "@agi-toolkit/types";
import executeTask from "./executeTask";

export default class extends Module implements ModuleExecutor {
  type = "executor" as ModuleType;

  llm: ModuleLLM
  data: ModuleData
  planner: ModulePlanner
  async initialize() {
    await super.initialize();
    this.llm = this.container.module("llm");
    this.data = this.container.module("data");
    this.planner = this.container.module("planner");
  }

  async executeTask(task: ModulePlannerTask) {
    await this.container.ui.say("Executor", `Ok, I'll execute task "${task.description}"`);
    const result = await executeTask(task, this.container);
    await this.planner.completeTask({ taskId: task.id, result });
    this.container.ui.success(`Task completed!`);
    return result;
  }

  async executeCommand(opts: ModuleExecutorExecuteCommandOpts): Promise<any> {
    return this.container.command(opts.name, opts.args);
  }
}
