"use strict";
/**
 * ArivuClaw OpenAI Provider — GPT / o-series integration.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const logger_1 = require("../../utils/logger");
const log = logger_1.Logger.create("provider:openai");
class OpenAIProvider {
    type = "openai";
    name = "OpenAI (GPT)";
    apiKey;
    baseUrl;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || "https://api.openai.com/v1";
    }
    async chat(request) {
        const model = request.model || "gpt-4o";
        const messages = [
            { role: "system", content: request.systemPrompt },
            ...request.messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        ];
        const body = {
            model,
            messages,
            max_tokens: request.maxTokens || 4096,
        };
        if (request.temperature !== undefined) {
            body.temperature = request.temperature;
        }
        if (request.tools && request.tools.length > 0) {
            body.tools = request.tools.map((t) => ({
                type: "function",
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.inputSchema,
                },
            }));
        }
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error (${response.status}): ${error}`);
        }
        const data = (await response.json());
        return this.parseResponse(data);
    }
    async *streamChat(request) {
        // Simplified streaming implementation
        const response = await this.chat(request);
        yield { type: "text", text: response.content };
        yield { type: "done" };
    }
    async countTokens(text) {
        return Math.ceil(text.length / 4);
    }
    parseResponse(data) {
        const choices = data.choices;
        const choice = choices[0];
        const message = choice.message;
        const usage = data.usage;
        const toolCalls = [];
        if (message.tool_calls) {
            for (const tc of message.tool_calls) {
                const fn = tc.function;
                toolCalls.push({
                    id: tc.id,
                    name: fn.name,
                    input: JSON.parse(fn.arguments),
                });
            }
        }
        return {
            content: message.content || "",
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            usage: {
                inputTokens: usage.prompt_tokens,
                outputTokens: usage.completion_tokens,
            },
            stopReason: choice.finish_reason === "tool_calls" ? "tool_use" : "end",
            model: data.model,
        };
    }
}
exports.OpenAIProvider = OpenAIProvider;
//# sourceMappingURL=openai.js.map