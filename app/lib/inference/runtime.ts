import { pipeline } from "@huggingface/transformers";

import { MODEL_CONFIG } from "./config";
import type { ModelProgress } from "./types";

export type RuntimeOptions = {
  modelId?: string;
  device?: typeof MODEL_CONFIG.device;
  dtype?: typeof MODEL_CONFIG.dtype;

  onProgress?: (progress: ModelProgress) => void;
  onStatus?: (status: string) => void;
};

async function checkWebGPU() {
  if (!navigator.gpu) {
    throw new Error("WebGPU is unavailable.");
  }

  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: "high-performance",
  });

  if (!adapter) {
    throw new Error("No compatible GPU adapter found.");
  }
}

export async function createGenerator(
  options: RuntimeOptions = {},
) {
  const modelId = options.modelId ?? MODEL_CONFIG.modelId;
  const device = options.device ?? MODEL_CONFIG.device;
  const dtype = options.dtype ?? MODEL_CONFIG.dtype;

  if (device === "webgpu") {
    options.onStatus?.("Checking WebGPU...");
    await checkWebGPU();
  }

  options.onStatus?.("Initializing model...");

  const generator = await pipeline(
    MODEL_CONFIG.task,
    modelId,
    {
      device,
      dtype,
      progress_callback: (event) => {
        options.onProgress?.(event);
      },
    },
  );

  options.onStatus?.("Model ready.");

  return generator;
}

export type Generator = Awaited<
  ReturnType<typeof createGenerator>
>;