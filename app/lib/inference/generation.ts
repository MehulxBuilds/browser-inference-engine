
import { TextStreamer } from "@huggingface/transformers";

import type { Generator } from "./runtime";
import type { ChatMessage } from "./tokenizer";

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
};

export async function generateResponse({
  generator,
  messages,
  settings,
  onText,
  onTokenCount,
}: GenerateOptions): Promise<GenerationMetrics> {
  const tokenizer = generator.tokenizer;

  // Count prompt tokens using Qwen's actual chat template.
  const encoded = tokenizer.apply_chat_template(
    messages,
    {
      tokenize: true,
      add_generation_prompt: true,
      return_tensor: false,
    },
  );

  const promptTokens = encoded.input_ids.length;

  let generatedTokens = 0;

  // Streamer converts token IDs into readable text.
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

  // Run actual model generation.
  await generator(messages, {
    max_new_tokens: settings.maxNewTokens,

    do_sample: true,
    temperature: settings.temperature,
    top_k: settings.topK,
    top_p: settings.topP,

    streamer,
  });

  const elapsedMs = performance.now() - startTime;

  const tokensPerSecond =
    elapsedMs > 0
      ? generatedTokens / (elapsedMs / 1000)
      : 0;

  return {
    promptTokens,
    generatedTokens,
    elapsedMs,
    tokensPerSecond,
  };
}
