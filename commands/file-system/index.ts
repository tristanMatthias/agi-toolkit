import { Command } from '../../toolkit/typescript/Command';
import fs from 'fs';

export class ReadFile extends Command {
  name = 'read-file';
  args = { path: 'string' };
  run(args: { path: string; content: string }) {
    fs.readFileSync(args.path, 'utf8');
  }
}

export class WriteFile extends Command {
  name = 'write-file';
  args = { path: 'string', content: 'string' };
  run(args: { path: string; content: string }) {
    fs.writeFileSync(args.path, args.content);
  }
}
