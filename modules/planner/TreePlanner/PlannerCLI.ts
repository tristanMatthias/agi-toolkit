import chalk from 'chalk';
import clear from 'clear';
import { PlannerTreeTask } from './planTask';

export class PlannerCLI {
  #task: PlannerTreeTask;

  plan(task: PlannerTreeTask) {
    this.#task = task;
    this.draw();

    // Wait for user to press a key
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => process.exit(0));
  }

  draw() {
    clear();
    console.log(chalk.bgYellowBright(chalk.black(" Planner ")));
    console.log(chalk.blueBright("\nContext:"));
    this.drawContext();
    this.drawTask(this.#task, true);
  }

  drawContext() {
    for (const task of this.#task.hierarchy) this.drawTask(task);
  }

  drawTask(task: PlannerTreeTask, indent: boolean = false) {
    let prefix = chalk.grey((indent ? ' |' : '') + '->');
    const description = task.id == this.#task.id
      ? chalk.white(task.description)
      : chalk.gray(task.description);
    console.log(`${prefix} ${description}`);
  }
}

const task1 = new PlannerTreeTask('Task 1', undefined, [], 0);
task1.id = "1";
const task2 = new PlannerTreeTask('Task 2', undefined, [task1], 1);
task2.id = "2";
const task3 = new PlannerTreeTask('Task 3', undefined, [task1], 1);
task3.id = "3";
const task4 = new PlannerTreeTask('Task 4', undefined, [task1], 1);
task4.id = "4";
const task5 = new PlannerTreeTask('Task 5', undefined, [task1, task2], 2);
task5.id = "5";
const task6 = new PlannerTreeTask('Task 6', undefined, [task1, task2], 2);
task6.id = "6";
const task7 = new PlannerTreeTask('Task 7', undefined, [task1, task2], 2);
task7.id = "7";

task1.subtasks = [task2, task3, task4];
task2.subtasks = [task5, task6, task7];

const cli = new PlannerCLI();
cli.plan(task6);

// ============
// -> Task 1
// -> Task 2
//  |-> Task 3
//  |-> Task 4

