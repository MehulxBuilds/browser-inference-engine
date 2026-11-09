
import { ModelRegistry } from "@huggingface/transformers";

import { MODEL_CONFIG } from "./config";

import type {
  ModelInspection,
} from "./types";

export async function inspectModel(): Promise<ModelInspection> {
  const modelOptions = {
    device: MODEL_CONFIG.device,
    dtype: MODEL_CONFIG.dtype,
  };

  // 1. Discover available precision variants.
  const availableDtypes =
    await ModelRegistry.get_available_dtypes(
      MODEL_CONFIG.modelId,
    );

  if (!availableDtypes.includes(MODEL_CONFIG.dtype)) {
    throw new Error(
      `Requested dtype ${MODEL_CONFIG.dtype} is unavailable. ` +
      `Available dtypes: ${availableDtypes.join(", ")}`,
    );
  }

  // 2. Discover required model files.
  const files = await ModelRegistry.get_pipeline_files(
    MODEL_CONFIG.task,
    MODEL_CONFIG.modelId,
    modelOptions,
  );

  // 3. Check whether the required files are cached.
  const cached = await ModelRegistry.is_pipeline_cached(
    MODEL_CONFIG.task,
    MODEL_CONFIG.modelId,
    modelOptions,
  );

  // 4. Retrieve file metadata for size estimation.
  const metadata = await Promise.all(
    files.map((file) =>
      ModelRegistry.get_file_metadata(
        MODEL_CONFIG.modelId,
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
