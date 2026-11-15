import { test } from "node:test";
import assert from "node:assert/strict";
import { PreTrainedTokenizer, InterruptableStoppingCriteria, StoppingCriteriaList, type TextStreamer } from "@huggingface/transformers";
import { generateResponse, GenerationError } from "./generation";
import type { Generator } from "./runtime";

const tokenizer = new PreTrainedTokenizer({
  model: { type: "WordLevel", vocab: { "[UNK]": 0, hello: 1 }, unk_token: "[UNK]" },
  pre_tokenizer: { type: "Whitespace" }, decoder: null, normalizer: null,
  post_processor: null, added_tokens: [],
}, {
  unk_token: "[UNK]",
  chat_template: "{% for message in messages %}{{ message['content'] }} {% endfor %}",
});

const settings = { maxNewTokens: 8, temperature: 0, topK: 50, topP: 1 };
const messages = [{ role: "user" as const, content: "hello" }];

// Stand in for model execution, while exercising the real tokenizer and streamer.
function pipeline(run: (streamer: TextStreamer, criteria?: StoppingCriteriaList) => void | Promise<void>) {
  return Object.assign(async (_prompt: string, options: { streamer: TextStreamer; stopping_criteria?: StoppingCriteriaList; do_sample: boolean }) => {
    assert.equal(options.do_sample, false);
    options.streamer.put([[1n, 1n, 1n]]); // Prompt IDs must not be counted.
    await run(options.streamer, options.stopping_criteria);
  }, { tokenizer }) as unknown as Generator;
}

test("shared generation streams text and benchmarks actual output tokens", async () => {
  const chunks: string[] = [];
  const result = await generateResponse({
    generator: pipeline((streamer) => { streamer.put([[1n]]); streamer.end(); }),
    device: "wasm", messages, settings, onText: (text) => chunks.push(text),
  });
  assert.equal(result.generatedText, "hello");
  assert.equal(chunks.join(""), result.generatedText);
  assert.equal(result.generatedTokens, 1);
  assert.equal(result.benchmark.generatedTokens, 1);
  assert.equal(result.benchmark.device, "wasm");
  assert.equal(result.benchmark.outcome, "complete");
  assert.notEqual(result.benchmark.ttftMs, null);
});

test("cancellation keeps partial text and marks its benchmark cancelled", async () => {
  const stopping = new InterruptableStoppingCriteria();
  const criteria = new StoppingCriteriaList();
  criteria.push(stopping);
  const result = await generateResponse({
    generator: pipeline((streamer, received) => {
      assert.equal(received, criteria);
      streamer.put([[1n]]);
      stopping.interrupt();
      streamer.end();
    }),
    messages, settings, onText: () => {}, stoppingCriteria: criteria,
    isCancelled: () => stopping.interrupted,
  });
  assert.equal(result.generatedText, "hello");
  assert.equal(result.cancelled, true);
  assert.equal(result.benchmark.outcome, "cancelled");
});

test("inference failures retain partial token metrics", async () => {
  await assert.rejects(generateResponse({
    generator: pipeline((streamer) => { streamer.put([[1n]]); throw new Error("Execution failed"); }),
    messages, settings, onText: () => {},
  }), (error: unknown) => {
    assert.ok(error instanceof GenerationError);
    assert.match(error.message, /Execution failed/);
    assert.equal(error.benchmark.outcome, "error");
    assert.equal(error.benchmark.generatedTokens, 1);
    return true;
  });
});
