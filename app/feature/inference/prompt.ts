import type { PreTrainedTokenizer } from "@huggingface/transformers";
import type { ChatMessage } from "./tokenizer";
import type { getModelConfig } from "./config";
import { buildPromptContext } from "./context-manager";

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
  return buildPromptContext(messages, {
    contextWindow: model.contextWindowTokens,
    maxNewTokens,
    render: (selected) => renderPrompt(tokenizer, selected, model.chatTemplate),
    countTokens: (text) => tokenizer.encode(text, { add_special_tokens: false }).length,
  }).prompt;
}
