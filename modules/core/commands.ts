import fs from 'fs';
import path from 'path';
import { Command } from '@agi-toolkit/Command/Command';
import { ModulePlanner } from '@agi-toolkit/types';

const workingDir = path.join(process.cwd(), '.agi-workspace');

function getSafePath(p: string) {
  // Join paths, and ensure that the path is within the working directory
  const joined = path.join(workingDir, p);
  if (!joined.startsWith(workingDir)) {
    throw new Error('Path is outside of the working directory');
  }
  return joined;
}

export class CommandReadFile extends Command {
  name = 'read-file';
  args = { path: '<path of the file to save>' };
  async run(args: { path: string; }) {
    return fs.readFileSync(getSafePath(args.path), 'utf8');
  }
}

export class CommandWriteFile extends Command {
  name = 'write-file';
  args = { path: '<path of the file to save>', content: '<content of the file>' };
  async run(args: { path: string; content: string }) {
    // Make sure the directory exists
    fs.mkdirSync(path.dirname(getSafePath(args.path)), { recursive: true });
    // Write the file
    fs.writeFileSync(getSafePath(args.path), args.content);
    return "File written"
  }
}

export class CommandListFiles extends Command {
  name = 'list-files';
  args = { path: '<path to the directory to list>' };
  async run(args: { path: string; }) {
    // List all files and directories in the given path
    const basePath = getSafePath(args.path);
    return fs.readdirSync(basePath).map((p) => {
      const fullPath = path.join(basePath, p);
      if (fs.statSync(fullPath).isDirectory()) return `${p}/`;
      else return p;
    }).join('\n');
  }
}


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

  #planner: ModulePlanner;

  async initialize() {
    this.#planner = this.container.module<ModulePlanner>("planner");
  }

  run(args: CommandCompleteTaskArgs) {
    return this.#planner.completeTask({ taskId: args.taskId });
  }
}
