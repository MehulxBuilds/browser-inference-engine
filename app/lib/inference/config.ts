
export const MODEL_CONFIG = {
  task: "text-generation" as const,

  modelId: "onnx-community/Qwen2.5-0.5B-Instruct",

  device: "webgpu" as const,

  dtype: "q4" as const,

  maxNewTokens: 256,
};
