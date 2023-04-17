import { ChatCompletionRequestMessageRoleEnum } from "openai";

export interface ModuleLLMChatMessage {
  content: string;
  role: ChatCompletionRequestMessageRoleEnum;
}

export interface ModuleLLM {
  ask(data: ModuleLLMAskOptions): Promise<string | object>;
  chat(data: ModuleLLMChatOptions): Promise<string | object>;
}

export interface ModuleLLMAskOptions {
  prompt: string;
  json?: boolean;
}

export interface ModuleLLMChatOptions {
  messages: ModuleLLMChatMessage[];
  json?: boolean;
}
