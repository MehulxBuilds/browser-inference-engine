import type { ResponseBenchmark } from "./benchmark";

export type WorkerRequest =
  | { type: "INSPECT"; requestId: string; modelId: string }
  | { type: "LOAD"; requestId: string; modelId?: string; preferredDevice?: "auto" | "webgpu" | "wasm" }
  | { type: "GENERATE"; requestId: string; modelId: string; messages: Array<{ role: "system" | "user" | "assistant"; content: string }>; maxNewTokens?: number; temperature?: number }
  | { type: "STOP"; requestId: string }
  | { type: "UNLOAD"; requestId: string };

export type WorkerResponse =
  | { type: "MODEL_SIZE"; requestId: string; modelId: string; totalSize: number; device: "webgpu" | "wasm" }
  | { type: "STATUS"; requestId: string; message: string }
  | { type: "PROGRESS"; requestId: string; progress: number; file?: string }
  | { type: "READY"; requestId: string; device: "webgpu" | "wasm"; modelId: string }
  | { type: "TOKEN"; requestId: string; token: string }
  | { type: "DONE"; requestId: string; generatedText: string; cancelled?: boolean; benchmark: ResponseBenchmark }
  | { type: "ERROR"; requestId: string; message: string; benchmark?: ResponseBenchmark };
