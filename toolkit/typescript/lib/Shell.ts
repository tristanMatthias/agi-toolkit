import chalk from 'chalk';
import inquirer, { QuestionCollection } from 'inquirer';

const typeWriter = async (text?: string, prefix?: string) => {
  if (!text) return;
  if (prefix) process.stdout.write(prefix);
  for (let i = 0; i < text.length; i++) {
    process.stdout.write(text.charAt(i));
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  process.stdout.write('\n');
}

// TODO: Allow for passing in of entity name
export class Shell {
  #colorMessages(color: keyof typeof chalk, ...messages: any[]) {
    const colorize = chalk[color] as (s: string) => string;
    return messages.map(m => {
      if (typeof m === 'string') return colorize(m);
      return m;
    });
  }

  debug(entity: string, ...messages: any[]) {
    console.log(
      '🔧',
      chalk.magenta(`[${entity}]`),
      ...this.#colorMessages("gray", ...messages)
    );
  }

  inform(...messages: any[]) {
    console.log(
      '📣',
      ...this.#colorMessages("gray", ...messages)
    );
  }

  success(...messages: any[]) {
    console.log(
      '✅',
      ...this.#colorMessages("green", ...messages)
    );
  }

  error(entity: string, message: string) {
    console.log('❌', chalk.red(`[${entity}]: ${message}`));
  }

  async say(agentName: string, message: string) {
    return typeWriter(message, `🤖 ${chalk.green(`${agentName}:`)} `);
  }

  prompt(question: QuestionCollection) {
    return inquirer.prompt(question);
  }
}
