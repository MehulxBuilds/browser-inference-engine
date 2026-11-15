import type { PreTrainedTokenizer } from "@huggingface/transformers";
import type { ChatMessage } from "./tokenizer";
import type { getModelConfig } from "./config";

export function renderPrompt(tokenizer: PreTrainedTokenizer, messages: ChatMessage[], chatTemplate: boolean) {
  if (chatTemplate) {
    const templateOptions = {
      tokenize: false as const,
      add_generation_prompt: true,
      // Qwen3 supports direct answers without a separate thinking phase.
      // Templates for models without thinking support ignore this option.
      enable_thinking: false,
    };
    return tokenizer.apply_chat_template(messages, templateOptions);
  }
  // Completion models continue the user's text without a chat template.
  if (messages.length === 1 && messages[0].role === "user") return messages[0].content;
  return messages.map((message) => `${message.role}: ${message.content}`).join("\n") + "\nassistant:";
}

export function preparePrompt(
  tokenizer: PreTrainedTokenizer,
  messages: ChatMessage[],
  model: ReturnType<typeof getModelConfig>,
  maxNewTokens: number,
) {
  if (!Number.isInteger(maxNewTokens) || maxNewTokens < 1 || maxNewTokens >= model.contextWindowTokens) {
    throw new Error("Invalid output token budget for this model.");
  }
  if (messages.at(-1)?.role !== "user") throw new Error("The latest message must be from the user.");
  const selected = [...messages];
  const budget = model.contextWindowTokens - maxNewTokens;
  while (true) {
    const prompt = renderPrompt(tokenizer, selected, model.chatTemplate);
    if (tokenizer.encode(prompt, { add_special_tokens: false }).length <= budget) return prompt;
    const oldestUser = selected.findIndex((message) => message.role === "user");
    const nextUser = selected.findIndex((message, index) => index > oldestUser && message.role === "user");
    if (oldestUser < 0 || nextUser < 0) throw new Error("Your message exceeds the model's context window.");
    selected.splice(oldestUser, nextUser - oldestUser);
  }
}
