export function softmax(logits: number[]): number[] {
  if (!logits.length || logits.some((x) => !Number.isFinite(x))) {
    throw new Error("Logits must be a non-empty finite array.");
  }
  const max = Math.max(...logits);
  const exps = logits.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((x) => x / sum);
}

export function greedySample(logits: number[]) {
  return logits.reduce(
    (best, value, index) => value > logits[best] ? index : best,
    0,
  );
}

export function applyTemperature(logits: number[], temperature: number) {
  if (!(temperature > 0)) throw new Error("Temperature must be greater than zero.");
  return logits.map((x) => x / temperature);
}

export function applyTopK(logits: number[], k: number) {
  if (!Number.isInteger(k) || k < 1) throw new Error("k must be a positive integer.");
  const indices = logits.map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value);
  const keep = new Set(indices.slice(0, k).map((x) => x.index));
  return logits.map((value, index) => keep.has(index) ? value : -Infinity);
}

export function sampleCategorical(probabilities: number[]) {
  const total = probabilities.reduce((a, b) => a + b, 0);
  if (!(total > 0) || probabilities.some((p) => p < 0 || !Number.isFinite(p))) {
    throw new Error("Invalid probability distribution.");
  }
  let r = Math.random() * total;
  for (let i = 0; i < probabilities.length; i++) {
    r -= probabilities[i];
    if (r <= 0) return i;
  }
  return probabilities.length - 1;
}
