/**
 * Shared helper to convert LLMContentBlock[] to OpenAI-compatible content format.
 * Used by all providers that speak the OpenAI chat completions API.
 */
import type { LLMContentBlock } from "../../core/types";
/**
 * Converts LLMMessage content to OpenAI-compatible format.
 * - String content passes through unchanged.
 * - LLMContentBlock[] is converted to OpenAI vision/multimodal format.
 */
export declare function formatMessageContent(content: string | LLMContentBlock[]): string | Array<Record<string, unknown>>;
//# sourceMappingURL=format-content.d.ts.map