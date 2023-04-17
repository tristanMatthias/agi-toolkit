import chalk from 'chalk';
import inquirer, { QuestionCollection } from 'inquirer';

export class Shell {
  debug(entity: string, message: string) {
    console.log('ℹ️', chalk.yellow(`[${entity}]`), chalk.grey(message));
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

  say(agentName: string, message: string) {
    console.log('🤖', chalk.green(`${agentName}:`), message);
  }

  prompt(question: QuestionCollection) {
    return inquirer.prompt(question);
  }
}
