import fs from 'fs';
import { Toolkit } from '../../../toolkit/typescript/Toolkit';
import { replaceVariables } from '../../../toolkit/typescript/lib/replaceVariables';
import { ModuleLLMChatMessage, ModuleMemory, ModulePlanner, ModulePlannerTask } from '../../../toolkit/typescript/types';

const promptPlan = fs.readFileSync(__dirname + "/plan.prompt.txt", "utf8");

type SubtaskChild =
  { type: "subtask"; description: string; } |
  { type: "command"; command: string; };

type LLMResponse =
  { type: "subplan", children: SubtaskChild[] } |
  { type: "ask", question: string, context: string } |
  { type: "error", message: string };


export async function planTask(parentTaskId: string, planner: ModulePlanner): Promise<ModulePlannerTask[]> {
  const llm = planner.toolkit.module("llm");
  const memory = planner.toolkit.module("memory");
  const commands = planner.toolkit.getCommandListString();
  const { data: [parentTask] } = await memory.findById({ entity: "task", id: parentTaskId });

  const hierarchy = await getHierarchy(parentTask, memory);

  const prompt = replaceVariables(promptPlan, {
    goal: parentTask.description,
    hierarchy: hierarchy.map(t => t.description).join("\n - "),
    commands
  });

  let plan = (await llm.ask({ prompt, json: true })) as LLMResponse;

  // If LLM asks a clarifying question, continue clarifying until we get a plan/error
  if (plan.type === "ask") {
    plan = await clarifyUntilResult(plan, [
      { content: prompt, role: "user" },
      { content: JSON.stringify(plan), role: "assistant" },
    ], planner.toolkit);
  }

  const result: ModulePlannerTask[] = [];

  // Handle different outputs
  switch (plan.type) {
    case "subplan":
      // Create subtasks and add them to the result
      for (const subtask of plan.children) {
        let task: ModulePlannerTask;
        if (subtask.type === "command") {
          task = await planner.createTask({
            description: `Command: ${subtask.command.split("(")[0]}}`,
            command: subtask.command,
            parentTaskId
          })
        } else {
          task = await planner.createTask({
            description: subtask.description,
            parentTaskId
          });
        }
        result.push(task);
      }
      break;

    case "error":
      throw new Error("LLM error: " + plan.message);

    default:
      throw new Error("Unexpected response from LLM");
  }

  return result;
}

async function getHierarchy(task: ModulePlannerTask, memory: ModuleMemory): Promise<ModulePlannerTask[]> {
  const hierarchy = [];
  let currentTask = task;

  while (currentTask.parentTaskId) {
    const { data: [parentTask] } = await memory.findById({
      entity: "task",
      id: currentTask.parentTaskId
    });
    hierarchy.push(parentTask);
    currentTask = parentTask;
  }
  return hierarchy;
}

async function clarifyUntilResult(
  plan: LLMResponse,
  messageHistory: ModuleLLMChatMessage[],
  tk: Toolkit
): Promise<LLMResponse> {

  // If we get a plan, return it
  if (plan.type != "ask") return plan;

  // Get user's feedback on the plan
  await tk.ui.say("Planner", `I am not sure what to do next. Please help me by answering the following question:\n${plan.question}`);

  const { clarification } = await tk.ui.prompt({
    name: "clarification",
    message: `Feedback:`
  });

  // Send the clarification to LLM with the previous messages
  const messages: ModuleLLMChatMessage[] = [
    ...messageHistory,
    { content: clarification, role: "user" }
  ];
  const res = (await tk.module("llm").chat({ messages, json: true })) as LLMResponse;

  // If LLM asks a clarifying question, continue clarifying until we get a plan/error
  messages.push({ content: JSON.stringify(res), role: "assistant" });
  return clarifyUntilResult(res, messages, tk);
}
