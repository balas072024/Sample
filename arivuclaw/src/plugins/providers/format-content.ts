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
export function formatMessageContent(
  content: string | LLMContentBlock[],
): string | Array<Record<string, unknown>> {
  if (typeof content === "string") {
    return content;
  }

  const parts: Array<Record<string, unknown>> = [];

  for (const block of content) {
    if (block.type === "text" && block.text) {
      parts.push({ type: "text", text: block.text });
    } else if (block.type === "image" && block.imageUrl) {
      parts.push({
        type: "image_url",
        image_url: { url: block.imageUrl },
      });
    }
  }

  return parts.length > 0 ? parts : String(content);
}
