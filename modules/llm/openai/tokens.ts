import { ModuleLLMChatMessage } from "@agi-toolkit/types";
import { TiktokenModel, encoding_for_model } from "@dqbd/tiktoken";

export async function countTokens(text: string, model: TiktokenModel = "gpt-4") {
  const enc = encoding_for_model(model);
  const res = enc.encode(text)
  await enc.free();
  return res.length;
}

export async function truncateHistoryToTokenSize(messages: ModuleLLMChatMessage[], tokenLimit: number) {
  const msgs = [...messages];
  const sizes = await Promise.all(msgs.map(m => countTokens(m.content)));
  const systemPromptSize = sizes[0];
  const res: ModuleLLMChatMessage[] = [];
  let tokensRemaining = tokenLimit - systemPromptSize;

  while (tokensRemaining > 0 && sizes.length > 1) {
    if (sizes[sizes.length - 1] >= tokensRemaining) break;
    const nextSize = sizes.pop()!;
    const nextMessage = msgs.pop()!;
    // Insert at index 1
    res.splice(0, 0, nextMessage);
    tokensRemaining -= nextSize;
  }
  res.unshift(msgs[0]);
  return res;
}
