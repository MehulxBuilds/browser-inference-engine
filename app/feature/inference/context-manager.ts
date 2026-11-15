import type { ChatMessage } from "../chat/types";

export type ContextOptions = {
  contextWindow: number;
  maxNewTokens: number;
  safetyMargin?: number;
  countTokens: (text: string) => number;
};

export function buildPromptContext(
  messages: ChatMessage[],
  options: ContextOptions,
) {
  const inputBudget =
    options.contextWindow -
    options.maxNewTokens -
    (options.safetyMargin ?? 128);

  if (inputBudget <= 0) {
    throw new Error("Generation settings leave no room for input.");
  }

  const system = messages.filter((m) => m.role === "system").slice(0, 1);
  const conversation = messages.filter((m) => m.role !== "system");
  const current = conversation.at(-1);

  if (!current || current.role !== "user") {
    throw new Error("Expected the latest message to be from the user.");
  }

  const history = conversation.slice(0, -1);
  let selected = [...history];

  const render = (items: ChatMessage[]) => [
    ...system,
    ...items,
    current,
  ].map((m) => `${m.role}: ${m.content}`).join("\n") + "\nassistant:";

  while (selected.length > 0 && options.countTokens(render(selected)) > inputBudget) {
    // Remove oldest messages; avoid keeping an assistant answer without its user turn.
    selected = selected.slice(2);
  }

  const prompt = render(selected);
  const tokenCount = options.countTokens(prompt);

  if (tokenCount > inputBudget) {
    throw new Error("Current message exceeds the available context budget.");
  }

  return { prompt, tokenCount, inputBudget };
}
