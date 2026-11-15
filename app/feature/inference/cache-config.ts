import { env } from "@huggingface/transformers";

export function configureInferenceCache() {
  env.useBrowserCache = true;
  env.useWasmCache = true;
}
