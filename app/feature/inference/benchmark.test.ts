import { test } from "node:test";
import assert from "node:assert/strict";
import { startResponseBenchmark } from "./benchmark";

const metadata = {
    modelId: "test/model", device: "wasm" as const, dtype: "q8",
    settings: { maxNewTokens: 64, temperature: 0.7 },
};

test("measures first actual token and counts token batches", () => {
    let time = 100;
    const measurement = startResponseBenchmark(metadata, () => time);
    measurement.setPromptTokens(20);
    time = 350;
    measurement.onTokens(0);
    time = 600;
    measurement.onTokens(1);
    time = 900;
    measurement.onTokens(3);
    time = 1100;
    const result = measurement.finish("complete");
    assert.equal(result.ttftMs, 500);
    assert.equal(result.totalMs, 1000);
    assert.equal(result.generatedTokens, 4);
    assert.equal(result.promptTokens, 20);
    assert.equal(result.tokensPerSecond, 4);
});

test("records cancellation before first token without division by zero", () => {
    const measurement = startResponseBenchmark(metadata, () => 100);
    const result = measurement.finish("cancelled");
    assert.equal(result.ttftMs, null);
    assert.equal(result.generatedTokens, 0);
    assert.equal(result.tokensPerSecond, 0);
    assert.equal(result.outcome, "cancelled");
});

test("retains partial metrics for failed generation and serializes for storage", () => {
    let time = 0;
    const measurement = startResponseBenchmark(metadata, () => time);
    time = 100;
    measurement.onTokens(2);
    time = 500;
    const result = measurement.finish("error");
    assert.equal(result.outcome, "error");
    assert.equal(result.generatedTokens, 2);
    assert.equal(result.ttftMs, 100);
    assert.equal(result.tokensPerSecond, 4);
    assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
});
