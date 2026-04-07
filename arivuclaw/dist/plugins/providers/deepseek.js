"use strict";
/**
 * ArivuClaw DeepSeek Provider — Free/cheap DeepSeek models.
 *
 * DeepSeek offers competitive free-tier and very low-cost access.
 * Uses OpenAI-compatible API format.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepSeekProvider = void 0;
const format_content_1 = require("./format-content");
const logger_1 = require("../../utils/logger");
const log = logger_1.Logger.create("provider:deepseek");
class DeepSeekProvider {
    type = "deepseek";
    name = "DeepSeek";
    apiKey;
    baseUrl;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || "https://api.deepseek.com/v1";
    }
    async chat(request) {
        const model = request.model || "deepseek-chat";
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: "system", content: request.systemPrompt },
                    ...request.messages.map((m) => ({
                        role: m.role,
                        content: (0, format_content_1.formatMessageContent)(m.content),
                    })),
                ],
                max_tokens: request.maxTokens || 4096,
                temperature: request.temperature || 0.7,
                tools: request.tools?.map((t) => ({
                    type: "function",
                    function: { name: t.name, description: t.description, parameters: t.inputSchema },
                })),
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`DeepSeek API error (${response.status}): ${error}`);
        }
        const data = (await response.json());
        const choices = data.choices;
        const message = choices[0].message;
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
                inputTokens: usage?.prompt_tokens || 0,
                outputTokens: usage?.completion_tokens || 0,
            },
            stopReason: choices[0].finish_reason === "tool_calls" ? "tool_use" : "end",
            model: data.model,
        };
    }
    async *streamChat(request) {
        const response = await this.chat(request);
        yield { type: "text", text: response.content };
        yield { type: "done" };
    }
    async countTokens(text) {
        return Math.ceil(text.length / 4);
    }
    getAvailableModels() {
        return ["deepseek-chat", "deepseek-coder", "deepseek-reasoner"];
    }
}
exports.DeepSeekProvider = DeepSeekProvider;
//# sourceMappingURL=deepseek.js.map