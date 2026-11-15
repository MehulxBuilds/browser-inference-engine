export const SUPPORTED_MODELS = [{
  label: "Qwen2.5 0.5B Instruct",
  modelId: "onnx-community/Qwen2.5-0.5B-Instruct",
  task: "text-generation" as const,
  webgpuDtype: "q4" as const,
  wasmDtype: "q8" as const,
  maxNewTokens: 256,
  contextWindowTokens: 32768,
  chatTemplate: true,
}, {
  label: "SmolLM2 360M Instruct",
  modelId: "onnx-community/SmolLM2-360M-Instruct-ONNX",
  task: "text-generation" as const,
  webgpuDtype: "q8" as const,
  wasmDtype: "q8" as const,
  maxNewTokens: 256,
  contextWindowTokens: 8192,
  chatTemplate: true,
}, {
  label: "SmolLM 360M Instruct",
  modelId: "HuggingFaceTB/SmolLM-360M-Instruct",
  task: "text-generation" as const,
  webgpuDtype: "q8" as const,
  wasmDtype: "q8" as const,
  maxNewTokens: 256,
  contextWindowTokens: 2048,
  chatTemplate: true,
}, {
  label: "Llama 3.2 1B Instruct (Meta)",
  modelId: "onnx-community/Llama-3.2-1B-Instruct-ONNX",
  task: "text-generation" as const,
  webgpuDtype: "q4" as const,
  wasmDtype: "q8" as const,
  maxNewTokens: 256,
  contextWindowTokens: 131072,
  chatTemplate: true,
}];

export const MODEL_CONFIG = {
  ...SUPPORTED_MODELS[0],
  device: "webgpu" as const,
  dtype: SUPPORTED_MODELS[0].webgpuDtype,
};

export function getModelConfig(modelId = MODEL_CONFIG.modelId) {
  const model = SUPPORTED_MODELS.find((item) => item.modelId === modelId);
  if (!model) throw new Error(`Unsupported model: ${modelId}`);
  return model;
}

export type InferenceDevice = "webgpu" | "wasm";
