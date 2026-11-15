import { pipeline } from "@huggingface/transformers";

import { MODEL_CONFIG, getModelConfig, type InferenceDevice } from "./config";
import type { ModelProgress } from "./types";

export type RuntimeOptions = {
  modelId?: string;
  device?: InferenceDevice;
  dtype?: "q4" | "q8" | "fp32";

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
  const model = getModelConfig(modelId);
  const dtype = options.dtype ?? (device === "webgpu" ? model.webgpuDtype : model.wasmDtype);

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
