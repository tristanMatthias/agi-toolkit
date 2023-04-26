import { Container } from "@agi-toolkit//Container";
import { Module } from "@agi-toolkit//Module/Module";
import { ModuleLLM, ModuleLLMAskOptions, ModuleLLMChatMessage, ModuleLLMChatOptions, ModuleType } from "@agi-toolkit//types";
import fs from "fs";
import * as OpenAI from "openai";
import path from "path";
import { truncateHistoryToTokenSize } from "./tokens";

interface ModuleOpenAIConfig {
  apiKey: string;
  model: string;
  tokenLimit: number;
}

export default class ModuleOpenAI extends Module<ModuleOpenAIConfig> implements ModuleLLM {
  type = "llm" as ModuleType;

  #config: OpenAI.Configuration;
  #modelType: string;
  #api: OpenAI.OpenAIApi;

  constructor(container: Container, protected config: ModuleOpenAIConfig) {
    super(container);
    this.#config = new OpenAI.Configuration({
      apiKey: config.apiKey
    });
    this.#modelType = config.model;
    this.#api = new OpenAI.OpenAIApi(this.#config);
  }

  async ask(data: ModuleLLMAskOptions) {
    return this.chat({
      messages: [{ content: data.prompt, role: "user" }],
      json: data.json
    });
  }

  async chat(opts: ModuleLLMChatOptions): Promise<string> {
    const messages = await truncateHistoryToTokenSize(opts.messages, this.config!.tokenLimit);
    // Log the last message
    this.#log(opts.messages[opts.messages.length - 1]);
    const res = await this.#api.createChatCompletion({
      model: this.#modelType as string,
      messages
    });
    const data = res.data.choices[0].message?.content!;
    // Log the response
    this.#log({ content: data, role: "assistant" });
    return opts.json ? this.#convertToJSON(data) : data;
  }

  async #convertToJSON(data: string) {
    try {
      return JSON.parse(data);
    } catch (e) {
      this.container.ui.error("llm", `Failed to parse JSON from OpenAI:\n\n${data}`);
    }
  }

  #log(message: ModuleLLMChatMessage) {
    // Write to the ./chat.log file
    fs.appendFileSync(
      path.resolve(process.cwd(), "./chat.log"),
      JSON.stringify(message, null, 2) + "\n====================\n"
    );
  }
}
