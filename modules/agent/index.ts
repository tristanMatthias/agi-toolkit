import chalk from "chalk";
import inquirer from "inquirer";
import { Module } from "../../toolkit/typescript/Module/Module";
import { ModulePlannerTask, ModuleType } from "../../toolkit/typescript/types";
import { ModuleAgent, ModuleAgentAgent } from "../../toolkit/typescript/types/ModuleAgent";
import loop from "./loop";

type Action =
  { type: "plan", task: ModulePlannerTask } |
  // { type: "prioritize", task: ModulePlannerTask } |
  { type: "execute", task: ModulePlannerTask };

export default class extends Module implements ModuleAgent {
  type = "agent" as ModuleType;

  llm = this.toolkit.module("llm");
  memory = this.toolkit.module("memory");
  executor = this.toolkit.module("executor");
  planner = this.toolkit.module("planner");

  agent?: ModuleAgentAgent;

  async mainLoop() {
    const {agent, tasks} = await this.setup();
    await loop(this.toolkit, agent, tasks);
    await this.toolkit.ui.say(agent.name, "Goodbye!");
  }

  async setup() {
    const agent = await this.selectAgent();

    let { data: tasks } = await this.memory
      .query({ entity: "task", query: { completed: false } });

    if (!tasks.length) {
      await this.toolkit.ui.say(agent.name, "I currently have no tasks to work on.");
      tasks = await this.createTopLevelTasks();
    } else {
      const taskList = tasks.map(t => ` - ${t.description}`).join("\n");
      await this.toolkit.ui.say(agent.name, `Here are my current tasks:\n${taskList}`);
      const { confirm } = await this.toolkit.ui.prompt({
        type: "confirm",
        name: "confirm",
        message: "Would you like to resume working on these tasks?"
      });

      if (!confirm) {
        await this.toolkit.ui.say(agent.name, "Ok, let's create some new tasks.");
        tasks = await this.createTopLevelTasks();
      }
    }

    return { agent, tasks };
  }

  async selectAgent(): Promise<ModuleAgentAgent> {
    const agents = await this.memory.query({ entity: "agent", query: {} })
    if (!agents.data.length) {
      this.toolkit.ui.inform("Welcome to AGI Toolkit! Let's get started by creating an agent.");
      return this.createAgent();
    }

    const strNewAgent = "Create new agent";
    const choices = [
      ...agents.data.map(a => a.name),
      new inquirer.Separator(),
      strNewAgent
    ]

    const { selection } = await this.toolkit.ui.prompt({
      type: "list",
      choices,
      name: "selection",
      message: `Welcome back! Please select an agent you want to work with:`
    });

    if (selection === strNewAgent) return this.createAgent();
    const agent = agents.data.find(a => a.name === selection);
    await this.toolkit.ui.say(agent.name, "reporting for duty!");
    this.agent = agent;
    return agent;
  }

  async createAgent(): Promise<ModuleAgentAgent> {
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

    const agent = await this.memory.create({
      entity: "agent",
      data: { name, role }
    });

    await this.toolkit.ui.say(name, "reporting for duty!");
    this.agent = agent;
    return agent;
  }

  async selectTaskToResume() {
    if (!this.agent) throw new Error("No agent selected");

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
    await this.toolkit.ui.say(this.agent.name, `Ok, I'll resume the task "${chalk.yellow(task.description)}"`);
    return task;
  }

  async getTopLevelTasks() {
    const res = await this.memory.query({
      entity: "task",
      query: { completed: false, parentTaskId: null },
    });

    return res.data;
  }

  async createTopLevelTasks() {
    if (!this.agent) throw new Error("No agent selected");
    await this.toolkit.ui.say(this.agent.name, "Let's create some things for me to do (Enter nothing to finish)");

    let count = 0;
    const tasks: ModulePlannerTask[] = [];

    while (count < 10) {
      const { description } = await this.toolkit.ui.prompt({
        type: "input",
        name: "description",
        message: `Task ${count + 1}:`
      });

      if (!description) break;

      const task = await this.memory.create({
        entity: "task",
        data: { description, completed: false }
      });

      tasks.push(task);
      count += 1;
    }

    const taskSize = await this.memory.size({ entity: "task", query: { completed: false } });
    await this.toolkit.ui.say(this.agent.name, `Ok, I created a new task for you! I now have ${taskSize} tasks.`);
    return tasks;
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
