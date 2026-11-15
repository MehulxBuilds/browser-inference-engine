import { createGenerator } from "./runtime";
import { InterruptableStoppingCriteria, StoppingCriteriaList } from "@huggingface/transformers";
import { getModelConfig } from "./config";
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
  topK: 50,
  topP: 1,
};

export class BrowserLLM {
  private generator: Generator | null = null;

  private state: EngineState = "idle";

  private generationInProgress = false;
  private stopping: InterruptableStoppingCriteria | null = null;

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
    return inspectTokenizer(this.getGenerator(), this.options.modelId);
  }

  tokenize(messages: ChatMessage[]) {
    return tokenizeConversation(
      this.getGenerator(),
      messages,
      this.options.modelId,
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
    const stopping = new InterruptableStoppingCriteria();
    this.stopping = stopping;
    const criteria = new StoppingCriteriaList();
    criteria.push(stopping);
    this.setState("generating");

    try {
      return await generateResponse({
        generator: this.getGenerator(),
        modelId: this.options.modelId,
        device: this.options.device,
        dtype: this.options.dtype,
        stoppingCriteria: criteria,
        isCancelled: () => stopping.interrupted,
        messages,
        settings: {
          ...DEFAULT_GENERATION_SETTINGS,
          maxNewTokens: getModelConfig(this.options.modelId).maxNewTokens,
          ...settings,
        },
        onText,
        onTokenCount,
      });
    } finally {
      this.generationInProgress = false;
      this.stopping = null;

      // dispose() rejects calls while generation is running.
      this.setState("ready");
    }
  }

  stop() {
    this.stopping?.interrupt();
  }

  async dispose() {
    if (this.state === "disposed") {
      return;
    }

    if (this.generationInProgress) {
      throw new Error(
        "Cannot dispose while generation is running.",
      );
    }

    const generator = this.generator;
    this.generator = null;
    this.setState("disposed");
    await generator?.dispose();
  }
}
