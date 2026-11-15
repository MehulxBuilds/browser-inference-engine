import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AssistantMarkdown } from "./assistant-markdown";

const render = (content: string) => renderToStaticMarkup(createElement(AssistantMarkdown, { content }));

test("renders headings, emphasis, lists and GFM tables", () => {
    const html = render("### Cache\n\n**Bold**\n\n- Item\n\n| Model | MB |\n| --- | --- |\n| Qwen | 413 |");
    assert.match(html, /<h3>Cache<\/h3>/);
    assert.match(html, /<strong>Bold<\/strong>/);
    assert.match(html, /<li>Item<\/li>/);
    assert.match(html, /<table>/);
    assert.match(html, /craft-markdown-table/);
});

test("renders unfinished streamed code fences without executing HTML", () => {
    const html = render('```html\n<script>alert(1)</script>');
    assert.match(html, /<pre tabindex="0"><code/);
    assert.match(html, /&lt;script&gt;/);
    assert.doesNotMatch(html, /<script>/);
});

test("ignores raw HTML and blocks unsafe link protocols", () => {
    const html = render('<script>alert(1)</script>\n\n[unsafe](javascript:alert%281%29)\n\n[safe](https://example.com)');
    assert.doesNotMatch(html, /<script>|href="javascript:/);
    assert.match(html, /href="https:\/\/example.com"/);
    assert.match(html, /rel="noopener noreferrer"/);
});
