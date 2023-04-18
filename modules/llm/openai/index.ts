import fs from "fs";
import * as OpenAI from "openai";
import path from "path";
import { Module } from "../../../toolkit/typescript/Module";
import { registerPost } from "../../../toolkit/typescript/lib/registerPath";
import { ModuleLLM, ModuleLLMAskOptions, ModuleLLMChatMessage, ModuleLLMChatOptions, ModuleType } from "../../../toolkit/typescript/types";

export default class ModuleOpenAI extends Module implements ModuleLLM {
  type = "llm" as ModuleType;

  #config = new OpenAI.Configuration({
    apiKey: this.toolkit.config.modules.llm.apiKey
  });
  #modelType = this.toolkit.config.modules.llm.model

  #api = new OpenAI.OpenAIApi(this.#config);

  async ask(data: ModuleLLMAskOptions) {
    return this.chat({
      messages: [{ content: data.prompt, role: "user" }],
      json: data.json
    });
  }

  @registerPost("chat")
  async chat(opts: ModuleLLMChatOptions): Promise<string> {
    // Log the last message
    this.#log(opts.messages[opts.messages.length - 1]);
    const res = await this.#api.createChatCompletion({
      model: this.#modelType as string,
      messages: opts.messages
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
      this.toolkit.ui.error("llm", `Failed to parse JSON from OpenAI:\n\n${data}`);
    }
  }

  #log(message: ModuleLLMChatMessage) {
    // Write to the ./log.txt file
    fs.appendFileSync(
      path.resolve(__dirname, "./log.txt"),
      JSON.stringify(message, null, 2) + "\n====================\n"
    );
  }
}
