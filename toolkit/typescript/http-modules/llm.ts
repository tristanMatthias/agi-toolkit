import { Module } from "../Module/Module";
import { ModuleLLM, ModuleLLMChatMessage } from "../types";


export default class AutoModuleLLM extends Module implements ModuleLLM {
  chat(messages: ModuleLLMChatMessage[]): Promise<string> {
    return this.request("chat", { messages })
  }
}
