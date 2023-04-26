import { ModuleLLMChatMessage } from "@agi-toolkit/types";
import { TiktokenModel, encoding_for_model } from "@dqbd/tiktoken";

export async function countTokens(text: string, model: TiktokenModel = "gpt-4") {
  const enc = encoding_for_model(model);
  const res = enc.encode(text)
  await enc.free();
  return res;
}

export async function truncateHistoryToTokenSize(messages: ModuleLLMChatMessage[], tokenLimit: number) {
  const sizes = await Promise.all(messages.map(m => countTokens(m.content)));
  const systemPromptSize = sizes[0];
  const res: ModuleLLMChatMessage[] = [];
  let tokensRemaining = tokenLimit - systemPromptSize.length;

  while (tokensRemaining > 0 && sizes.length > 1) {
    if (sizes[sizes.length - 1].length >= tokensRemaining) break;
    const nextSize = sizes.pop()!.length;
    const nextMessage = messages.pop()!;
    // Insert at index 1
    res.splice(0, 0, nextMessage);
    tokensRemaining -= nextSize;
  }

  res.unshift(messages[0]);
  return res;
}


// A simple test. Change the tokenLimit to see how it works.

// (async() => {
//   const messages: ModuleLLMChatMessage[] = [
//     {role: "system", content: "Your role is X"},
//     {role: "user", content: "I would like to accomplish X"},
//     {role: "assistant", content: "Ok, how about we do Y"},
//     {role: "user", content: "Yes, that sounds good. I authorize it"},
//   ]
//   console.log(await truncateHistoryToTokenSize(messages, 24));
// })();
