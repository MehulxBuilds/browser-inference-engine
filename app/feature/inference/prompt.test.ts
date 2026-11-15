import { test } from "node:test";
import assert from "node:assert/strict";
import { PreTrainedTokenizer } from "@huggingface/transformers";
import { getModelConfig } from "./config";
import { preparePrompt, renderPrompt } from "./prompt";

const tokenizer = new PreTrainedTokenizer({
  model: { type: "WordLevel", vocab: { "[UNK]": 0, hello: 1 }, unk_token: "[UNK]" },
  pre_tokenizer: { type: "Whitespace" },
  decoder: null,
  normalizer: null,
  post_processor: null,
  added_tokens: [],
}, {
  unk_token: "[UNK]",
  chat_template: "{% for message in messages %}{{ message['role'] }}: {{ message['content'] }}\n{% endfor %}{% if add_generation_prompt %}assistant:{% endif %}",
});

test("completion formatting continues raw user text without requiring a chat template", () => {
  assert.equal(renderPrompt(tokenizer, [{ role: "user", content: "hello" }], false), "hello");
});

test("chat models render the tokenizer's template and assistant prefix", () => {
  const prompt = renderPrompt(tokenizer, [{ role: "user", content: "hello" }], true);
  assert.match(prompt, /user: hello/);
  assert.match(prompt, /assistant:$/);
});

test("context trimming removes complete old turns and preserves current input", () => {
  const model = { ...getModelConfig(), chatTemplate: false, contextWindowTokens: 6 };
  const prompt = preparePrompt(tokenizer, [
    { role: "user", content: "hello hello hello hello" },
    { role: "assistant", content: "hello hello hello hello" },
    { role: "user", content: "hello" },
  ], model, 2);
  assert.equal(prompt, "hello");
});

test("rejects oversized current input and invalid output budgets", () => {
  const model = { ...getModelConfig(), contextWindowTokens: 6 };
  assert.throws(() => preparePrompt(tokenizer, [{ role: "user", content: "hello hello hello hello hello hello" }], model, 2), /context window/);
  assert.throws(() => preparePrompt(tokenizer, [{ role: "user", content: "hello" }], model, 6), /budget/);
  assert.throws(() => preparePrompt(tokenizer, [{ role: "assistant", content: "" }], model, 2), /latest message/);
});
