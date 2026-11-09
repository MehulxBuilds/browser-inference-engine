import { useEffect, useRef, useState } from "react"
import { BrowserLLM } from "~/lib/inference/engine";
import type { EngineState } from "~/lib/inference/engine-types";
import type { ChatMessage } from "~/lib/inference/tokenizer";
import { inspectModel } from "~/lib/inference/model-registry";

export function Welcome() {
  // useEffect(() => {
  //   inspectGPU();
  // }, []);
  return (
    <App />
  );
}

export default function App() {
  const engineRef = useRef<BrowserLLM | null>(null);
  const lifetimeRef = useRef({ active: false });
  const loadingRef = useRef(false);

  const [state, setState] = useState<EngineState>("idle");
  const [status, setStatus] = useState("Not initialized");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [modelSize, setModelSize] = useState<number | null>(null);
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    const lifetime = { active: true };
    lifetimeRef.current = lifetime;

    // Fetch metadata only; model weights load after the user clicks Load.
    void inspectModel().then((inspection) => {
      if (lifetime.active) setModelSize(inspection.totalSize);
    }).catch(() => {
      if (lifetime.active) setSizeError(true);
    });

    return () => {
      lifetime.active = false;
      const engine = engineRef.current;
      engineRef.current = null;
      // An active generation releases its engine in handleGenerate's finally.
      if (engine && engine.getState() !== "generating") {
        engine.dispose();
      }
    };
  }, []);

  async function handleLoad() {
    if (loadingRef.current || engineRef.current) return;
    const lifetime = lifetimeRef.current;
    loadingRef.current = true;
    setError("");
    setStatus("Loading model...");

    try {
      const engine = await BrowserLLM.create({
        onStatus: (value) => {
          if (lifetime.active) setStatus(value);
        },
        onStateChange: (value) => {
          if (lifetime.active) setState(value);
        },
        onProgress: (progress) => {
          if (lifetime.active && progress.status === "progress") {
            setStatus(`${progress.file ?? "Model"}: ${Math.round(progress.progress ?? 0)}%`);
          }
        },
      });

      if (!lifetime.active) {
        engine.dispose();
        return;
      }
      engineRef.current = engine;
    } catch (err) {
      if (lifetime.active) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("Model loading failed");
      }
    } finally {
      loadingRef.current = false;
    }
  }

  async function handleGenerate() {
    const engine = engineRef.current;
    const text = prompt.trim();

    if (!engine || !text || state !== "ready") return;
    const lifetime = lifetimeRef.current;

    setError("");
    setAnswer("");
    setPrompt("");

    const messages: ChatMessage[] = [
      {
        role: "user",
        content: text,
      },
    ];

    try {
      await engine.generate({
        messages,
        onText: (chunk) => {
          if (lifetime.active) setAnswer((previous) => previous + chunk);
        },
      });
    } catch (err) {
      if (lifetime.active) setError(
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      if (!lifetime.active) engine.dispose();
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-12 text-white">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold">
            Browser LLM
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Local inference using Transformers.js and WebGPU
          </p>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-400">
              Engine state
            </span>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">
              {state}
            </span>
          </div>

          <p className="mt-3 text-sm text-slate-300">
            {status}
          </p>

          <button
            onClick={handleLoad}
            disabled={state === "loading" || state === "ready" || state === "generating"}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {state === "loading"
              ? "Loading model..."
              : state === "ready" || state === "generating"
                ? "Model loaded"
                : "Load model"}
            {modelSize !== null && modelSize > 0
              ? ` (${(modelSize / 1_000_000).toFixed(1)} MB)`
              : sizeError || modelSize === 0
                ? " (size unavailable)"
                : " (checking size...)"}
          </button>
        </section>

        <section className="space-y-4">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask something..."
            rows={4}
            className="w-full resize-y rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm outline-none focus:border-blue-500"
          />

          <button
            onClick={handleGenerate}
            disabled={state !== "ready" || !prompt.trim()}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {state === "generating" ? "Generating..." : "Generate"}
          </button>
        </section>

        {answer && (
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-400">
              Response
            </h2>

            <p className="whitespace-pre-wrap leading-7">
              {answer}
            </p>
          </section>
        )}

        {error && (
          <p className="rounded-lg border border-red-900 bg-red-950 p-4 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
