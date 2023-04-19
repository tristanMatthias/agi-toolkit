import { Command } from "../../toolkit/typescript/command/Command";

interface TaskStatusArgs {
  taskId: string;
}

export class TaskStatus extends Command {
  name = "task-status";
  label = "Task status";
  args = {
    taskId: "<taskId>"
  };

  async run({ taskId }: TaskStatusArgs) {
    await this.tk.module("planner").getTaskTree({ taskId });
  }
}
