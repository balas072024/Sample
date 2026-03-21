"use strict";
/**
 * Shared helper to convert LLMContentBlock[] to OpenAI-compatible content format.
 * Used by all providers that speak the OpenAI chat completions API.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMessageContent = formatMessageContent;
/**
 * Converts LLMMessage content to OpenAI-compatible format.
 * - String content passes through unchanged.
 * - LLMContentBlock[] is converted to OpenAI vision/multimodal format.
 */
function formatMessageContent(content) {
    if (typeof content === "string") {
        return content;
    }
    const parts = [];
    for (const block of content) {
        if (block.type === "text" && block.text) {
            parts.push({ type: "text", text: block.text });
        }
        else if (block.type === "image" && block.imageUrl) {
            parts.push({
                type: "image_url",
                image_url: { url: block.imageUrl },
            });
        }
    }
    return parts.length > 0 ? parts : String(content);
}
//# sourceMappingURL=format-content.js.map