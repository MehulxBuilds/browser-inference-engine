import type { GenerationOptions } from "./generation";
import type { ChatMessage } from "./tokenizer";
import type { ModelProgress } from "./types";

export type EngineState =
  | "idle"
  | "loading"
  | "ready"
  | "generating"
  | "error"
  | "disposed";

export type BrowserLLMOptions = {
  modelId?: string;
  device?: "webgpu";
  dtype?: "q4";

  onProgress?: (progress: ModelProgress) => void;
  onStatus?: (status: string) => void;
  onStateChange?: (state: EngineState) => void;
};

export type EngineGenerateOptions = {
  messages: ChatMessage[];
  settings?: Partial<GenerationOptions>;

  onText: (text: string) => void;
  onTokenCount?: (count: number) => void;
};