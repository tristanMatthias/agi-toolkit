import { Command } from "../Command"

interface CommandCompleteTaskArgs {
  taskId: string;
  result?: string;
}

export class CommandCompleteTask extends Command {
  name = "complete-task"
  description = "Complete a task"
  args = {
    taskId: "<id of the task to complete>",
    result: "<optional result details>",
  }

  #planner = this.tk.module("planner");

  run(args: CommandCompleteTaskArgs) {
    return this.#planner.completeTask({ taskId: args.taskId });
  }
}
