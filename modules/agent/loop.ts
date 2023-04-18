import chalk from "chalk";
import fs from "fs";
import spin from 'ora';
import { Toolkit } from "../../toolkit/typescript/Toolkit";
import { replaceVariables } from "../../toolkit/typescript/lib/replaceVariables";
import { ModuleExecutor, ModuleLLMChatMessage, ModulePlannerTask } from "../../toolkit/typescript/types";
import { ModuleAgentAgent } from "../../toolkit/typescript/types/ModuleAgent";

// Import promptLoops.txt
const promptLoop = fs.readFileSync(__dirname + "/loop.prompt.txt", "utf8");
const resources = fs.readFileSync(__dirname + "/resources.txt", "utf8");
const performanceEvaluation = fs.readFileSync(__dirname + "/performanceEvaluation.txt", "utf8");
const constraints = fs.readFileSync(__dirname + "/constraints.txt", "utf8");

interface Thoughts {
  text: string;
  reasoning: string;
  plan: string;
  criticism: string;
  speak: string;
}

interface Command {
  name: string;
  args: {
    [key: string]: string;
  };
}

interface LoopResponse {
  thoughts: Thoughts,
  command: Command
};

export default async function (tk: Toolkit, agent: ModuleAgentAgent, tasks: ModulePlannerTask[]) {
  /**
   * 1. Tell it objective
   * 2. It generates it's thoughts/plan/criticism etc
   * 3. It asks for confirmation to execute the command
   * 4. It executes the command
   * 5. Feeds the response back into the loop
   */

  const taskList = tasks.map(t => ` - ${t.description}`).join("\n");
  await tk.ui.say(agent.name, `Starting work on these tasks:\n${taskList}`);

  const llm = tk.module("llm");
  const executor = tk.module("executor");

  // Turn goals into a numbered list
  const goalList = tasks.map((task, i) => `${i + 1}. (ID=${task.id}) ${task.description}`).join("\n");
  const commands = tk.getCommandListString();
  const messages: ModuleLLMChatMessage[] = [];

  // Set initial message to LLM
  const systemMessage = replaceVariables(promptLoop, {
    name: agent.name,
    role: agent.role,
    goals: goalList,
    constraints,
    commands,
    resources,
    performanceEvaluation
  });

  messages.push({ role: "system", content: systemMessage });

  let parseAttempts = 0;
  const maxParseAttempts = 3;

  // Start main agent loop
  while (true) {
    const spinner = spin({ text: "Thinking…", spinner: "toggle4" }).start();
    const resString = (await llm.chat({ messages })) as string;
    spinner.stop();

    // Store response from LLM
    messages.push({ role: "assistant", content: resString });

    let res: LoopResponse;

    // Try to parse response from LLM
    try {
      res = JSON.parse(resString);
      // Reset attempts after successful loop
      parseAttempts = 0;
    } catch (e) {
      // If we can't parse the response, try again
      parseAttempts++;
      if (parseAttempts > maxParseAttempts) {
        tk.ui.error("System", `Error parsing response from LLM. Max attempts reached. Exiting…`);
        return false;
      }
      tk.ui.error("System", `Error parsing response from LLM. Trying again… (Attempt: ${parseAttempts} / ${maxParseAttempts})`);
      messages.push({
        role: "user",
        content: "This response does not contain valid JSON. Please reformat it so it's parsable with JSON.parse()"
      });
      continue;
    }

    const { thoughts, command } = res;
    await tk.ui.say(chalk.yellow("Thoughts"), thoughts.text);
    await tk.ui.say(chalk.yellow("Reasoning"), thoughts.reasoning);
    await tk.ui.say(chalk.yellow("Plan\n"), thoughts.plan);
    await tk.ui.say(chalk.yellow("Criticism"), thoughts.criticism);

    let result: string = "No feedback";
    // If command is defined, run it
    if (command?.name) {
      result = await runCommand(tk, agent, executor, command, messages);

      // Otherwise, ask for feedback (if any)
    } else {
      const { feedback } = await tk.ui.prompt({
        type: "input",
        name: "feedback",
        message: "Do you have any feedback for the agent? (Leave blank if not)"
      });
      if (feedback) result = feedback;
    }

    userMessage(result, messages);
  }
}

const userMessage = (message: string, messages: ModuleLLMChatMessage[]) =>
  messages.push({ role: "user", content: message });

const convertArgsToList = (args: { [key: string]: string }) =>
  Object.keys(args)
    .map(key => ` - ${chalk.magenta(key)}: ${chalk.blue(args[key])}`)
    .join("\n");


const runCommand = async (
  tk: Toolkit,
  agent: ModuleAgentAgent,
  executor: ModuleExecutor,
  command: Command,
  messages: ModuleLLMChatMessage[]
): Promise<string> => {
  try {
    const { name } = command;
    let res: any;
    switch (name) {
      // case "task-status":
      //   res = await executor.executeCommand({
      //     name: "task-status",
      //     args: { taskId }
      //   });
      //   break;

      default:
        await tk.ui.say(
          agent.name,
          `I want to run the ${chalk.yellow(name)} command with arguments:\n${convertArgsToList(command.args)}`
        );

        const { response } = await tk.ui.prompt({
          type: "input",
          name: "response",
          message: [
            `Allow command ${chalk.yellow(name)} to run? You can also give feedback to the agent by just typing.\n`,
            `${chalk.green("?")} Run command? (${chalk.green("yes")}/${chalk.red("no")})`
          ].join("")
        });

        const denied = response.toLowerCase() === "no" || response.toLowerCase() === "n";
        const allowed = response.toLowerCase() === "yes" || response.toLowerCase() === "y" || !response;

        // Command was denied
        if (denied) {
          return `User did not allow command "${name}" to run`;

          // Command was allowed
        } else if (allowed) {
          res = await executor.executeCommand(command);
          await tk.ui.say(agent.name, `I successfully ran the ${chalk.yellow(name)} command`);
          // Push message back to LLM
          return `Command ${name} ran successfully with result:\n${res}`;

          // User gave feedback
        } else {
          return `User did not allow command "${name}" to run, and gave feedback:\n${response}`;
        }
    }

  } catch (e) {
    tk.ui.error(
      "Executor",
      `Error while running command ${chalk.yellow(command.name)}:\n\n${chalk.redBright((e as Error).message)}\n`
    );
    return "Command failed with error: " + (e as Error).message
  }
}
