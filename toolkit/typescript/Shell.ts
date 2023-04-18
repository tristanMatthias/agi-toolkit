import chalk from 'chalk';
import inquirer, { QuestionCollection } from 'inquirer';

const typeWriter = async (text?: string, prefix?: string) => {
  if (!text) return;
  if (prefix) process.stdout.write(prefix);
  for (let i = 0; i < text.length; i++) {
    process.stdout.write(text.charAt(i));
    await new Promise(resolve => setTimeout(resolve, 15));
  }
  process.stdout.write('\n');
}

export class Shell {
  debug(entity: string, message: string) {
    console.log('🔧', chalk.magenta(`[${entity}]`), chalk.grey(message));
  }

  inform(message: string) {
    console.log('📣', chalk.gray(message));
  }

  success(message: string) {
    console.log('✅', chalk.green(message));
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
