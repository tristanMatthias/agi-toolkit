import chalk from "chalk";
import inquirer from "inquirer";
import { Module } from "../../toolkit/typescript/Module";
import { ModulePlannerTask, ModuleType } from "../../toolkit/typescript/types";
import { ModuleCLI } from "../../toolkit/typescript/types/ModuleCLI";

type Action =
  { type: "plan", task: ModulePlannerTask } |
  // { type: "prioritize", task: ModulePlannerTask } |
  { type: "execute", task: ModulePlannerTask };

export default class extends Module implements ModuleCLI {
  type = "cli" as ModuleType;

  llm = this.toolkit.module("llm");
  memory = this.toolkit.module("memory");
  executor = this.toolkit.module("executor");
  planner = this.toolkit.module("planner");

  async mainLoop() {
    await this.checkAgentExists();

    // Outer loop for top level task selection/creation
    while (true) {
      let topLevelTask = await this.selectTaskToResume();
      if (!topLevelTask) {
        this.toolkit.ui.say("Executor", "I currently have no tasks to work on. Let's create one!");
        topLevelTask = await this.createTopLevelTask();
      }

      // Inner loop for task execution
      innerLoop:
      while (true) {
        const tree = await this.planner.getTaskTree({ taskId: topLevelTask.id });
        const action = await this.getNextActionFromTree(tree);

        if (!action) {
          this.toolkit.ui.success("All tasks completed!");
          break;
        }

        switch (action.type) {
          case "plan":
            try {
              await this.planner.planTask({ taskId: action.task.id });
            } catch (e) {
              this.toolkit.ui.error(
                "Executor",
                `Sorry, I ran into an error while planning that task with the message:\n\n${chalk.redBright((e as Error).message)}\n`
              );
              this.toolkit.ui.inform("Returning to top level task selection…\n\n");
              break innerLoop;
            }
            break;
          case "execute":
            await this.executor.executeTask(action.task);
            break;
        }
      }
    }
  }

  async checkAgentExists() {
    const agents = await this.memory.query({ entity: "agent", query: {} })
    if (!agents.data.length) {
      await this.createAgent();
    } else {
      const agent = agents.data[0];
      const { confirm } = await this.toolkit.ui.prompt({
        type: "confirm",
        name: "confirm",
        message: `Welcome back! Do you want to continue with ${agent.name}?`
      });

      if (!confirm) {
        await this.createAgent();
      } else {
        this.toolkit.ui.say(agent.name, "Reporting for duty!");
      }
    }
  }

  async createAgent() {
    this.toolkit.ui.inform("Welcome to AGI Toolkit! Let's get started by creating an agent.");
    const { name, role } = await this.toolkit.ui.prompt([
      {
        type: "input",
        name: "name",
        message: "AI Name:",
      },
      {
        type: "input",
        name: "role",
        message: (answers: any) => `AI Role: ${answers.name} is`
      }
    ]);

    await this.memory.create({
      entity: "agent",
      data: { name, role }
    });

    this.toolkit.ui.say(name, "reporting for duty!");
  }

  async selectTaskToResume() {
    const tasks = await this.getTopLevelTasks();
    if (!tasks.length) return;

    const choices = tasks.map<any>(t => t.description);
    choices.push(
      new inquirer.Separator(),
      "No, I want to start a new task"
    )

    const { selection } = await this.toolkit.ui.prompt({
      type: "list",
      name: "selection",
      message: "I found some tasks that you haven't completed. Do you want to resume one of them?",
      choices
    });

    const index = choices.indexOf(selection);
    if (index === choices.length - 1) return;
    const task = tasks[index];
    this.toolkit.ui.say("Executor", `Ok, I'll resume the task "${chalk.yellow(task.description)}"`);
    return task;
  }

  async getTopLevelTasks() {
    const res = await this.memory.query({
      entity: "task",
      query: { completed: false, parentTaskId: null },
    });

    return res.data;
  }

  async createTopLevelTask() {
    const { goal } = await this.toolkit.ui.prompt({
      type: "input",
      name: "goal",
      message: "What do you want me to do?"
    });

    const task = await this.memory.create({
      entity: "task",
      data: {
        description: goal,
        completed: false
      }
    });

    const taskSize = await this.memory.size({ entity: "task" });
    this.toolkit.ui.say("Executor", `Ok, I created a new task for you! You now have ${taskSize} top level tasks.`);
    return task;
  }

  getNextActionFromTree(task: ModulePlannerTask): Action | null {
    if (task.completed) return null;

    if (!task.planned) return { type: "plan", task };

    if (!task.completed && task.children.every(child => child.completed)) {
      return { type: "execute", task };
    }

    for (const child of task.children) {
      const childAction = this.getNextActionFromTree(child);
      if (childAction) return childAction;
    }

    return null;
  }

}
