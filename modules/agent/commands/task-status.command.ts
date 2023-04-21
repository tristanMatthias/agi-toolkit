import { Command } from "@agi-toolkit/Command/Command";
import { ModulePlanner } from "@agi-toolkit/types";

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
    await this.container.module<ModulePlanner>("planner").getTaskTree({ taskId });
  }
}
