import type { InferenceDevice } from "./config";

export type ResponseBenchmark = {
  modelId: string;
  device: InferenceDevice;
  dtype: string;
  settings: { maxNewTokens: number; temperature: number };
  measuredAt: number;
  outcome: "complete" | "cancelled" | "error";
  promptTokens: number | null;
  generatedTokens: number;
  ttftMs: number | null;
  totalMs: number;
  tokensPerSecond: number;
};

// Observe a real response once; runBenchmark below is for repeated comparisons.
export function startResponseBenchmark(
  metadata: Pick<ResponseBenchmark, "modelId" | "device" | "dtype" | "settings">,
  now: () => number = () => performance.now(),
) {
  const start = now();
  const measuredAt = Date.now();
  let firstTokenAt: number | null = null;
  let generatedTokens = 0;
  let promptTokens: number | null = null;

  return {
    setPromptTokens(count: number) { promptTokens = count; },
    onTokens(count: number) {
      if (count <= 0) return;
      firstTokenAt ??= now();
      generatedTokens += count;
    },
    finish(outcome: ResponseBenchmark["outcome"]): ResponseBenchmark {
      const totalMs = Math.max(0, now() - start);
      return {
        ...metadata,
        settings: { ...metadata.settings },
        measuredAt,
        outcome,
        promptTokens,
        generatedTokens,
        ttftMs: firstTokenAt === null ? null : Math.max(0, firstTokenAt - start),
        totalMs,
        tokensPerSecond: totalMs > 0 ? generatedTokens / (totalMs / 1000) : 0,
      };
    },
  };
}

export type BenchmarkSample = {
  ttftMs: number;
  totalMs: number;
  generatedTokens: number;
  tokensPerSecond: number;
};

export type BenchmarkReport = {
  warmupRuns: number;
  measuredRuns: number;
  samples: BenchmarkSample[];
  ttftMedianMs: number;
  ttftP90Ms: number;
  totalMedianMs: number;
  totalP90Ms: number;
  tokensPerSecondMedian: number;
};

function percentile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)];
}

export async function runBenchmark(options: {
  warmupRuns?: number;
  measuredRuns?: number;
  generate: (onFirstToken: () => void) => Promise<number>;
}): Promise<BenchmarkReport> {
  const warmups = options.warmupRuns ?? 1;
  const runs = options.measuredRuns ?? 5;
  if (!Number.isInteger(warmups) || warmups < 0 || !Number.isInteger(runs) || runs < 1) {
    throw new Error("Invalid benchmark configuration.");
  }

  for (let i = 0; i < warmups; i++) await options.generate(() => {});

  const samples: BenchmarkSample[] = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    let first: number | null = null;
    const tokens = await options.generate(() => {
      first ??= performance.now();
    });
    const end = performance.now();
    if (first === null || !Number.isInteger(tokens) || tokens < 0) {
      throw new Error("Invalid benchmark sample.");
    }
    const totalMs = end - start;
    const ttftMs = first - start;
    samples.push({
      ttftMs,
      totalMs,
      generatedTokens: tokens,
      tokensPerSecond: tokens / (totalMs / 1000),
    });
  }

  const ttft = samples.map((s) => s.ttftMs);
  const total = samples.map((s) => s.totalMs);
  const tps = samples.map((s) => s.tokensPerSecond);
  return {
    warmupRuns: warmups,
    measuredRuns: runs,
    samples,
    ttftMedianMs: percentile(ttft, 0.5),
    ttftP90Ms: percentile(ttft, 0.9),
    totalMedianMs: percentile(total, 0.5),
    totalP90Ms: percentile(total, 0.9),
    tokensPerSecondMedian: percentile(tps, 0.5),
  };
}
