
import { ModelRegistry } from "@huggingface/transformers";
import { configureInferenceCache } from "./cache-config";

import { MODEL_CONFIG, getModelConfig, type InferenceDevice } from "./config";

import type {
  ModelInspection,
} from "./types";

export async function inspectModel(modelId = MODEL_CONFIG.modelId, device: InferenceDevice = MODEL_CONFIG.device): Promise<ModelInspection> {
  configureInferenceCache();
  const model = getModelConfig(modelId);
  const dtype = device === "webgpu" ? model.webgpuDtype : model.wasmDtype;
  const modelOptions = {
    device,
    dtype,
  };

  // 1. Discover available precision variants.
  const availableDtypes =
    await ModelRegistry.get_available_dtypes(
      modelId,
    );

  if (!availableDtypes.includes(dtype)) {
    throw new Error(
      `Requested dtype ${dtype} is unavailable. ` +
      `Available dtypes: ${availableDtypes.join(", ")}`,
    );
  }

  // 2. Discover required model files.
  const files = await ModelRegistry.get_pipeline_files(
    MODEL_CONFIG.task,
    modelId,
    modelOptions,
  );

  // 3. Check whether the required files are cached.
  const cached = await ModelRegistry.is_pipeline_cached(
    MODEL_CONFIG.task,
    modelId,
    modelOptions,
  );

  // 4. Retrieve file metadata for size estimation.
  const metadata = await Promise.all(
    files.map((file) =>
      ModelRegistry.get_file_metadata(
        modelId,
        file,
      ),
    ),
  );

  const totalSize = metadata.reduce(
    (sum, item) => sum + (item.size ?? 0),
    0,
  );

  return {
    files,
    availableDtypes,
    cached,
    totalSize,
  };
}
