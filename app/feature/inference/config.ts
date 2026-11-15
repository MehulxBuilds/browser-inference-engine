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
  label: "GPT-2 (text completion)",
  modelId: "onnx-community/gpt2-ONNX",
  task: "text-generation" as const,
  webgpuDtype: "fp32" as const,
  wasmDtype: "q8" as const,
  maxNewTokens: 256,
  contextWindowTokens: 1024,
  chatTemplate: false,
}, {
  label: "SmolLM2 135M (lightweight chat)",
  modelId: "onnx-community/SmolLM2-135M-Instruct-ONNX",
  task: "text-generation" as const,
  webgpuDtype: "q4" as const,
  wasmDtype: "q8" as const,
  maxNewTokens: 256,
  contextWindowTokens: 8192,
  chatTemplate: true,
}, {
  label: "DistilGPT-2 (lightweight completion)",
  modelId: "onnx-community/distilgpt2-ONNX",
  task: "text-generation" as const,
  webgpuDtype: "fp32" as const,
  wasmDtype: "q8" as const,
  maxNewTokens: 256,
  contextWindowTokens: 1024,
  chatTemplate: false,
}];

export const MODEL_CONFIG = {
  ...SUPPORTED_MODELS[1],
  device: "webgpu" as const,
  dtype: "fp32" as const,
};

export function getModelConfig(modelId = MODEL_CONFIG.modelId) {
  const model = SUPPORTED_MODELS.find((item) => item.modelId === modelId);
  if (!model) throw new Error(`Unsupported model: ${modelId}`);
  return model;
}

export type InferenceDevice = "webgpu" | "wasm";
