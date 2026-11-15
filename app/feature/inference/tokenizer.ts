
import type { Generator } from "./runtime";
import { getModelConfig } from "./config";
import { renderPrompt } from "./prompt";

export type ChatMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};

export type TokenizationResult = {
    formattedPrompt: string;
    tokenIds: number[];
    tokenCount: number;
};

export function inspectTokenizer(generator: Generator, modelId?: string) {
    const tokenizer = generator.tokenizer;
    const vocabularySize = tokenizer.get_vocab().size;

    return {
        vocabularySize,
        chatTemplate: getModelConfig(modelId).chatTemplate ? tokenizer.get_chat_template() : "",
    };
}

export function tokenizeConversation(
    generator: Generator,
    messages: ChatMessage[],
    modelId?: string,
): TokenizationResult {
    const tokenizer = generator.tokenizer;

    // First inspect the human-readable formatted prompt.
    const formattedPrompt = renderPrompt(tokenizer, messages, getModelConfig(modelId).chatTemplate);

    // Apply the same template and convert directly to IDs.
    const encoded = tokenizer.encode(formattedPrompt, { add_special_tokens: false });

    const tokenIds = Array.from(encoded);

    return {
        formattedPrompt,
        tokenIds,
        tokenCount: tokenIds.length,
    };
}
