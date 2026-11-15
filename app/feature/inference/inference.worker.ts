/// <reference lib="webworker" />
import { pipeline, TextStreamer, InterruptableStoppingCriteria, StoppingCriteriaList, type TextGenerationPipeline } from "@huggingface/transformers";
import { MODEL_CONFIG, getModelConfig, type InferenceDevice } from "./config";
import { preparePrompt } from "./prompt";
import { inspectModel } from "./model-registry";
import { startResponseBenchmark } from "./benchmark";
import type { WorkerRequest, WorkerResponse } from "./protocol";

const ctx = self as DedicatedWorkerGlobalScope;
let generator: TextGenerationPipeline | null = null;
let activeRequestId: string | null = null;
let stopping: InterruptableStoppingCriteria | null = null;
let selectedModel = getModelConfig();
let loading = false;
let selectedDevice: InferenceDevice | null = null;

function send(message: WorkerResponse) {
  ctx.postMessage(message);
}

async function hasWebGPU(): Promise<boolean> {
  if (!("gpu" in navigator)) return false;
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return Boolean(adapter);
  } catch {
    return false;
  }
}

async function loadModel(request: Extract<WorkerRequest, { type: "LOAD" }>) {
  const modelId = request.modelId ?? MODEL_CONFIG.modelId;
  if (loading || activeRequestId) throw new Error("Runtime is busy.");
  const model = getModelConfig(modelId);
  loading = true;
  try {
  if (generator) {
    await generator.dispose();
    generator = null;
  }
  selectedDevice = null;
  const candidates: InferenceDevice[] =
    request.preferredDevice === "wasm" ? ["wasm"] :
    request.preferredDevice === "webgpu" ? ["webgpu"] :
    (await hasWebGPU() ? ["webgpu", "wasm"] : ["wasm"]);

  let lastError: unknown;

  for (const device of candidates) {
    try {
      send({ type: "STATUS", requestId: request.requestId, message: `Loading model with ${device.toUpperCase()}...` });
      const dtype = device === "webgpu" ? model.webgpuDtype : model.wasmDtype;

      generator = await pipeline("text-generation", modelId, {
        device,
        dtype,
        progress_callback: (event: { progress?: number; file?: string; status?: string }) => {
          if (typeof event.progress === "number") {
            send({
              type: "PROGRESS",
              requestId: request.requestId,
              progress: Math.max(0, Math.min(100, event.progress)),
              file: event.file,
            });
          }
          if (event.status) {
            send({ type: "STATUS", requestId: request.requestId, message: event.status });
          }
        },
      }) as TextGenerationPipeline;

      selectedModel = model;
      selectedDevice = device;
      send({ type: "READY", requestId: request.requestId, device, modelId });
      return;
    } catch (error) {
      lastError = error;
      generator = null;
      if (request.preferredDevice !== "auto" && request.preferredDevice) break;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to initialize an inference runtime.");
  } finally {
    loading = false;
  }
}

async function generate(request: Extract<WorkerRequest, { type: "GENERATE" }>) {
  if (!generator || !selectedDevice || loading) throw new Error("Model is not loaded.");
  if (request.modelId !== selectedModel.modelId) throw new Error("Load the selected model before generating a response.");
  if (activeRequestId) throw new Error("Another generation is already running.");

  activeRequestId = request.requestId;
  stopping = new InterruptableStoppingCriteria();
  const criteria = new StoppingCriteriaList();
  criteria.push(stopping);
  let generatedText = "";
  const maxNewTokens = request.maxNewTokens ?? MODEL_CONFIG.maxNewTokens;
  const temperature = request.temperature ?? 0.7;
  const measurement = startResponseBenchmark({
    modelId: selectedModel.modelId,
    device: selectedDevice,
    dtype: selectedDevice === "webgpu" ? selectedModel.webgpuDtype : selectedModel.wasmDtype,
    settings: { maxNewTokens, temperature },
  });

  try {
    if (!Number.isFinite(temperature) || temperature < 0) throw new Error("Invalid temperature.");
    const prompt = preparePrompt(generator.tokenizer, request.messages, selectedModel, maxNewTokens);
    measurement.setPromptTokens(generator.tokenizer.encode(prompt, { add_special_tokens: false }).length);
    const streamer = new TextStreamer(generator.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      // Unlike text chunks, these callbacks contain actual generated token IDs.
      // skip_prompt ensures input IDs are not counted as output.
      token_callback_function: (tokens: bigint[]) => measurement.onTokens(tokens.length),
      callback_function: (text: string) => {
        generatedText += text;
        send({ type: "TOKEN", requestId: request.requestId, token: text });
      },
    });

    await generator(prompt, {
      max_new_tokens: maxNewTokens,
      ...(temperature > 0 ? { temperature } : {}),
      do_sample: temperature > 0,
      streamer,
      stopping_criteria: criteria,
      add_special_tokens: false,
    });

    send({ type: "DONE", requestId: request.requestId, generatedText, cancelled: stopping.interrupted,
      benchmark: measurement.finish(stopping.interrupted ? "cancelled" : "complete") });
  } catch (error) {
      send({
        type: "ERROR",
        requestId: request.requestId,
        message: error instanceof Error ? error.message : "Generation failed.",
        benchmark: measurement.finish("error"),
      });
  } finally {
    activeRequestId = null;
    stopping = null;
  }
}

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  void (async () => {
    try {
      switch (request.type) {
        case "INSPECT": {
          const device = await hasWebGPU() ? "webgpu" : "wasm";
          const inspection = await inspectModel(request.modelId, device);
          send({ type: "MODEL_SIZE", requestId: request.requestId, modelId: request.modelId, totalSize: inspection.totalSize, device });
          break;
        }
        case "LOAD":
          await loadModel(request);
          break;
        case "GENERATE":
          await generate(request);
          break;
        case "STOP":
          if (activeRequestId === request.requestId) stopping?.interrupt();
          break;
        case "UNLOAD":
          if (activeRequestId || loading) throw new Error("Cannot unload while runtime is busy.");
          await generator?.dispose();
          generator = null;
          selectedDevice = null;
          send({ type: "STATUS", requestId: request.requestId, message: "Runtime reference released." });
          break;
      }
    } catch (error) {
      send({
        type: "ERROR",
        requestId: request.requestId,
        message: error instanceof Error ? error.message : "Worker operation failed.",
      });
    }
  })();
};
