import { TextStreamer, type StoppingCriteriaList } from "@huggingface/transformers";

import type { Generator } from "./runtime";
import type { ChatMessage } from "./tokenizer";
import { getModelConfig } from "./config";
import { preparePrompt } from "./prompt";
import { MODEL_CONFIG, type InferenceDevice } from "./config";
import { startResponseBenchmark, type ResponseBenchmark } from "./benchmark";

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
  generatedText: string;
  cancelled: boolean;
  benchmark: ResponseBenchmark;
};

export class GenerationError extends Error {
  constructor(message: string, readonly benchmark: ResponseBenchmark, cause: unknown) {
    super(message, { cause });
    this.name = "GenerationError";
  }
}

type GenerateOptions = {
  generator: Generator;
  messages: ChatMessage[];
  settings: GenerationOptions;
  onText: (text: string) => void;
  onTokenCount?: (count: number) => void;
  modelId?: string;
  device?: InferenceDevice;
  dtype?: string;
  stoppingCriteria?: StoppingCriteriaList;
  isCancelled?: () => boolean;
};

export async function generateResponse({
  generator,
  messages,
  settings,
  onText,
  onTokenCount,
  modelId,
  device = MODEL_CONFIG.device,
  dtype,
  stoppingCriteria,
  isCancelled = () => false,
}: GenerateOptions): Promise<GenerationMetrics> {
  const model = getModelConfig(modelId);
  const tokenizer = generator.tokenizer;
  const measurement = startResponseBenchmark({
    modelId: model.modelId,
    device,
    dtype: dtype ?? (device === "webgpu" ? model.webgpuDtype : model.wasmDtype),
    settings: { maxNewTokens: settings.maxNewTokens, temperature: settings.temperature },
  });
  try {
    if (!Number.isFinite(settings.temperature) || settings.temperature < 0) throw new Error("Invalid temperature.");
    if (!Number.isInteger(settings.topK) || settings.topK < 0) throw new Error("Invalid top K.");
    if (!Number.isFinite(settings.topP) || settings.topP <= 0 || settings.topP > 1) throw new Error("Invalid top P.");
    const prompt = preparePrompt(tokenizer, messages, model, settings.maxNewTokens);
    const promptTokens = tokenizer.encode(prompt, { add_special_tokens: false }).length;
    measurement.setPromptTokens(promptTokens);

    let generatedTokens = 0;
    let generatedText = "";

    const streamer = new TextStreamer(tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,

      callback_function: (text: string) => {
        generatedText += text;
        onText(text);
      },

      token_callback_function: (tokens: bigint[]) => {
        generatedTokens += tokens.length;
        measurement.onTokens(tokens.length);
        onTokenCount?.(generatedTokens);
      },
    });

    await generator(prompt, {
      max_new_tokens: settings.maxNewTokens,
      do_sample: settings.temperature > 0,
      ...(settings.temperature > 0 ? { temperature: settings.temperature } : {}),
      add_special_tokens: false,
      top_k: settings.topK,
      top_p: settings.topP,
      streamer,
      stopping_criteria: stoppingCriteria,
    });

    const cancelled = isCancelled();
    const benchmark = measurement.finish(cancelled ? "cancelled" : "complete");
    return {
      promptTokens,
      generatedTokens,
      elapsedMs: benchmark.totalMs,
      tokensPerSecond: benchmark.tokensPerSecond,
      generatedText,
      cancelled,
      benchmark,
    };
  } catch (error) {
    throw new GenerationError(error instanceof Error ? error.message : "Generation failed.", measurement.finish("error"), error);
  }
}
