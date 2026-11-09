
import type { Generator } from "./runtime";

export type ChatMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};

export type TokenizationResult = {
    formattedPrompt: string;
    tokenIds: number[];
    tokenCount: number;
};

export function inspectTokenizer(generator: Generator) {
    const tokenizer = generator.tokenizer;
    const vocabularySize = tokenizer.get_vocab().size;

    return {
        vocabularySize,
        chatTemplate: tokenizer.get_chat_template(),
    };
}

export function tokenizeConversation(
    generator: Generator,
    messages: ChatMessage[],
): TokenizationResult {
    const tokenizer = generator.tokenizer;

    // First inspect the human-readable formatted prompt.
    const formattedPrompt = tokenizer.apply_chat_template(
        messages,
        {
            tokenize: false,
            add_generation_prompt: true,
        },
    ) as string;

    // Apply the same template and convert directly to IDs.
    const encoded = tokenizer.apply_chat_template(
        messages,
        {
            tokenize: true,
            add_generation_prompt: true,
            return_tensor: false,
            return_dict: false,
        },
    );

    const tokenIds = Array.from(encoded);

    return {
        formattedPrompt,
        tokenIds,
        tokenCount: tokenIds.length,
    };
}
