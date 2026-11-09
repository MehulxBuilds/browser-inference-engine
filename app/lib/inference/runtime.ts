
import { pipeline } from "@huggingface/transformers";

import { MODEL_CONFIG } from "./config";
import type { ModelProgress } from "./types";

import { inspectModel } from "./model-registry";

export type LoadModelOptions = {
  onProgress?: (progress: ModelProgress) => void;
  onStatus?: (status: string) => void;
};

async function checkWebGPU() {
  if (!navigator.gpu) {
    throw new Error(
      "WebGPU is unavailable in this browser.",
    );
  }

  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: "high-performance",
  });

  if (!adapter) {
    throw new Error("No compatible GPU adapter found.");
  }

  return adapter;
}

async function initializeModel(
  options?: LoadModelOptions,
) {
  options?.onStatus?.("Checking WebGPU...");

  await checkWebGPU();

  options?.onStatus?.("Inspecting model repository...");

  const inspection = await inspectModel();

  console.log("Model inspection:", inspection);

  options?.onStatus?.(
    inspection.cached
      ? "Model assets are cached. Initializing runtime..."
      : "Model assets need downloading...",
  );

  const generator = await pipeline(
    MODEL_CONFIG.task,
    MODEL_CONFIG.modelId,
    {
      device: MODEL_CONFIG.device,
      dtype: MODEL_CONFIG.dtype,

      progress_callback: (event) => {
        options?.onProgress?.(event);
      },
    },
  );

  options?.onStatus?.("Model ready.");

  return generator;
}

export type Generator = Awaited<
  ReturnType<typeof initializeModel>
>;

let modelPromise: Promise<Generator> | null = null;

export async function loadModel(
  options?: LoadModelOptions,
): Promise<Generator> {
  if (modelPromise) {
    return modelPromise;
  }

  const initialization = initializeModel(options);

  modelPromise = initialization;

  try {
    return await initialization;
  } catch (error) {
    if (modelPromise === initialization) {
      modelPromise = null;
    }

    throw error;
  }
}
