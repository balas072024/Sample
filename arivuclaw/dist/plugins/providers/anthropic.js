"use strict";
/**
 * ArivuClaw Anthropic Provider — Claude integration.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicProvider = void 0;
const logger_1 = require("../../utils/logger");
const log = logger_1.Logger.create("provider:anthropic");
class AnthropicProvider {
    type = "anthropic";
    name = "Anthropic (Claude)";
    apiKey;
    baseUrl;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || "https://api.anthropic.com";
    }
    async chat(request) {
        const model = request.model || "claude-sonnet-4-6";
        const body = {
            model,
            max_tokens: request.maxTokens || 4096,
            system: request.systemPrompt,
            messages: this.formatMessages(request.messages),
        };
        if (request.temperature !== undefined) {
            body.temperature = request.temperature;
        }
        if (request.tools && request.tools.length > 0) {
            body.tools = request.tools.map((t) => ({
                name: t.name,
                description: t.description,
                input_schema: t.inputSchema,
            }));
        }
        if (request.stopSequences) {
            body.stop_sequences = request.stopSequences;
        }
        const response = await fetch(`${this.baseUrl}/v1/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": this.apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Anthropic API error (${response.status}): ${error}`);
        }
        const data = (await response.json());
        return this.parseResponse(data);
    }
    async *streamChat(request) {
        const model = request.model || "claude-sonnet-4-6";
        const body = {
            model,
            max_tokens: request.maxTokens || 4096,
            system: request.systemPrompt,
            messages: this.formatMessages(request.messages),
            stream: true,
        };
        if (request.temperature !== undefined) {
            body.temperature = request.temperature;
        }
        const response = await fetch(`${this.baseUrl}/v1/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": this.apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status}`);
        }
        // Parse SSE stream
        const reader = response.body?.getReader();
        if (!reader)
            throw new Error("No response body");
        const decoder = new TextDecoder();
        let buffer = "";
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";
                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = JSON.parse(line.slice(6));
                        if (data.type === "content_block_delta" && data.delta?.type === "text_delta") {
                            yield { type: "text", text: data.delta.text };
                        }
                        if (data.type === "message_stop") {
                            yield { type: "done" };
                        }
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    async countTokens(text) {
        // Rough estimate: ~4 chars per token for Claude
        return Math.ceil(text.length / 4);
    }
    formatMessages(messages) {
        return messages.map((msg) => ({
            role: msg.role,
            content: typeof msg.content === "string"
                ? msg.content
                : msg.content.map((block) => {
                    if (block.type === "text")
                        return { type: "text", text: block.text };
                    if (block.type === "image") {
                        return {
                            type: "image",
                            source: { type: "url", url: block.imageUrl },
                        };
                    }
                    return { type: "text", text: block.text || "" };
                }),
        }));
    }
    parseResponse(data) {
        const content = data.content;
        const usage = data.usage;
        let textContent = "";
        const toolCalls = [];
        for (const block of content) {
            if (block.type === "text") {
                textContent += block.text;
            }
            if (block.type === "tool_use") {
                toolCalls.push({
                    id: block.id,
                    name: block.name,
                    input: block.input,
                });
            }
        }
        return {
            content: textContent,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            usage: {
                inputTokens: usage.input_tokens,
                outputTokens: usage.output_tokens,
            },
            stopReason: this.mapStopReason(data.stop_reason),
            model: data.model,
        };
    }
    mapStopReason(reason) {
        switch (reason) {
            case "end_turn":
                return "end";
            case "tool_use":
                return "tool_use";
            case "max_tokens":
                return "max_tokens";
            case "stop_sequence":
                return "stop_sequence";
            default:
                return "end";
        }
    }
}
exports.AnthropicProvider = AnthropicProvider;
//# sourceMappingURL=anthropic.js.map