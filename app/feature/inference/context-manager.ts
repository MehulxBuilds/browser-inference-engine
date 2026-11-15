import type { ChatMessage } from "./tokenizer";

export type ContextOptions = {
  contextWindow: number;
  maxNewTokens: number;
  safetyMargin?: number;
  countTokens: (text: string) => number;
  render: (messages: ChatMessage[]) => string;
};

export function buildPromptContext(
  messages: ChatMessage[],
  options: ContextOptions,
) {
  if (!Number.isInteger(options.maxNewTokens) || options.maxNewTokens < 1 || options.maxNewTokens >= options.contextWindow) {
    throw new Error("Invalid output token budget for this model.");
  }
  const inputBudget =
    options.contextWindow -
    options.maxNewTokens -
    (options.safetyMargin ?? 0);

  if (inputBudget <= 0) {
    throw new Error("Generation settings leave no room for input.");
  }

  if (messages.at(-1)?.role !== "user") {
    throw new Error("The latest message must be from the user.");
  }
  let selected = [...messages];
  while (true) {
    const prompt = options.render(selected);
    const tokenCount = options.countTokens(prompt);
    if (tokenCount <= inputBudget) return { prompt, tokenCount, inputBudget };
    const oldestUser = selected.findIndex((message) => message.role === "user");
    const nextUser = selected.findIndex((message, index) => index > oldestUser && message.role === "user");
    if (oldestUser < 0 || nextUser < 0) throw new Error("Your message exceeds the model's context window.");
    // Drop an entire old turn, retaining system instructions wherever supplied.
    selected = selected.filter((message, index) =>
      index < oldestUser || index >= nextUser || message.role === "system");
  }
}
