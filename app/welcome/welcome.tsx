import { useState } from "react"
import { loadModel  } from "~/lib/inference/runtime";
import type { Generator } from "~/lib/inference/runtime";
import { generateResponse, type GenerationMetrics, type GenerationOptions } from "~/lib/inference/generation";
import { inspectTokenizer, tokenizeConversation, type TokenizationResult } from "~/lib/inference/tokenizer";

export function Welcome() {
  // useEffect(() => {
  //   inspectGPU();
  // }, []);
  return (
    <App />
  );
}

export default function App() {
  const [generator, setGenerator] =
    useState<Generator | null>(null);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Model not loaded");

  const [prompt, setPrompt] = useState(
    "Explain how WebGPU works.",
  );

  const [result, setResult] =
    useState<TokenizationResult | null>(null);

  const [vocabSize, setVocabSize] = useState<number | null>(null);
  const [template, setTemplate] = useState("");
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [generatedTokenCount, setGeneratedTokenCount] = useState(0);
  const [metrics, setMetrics] = useState<GenerationMetrics | null>(null);
  const [settings, setSettings] = useState<GenerationOptions>({
    maxNewTokens: 256,
    temperature: 0.7,
    topK: 50,
    topP: 0.9,
  });

  async function handleLoad() {
    try {
      setLoading(true);
      setError("");
      setStatus("Loading model...");

      const model = await loadModel({
        onStatus: setStatus,
      });

      // A Transformers pipeline is callable, so passing it directly makes
      // React treat it as a state updater. Wrap it to store the pipeline.
      setGenerator(() => model);

      const info = inspectTokenizer(model);

      setVocabSize(info.vocabularySize);
      setTemplate(info.chatTemplate);

      setStatus("Model and tokenizer ready");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Model loading failed",
      );
      setStatus("Failed");
    } finally {
      setLoading(false);
    }
  }

  function handleTokenize() {
    if (!generator || !prompt.trim()) return;

    try {
      setError("");

      const messages = [
        {
          role: "system" as const,
          content: "You are a helpful assistant.",
        },
        {
          role: "user" as const,
          content: prompt,
        },
      ];

      const output = tokenizeConversation(
        generator,
        messages,
      );

      setResult(output);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Tokenization failed",
      );
    }
  }

  async function handleGenerate() {
    if (!generator || !prompt.trim() || generating) return;

    const messages = [
      {
        role: "system" as const,
        content: "You are a helpful assistant.",
      },
      {
        role: "user" as const,
        content: prompt,
      },
    ];

    try {
      setGenerating(true);
      setError("");
      setGeneratedText("");
      setGeneratedTokenCount(0);
      setMetrics(null);
      setStatus("Generating response...");

      const generationMetrics = await generateResponse({
        generator,
        messages,
        settings,
        onText: (text) => {
          setGeneratedText((current) => current + text);
        },
        onTokenCount: setGeneratedTokenCount,
      });

      setMetrics(generationMetrics);
      setStatus("Generation complete");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Generation failed",
      );
      setStatus("Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-12 text-zinc-100">
      <div className="mx-auto max-w-4xl space-y-8">

        <header className="space-y-2">

          <h1 className="text-3xl font-bold">
            Tokenizer Playground
          </h1>

          <p className="text-zinc-400">
            Inspect Qwen tokenization and chat templates.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">
              Model status
            </h2>

            <span className="text-sm text-zinc-400">
              {status}
            </span>
          </div>

          <button
            onClick={handleLoad}
            disabled={loading || !!generator}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
          >
            {loading
              ? "Loading..."
              : generator
                ? "Model loaded"
                : "Load model"}
          </button>

          {vocabSize !== null && (
            <div className="rounded-xl bg-zinc-800 p-4">
              <p className="text-sm text-zinc-400">
                Vocabulary size
              </p>

              <p className="text-2xl font-bold">
                {vocabSize.toLocaleString()}
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
          <h2 className="font-semibold">
            Input prompt
          </h2>

          <textarea
            value={prompt}
            onChange={(event) => {
              setPrompt(event.target.value);
              setResult(null);
              setGeneratedText("");
              setGeneratedTokenCount(0);
              setMetrics(null);
            }}
            className="min-h-32 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-sm outline-none focus:border-blue-500"
            placeholder="Enter your message..."
          />

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleTokenize}
              disabled={!generator || !prompt.trim() || generating}
              className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold hover:bg-emerald-500 disabled:opacity-50"
            >
              Tokenize conversation
            </button>

            <button
              onClick={handleGenerate}
              disabled={!generator || !prompt.trim() || generating}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate response"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-5">
          <h2 className="font-semibold">Generation settings</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {([
              ["Max new tokens", "maxNewTokens", 1, 2048, 1],
              ["Temperature", "temperature", 0.01, 2, 0.01],
              ["Top K", "topK", 1, 200, 1],
              ["Top P", "topP", 0.01, 1, 0.01],
            ] as const).map(([label, key, min, max, step]) => (
              <label key={key} className="space-y-2 text-sm text-zinc-400">
                <span>{label}</span>
                <input
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  value={settings[key]}
                  disabled={generating}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setSettings((current) => ({
                      ...current,
                      [key]: Number.isFinite(value) ? value : current[key],
                    }));
                  }}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </label>
            ))}
          </div>
        </section>

        {(generating || generatedText || metrics) && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">Generated response</h2>
              <span className="text-sm text-zinc-400">
                {generatedTokenCount} generated tokens
              </span>
            </div>

            <div className="min-h-32 whitespace-pre-wrap rounded-xl bg-zinc-950 p-4 text-sm leading-7 text-zinc-200">
              {generatedText || "Waiting for the first token..."}
            </div>

            {metrics && (
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-xl bg-zinc-800 p-4">
                  <p className="text-zinc-400">Prompt tokens</p>
                  <p className="mt-1 text-lg font-semibold">{metrics.promptTokens}</p>
                </div>
                <div className="rounded-xl bg-zinc-800 p-4">
                  <p className="text-zinc-400">Elapsed time</p>
                  <p className="mt-1 text-lg font-semibold">{(metrics.elapsedMs / 1000).toFixed(2)}s</p>
                </div>
                <div className="rounded-xl bg-zinc-800 p-4">
                  <p className="text-zinc-400">Generation speed</p>
                  <p className="mt-1 text-lg font-semibold">{metrics.tokensPerSecond.toFixed(2)} tok/s</p>
                </div>
              </div>
            )}
          </section>
        )}

        {result && (
          <section className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">
                  Input tokens
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {result.tokenCount}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">
                  Vocabulary size
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {vocabSize?.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
              <h2 className="font-semibold">
                Formatted chat template
              </h2>

              <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-zinc-950 p-4 text-xs leading-6 text-emerald-300">
                {result.formattedPrompt}
              </pre>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
              <h2 className="font-semibold">
                Token IDs
              </h2>

              <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-zinc-950 p-4 text-xs leading-6 text-blue-300">
                {JSON.stringify(result.tokenIds)}
              </pre>
            </div>
          </section>
        )}

        {template && (
          <details className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <summary className="cursor-pointer font-semibold">
              Inspect original tokenizer template
            </summary>

            <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-zinc-950 p-4 text-xs text-zinc-400">
              {template}
            </pre>
          </details>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

      </div>
    </main>
  );
}
