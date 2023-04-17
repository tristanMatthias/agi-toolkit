import { Toolkit } from "../../toolkit/typescript/Toolkit";
import { ModulePlannerTask } from "../../toolkit/typescript/types";

export default async function(task: ModulePlannerTask, tk: Toolkit) {
  if (task.completed) return null;
  if (task.children.every(child => child.completed)) return null;

  if (!task.command) throw new Error("Task has no command");

  // Get command and arguments from command string "command-name(arg1: value1, arg2: value2)"
  const command = task.command.match(/(\w+)\((.*)\)/);
  if (!command) throw new Error("Invalid command string");

  const commandName = command[1];
  const commandArgs = command[2].split(",").map(arg => arg.trim());

  // Get command function from toolkit
  const res = await tk.runCommand(commandName, commandArgs);
  return res;
}
