import type { WorkerRequest, WorkerResponse } from "./protocol";

type Listener = (message: WorkerResponse) => void;

export class InferenceWorkerClient {
  private worker: Worker;
  private listeners = new Set<Listener>();
  private pending = new Set<string>();

  constructor() {
    this.worker = new Worker(
      new URL("./inference.worker.ts", import.meta.url),
      { type: "module" },
    );
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (["READY", "DONE", "ERROR", "MODEL_SIZE"].includes(event.data.type)) this.pending.delete(event.data.requestId);
      for (const listener of this.listeners) listener(event.data);
    };
    this.worker.onerror = (event) => {
      for (const requestId of this.pending) {
        for (const listener of this.listeners) listener({ type: "ERROR", requestId, message: event.message || "Inference worker crashed. Reload the page to retry." });
      }
      this.pending.clear();
    };
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  post(request: WorkerRequest) {
    if (request.type === "LOAD" || request.type === "GENERATE" || request.type === "INSPECT") this.pending.add(request.requestId);
    this.worker.postMessage(request);
  }

  dispose() {
    this.listeners.clear();
    this.worker.terminate();
  }
}
