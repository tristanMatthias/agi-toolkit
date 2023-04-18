import fs from 'fs';
import path from 'path';
import { Command } from '../../toolkit/typescript/Command';

const workingDir = path.join(process.cwd(), '.agi-workspace');

function getSafePath(p: string) {
  // Join paths, and ensure that the path is within the working directory
  const joined = path.join(workingDir, p);
  if (!joined.startsWith(workingDir)) {
    throw new Error('Path is outside of the working directory');
  }
  return joined;
}

export class ReadFile extends Command {
  name = 'read-file';
  args = { path: '<path of the file to save>' };
  run(args: { path: string; }) {
    return fs.readFileSync(getSafePath(args.path), 'utf8');
  }
}

export class WriteFile extends Command {
  name = 'write-file';
  args = { path: '<path of the file to save>', content: '<content of the file>' };
  run(args: { path: string; content: string }) {
    // Make sure the directory exists
    fs.mkdirSync(path.dirname(getSafePath(args.path)), { recursive: true });
    // Write the file
    fs.writeFileSync(getSafePath(args.path), args.content);
    return "File written"
  }
}

export class ListFiles extends Command {
  name = 'list-files';
  args = { path: '<path to the directory to list>' };
  run(args: { path: string; }) {
    return fs.readdirSync(getSafePath(args.path));
  }
}
