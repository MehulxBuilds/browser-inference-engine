import { TextStreamer } from "@huggingface/transformers";

import type { Generator } from "./runtime";
import type { ChatMessage } from "./tokenizer";
import { getModelConfig } from "./config";
import { preparePrompt } from "./prompt";

export type GenerationOptions = {
  maxNewTokens: number;
  temperature: number;
  topK: number;
  topP: number;
};

export type GenerationMetrics = {
  promptTokens: number;
  generatedTokens: number;
  elapsedMs: number;
  tokensPerSecond: number;
};

type GenerateOptions = {
  generator: Generator;
  messages: ChatMessage[];
  settings: GenerationOptions;
  onText: (text: string) => void;
  onTokenCount?: (count: number) => void;
  modelId?: string;
};

export async function generateResponse({
  generator,
  messages,
  settings,
  onText,
  onTokenCount,
  modelId,
}: GenerateOptions): Promise<GenerationMetrics> {
  const tokenizer = generator.tokenizer;

  const prompt = preparePrompt(tokenizer, messages, getModelConfig(modelId), settings.maxNewTokens);
  const promptTokens = tokenizer.encode(prompt, { add_special_tokens: false }).length;

  let generatedTokens = 0;

  const streamer = new TextStreamer(tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,

    callback_function: (text: string) => {
      onText(text);
    },

    token_callback_function: (tokens: bigint[]) => {
      generatedTokens += tokens.length;
      onTokenCount?.(generatedTokens);
    },
  });

  const startTime = performance.now();

  await generator(prompt, {
    max_new_tokens: settings.maxNewTokens,
    do_sample: settings.temperature > 0,
    ...(settings.temperature > 0 ? { temperature: settings.temperature } : {}),
    add_special_tokens: false,
    top_k: settings.topK,
    top_p: settings.topP,
    streamer,
  });

  const elapsedMs = performance.now() - startTime;

  return {
    promptTokens,
    generatedTokens,
    elapsedMs,
    tokensPerSecond:
      elapsedMs > 0
        ? generatedTokens / (elapsedMs / 1000)
        : 0,
  };
}
