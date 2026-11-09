import { createGenerator } from "./runtime";
import type { Generator } from "./runtime";

import { generateResponse } from "./generation";
import type {
  GenerationOptions,
  GenerationMetrics,
} from "./generation";

import {
  tokenizeConversation,
  inspectTokenizer,
} from "./tokenizer";

import type { ChatMessage } from "./tokenizer";

import type {
  BrowserLLMOptions,
  EngineGenerateOptions,
  EngineState,
} from "./engine-types";

const DEFAULT_GENERATION_SETTINGS: GenerationOptions = {
  maxNewTokens: 256,
  temperature: 0.7,
  topK: 40,
  topP: 0.9,
};

export class BrowserLLM {
  private generator: Generator | null = null;

  private state: EngineState = "idle";

  private generationInProgress = false;

  private constructor(
    private readonly options: BrowserLLMOptions,
  ) {}

  static async create(
    options: BrowserLLMOptions = {},
  ): Promise<BrowserLLM> {
    const engine = new BrowserLLM(options);

    try {
      engine.setState("loading");

      engine.generator = await createGenerator({
        modelId: options.modelId,
        device: options.device,
        dtype: options.dtype,
        onProgress: options.onProgress,
        onStatus: options.onStatus,
      });

      engine.setState("ready");

      return engine;
    } catch (error) {
      engine.setState("error");
      throw error;
    }
  }

  getState(): EngineState {
    return this.state;
  }

  private setState(state: EngineState) {
    this.state = state;
    this.options.onStateChange?.(state);
  }

  private getGenerator(): Generator {
    if (!this.generator) {
      throw new Error("Model is not initialized.");
    }

    if (this.state === "disposed") {
      throw new Error("Engine has been disposed.");
    }

    return this.generator;
  }

  inspectTokenizer() {
    return inspectTokenizer(this.getGenerator());
  }

  tokenize(messages: ChatMessage[]) {
    return tokenizeConversation(
      this.getGenerator(),
      messages,
    );
  }

  async generate({
    messages,
    settings,
    onText,
    onTokenCount,
  }: EngineGenerateOptions): Promise<GenerationMetrics> {
    if (this.state === "disposed") {
      throw new Error("Engine has been disposed.");
    }

    if (this.state !== "ready") {
      throw new Error(
        `Cannot generate while engine is ${this.state}.`,
      );
    }

    if (this.generationInProgress) {
      throw new Error("Generation is already running.");
    }

    this.generationInProgress = true;
    this.setState("generating");

    try {
      return await generateResponse({
        generator: this.getGenerator(),
        messages,
        settings: {
          ...DEFAULT_GENERATION_SETTINGS,
          ...settings,
        },
        onText,
        onTokenCount,
      });
    } finally {
      this.generationInProgress = false;

      // dispose() rejects calls while generation is running.
      this.setState("ready");
    }
  }

  dispose() {
    if (this.state === "disposed") {
      return;
    }

    if (this.generationInProgress) {
      throw new Error(
        "Cannot dispose while generation is running.",
      );
    }

    this.generator?.dispose();
    this.generator = null;

    this.setState("disposed");
  }
}
