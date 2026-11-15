/// <reference lib="webworker" />
import { getModelConfig, type InferenceDevice } from "./config";
import { BrowserLLM } from "./engine";
import { GenerationError } from "./generation";
import { inspectModel } from "./model-registry";
import type { WorkerRequest, WorkerResponse } from "./protocol";

const ctx = self as DedicatedWorkerGlobalScope;
let engine: BrowserLLM | null = null;
let activeRequestId: string | null = null;
let selectedModel = getModelConfig();
let loading = false;
let selectedDevice: InferenceDevice | null = null;

function send(message: WorkerResponse) {
  ctx.postMessage(message);
}

async function hasWebGPU(): Promise<boolean> {
  if (!("gpu" in navigator)) return false;
  try {
    return Boolean(await navigator.gpu.requestAdapter());
  } catch {
    return false;
  }
}

async function loadModel(request: Extract<WorkerRequest, { type: "LOAD" }>) {
  if (loading || activeRequestId) throw new Error("Runtime is busy.");
  const model = getModelConfig(request.modelId);
  loading = true;
  try {
    const previous = engine;
    engine = null;
    selectedDevice = null;
    await previous?.dispose();
    const candidates: InferenceDevice[] =
      request.preferredDevice === "wasm" ? ["wasm"] :
      request.preferredDevice === "webgpu" ? ["webgpu"] :
      (await hasWebGPU() ? ["webgpu", "wasm"] : ["wasm"]);
    let lastError: unknown;
    for (const device of candidates) {
      try {
        send({ type: "STATUS", requestId: request.requestId, message: `Loading model with ${device.toUpperCase()}...` });
        engine = await BrowserLLM.create({
          modelId: model.modelId,
          device,
          onProgress: (event) => {
            if (typeof event.progress === "number") {
              send({ type: "PROGRESS", requestId: request.requestId,
                progress: Math.max(0, Math.min(100, event.progress)), file: event.file });
            }
            if (event.status) send({ type: "STATUS", requestId: request.requestId, message: event.status });
          },
        });
        selectedModel = model;
        selectedDevice = device;
        send({ type: "READY", requestId: request.requestId, device, modelId: model.modelId });
        return;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error("Unable to initialize an inference runtime.");
  } finally {
    loading = false;
  }
}

async function generate(request: Extract<WorkerRequest, { type: "GENERATE" }>) {
  if (!engine || !selectedDevice || loading) throw new Error("Model is not loaded.");
  if (request.modelId !== selectedModel.modelId) throw new Error("Load the selected model before generating a response.");
  if (activeRequestId) throw new Error("Another generation is already running.");
  activeRequestId = request.requestId;
  try {
    const result = await engine.generate({
      messages: request.messages,
      settings: {
        maxNewTokens: request.maxNewTokens ?? selectedModel.maxNewTokens,
        temperature: request.temperature ?? 0.7,
      },
      onText: (text) => send({ type: "TOKEN", requestId: request.requestId, token: text }),
    });
    send({ type: "DONE", requestId: request.requestId, generatedText: result.generatedText,
      cancelled: result.cancelled, benchmark: result.benchmark });
  } catch (error) {
    send({ type: "ERROR", requestId: request.requestId,
      message: error instanceof Error ? error.message : "Generation failed.",
      benchmark: error instanceof GenerationError ? error.benchmark : undefined });
  } finally {
    activeRequestId = null;
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
          if (activeRequestId === request.requestId) engine?.stop();
          break;
        case "UNLOAD": {
          if (activeRequestId || loading) throw new Error("Cannot unload while runtime is busy.");
          loading = true;
          try {
            const previous = engine;
            engine = null;
            selectedDevice = null;
            await previous?.dispose();
            send({ type: "STATUS", requestId: request.requestId, message: "Runtime reference released." });
          } finally {
            loading = false;
          }
          break;
        }
      }
    } catch (error) {
      send({ type: "ERROR", requestId: request.requestId,
        message: error instanceof Error ? error.message : "Worker operation failed." });
    }
  })();
};
