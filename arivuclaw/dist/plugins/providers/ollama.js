"use strict";
/**
 * ArivuClaw Ollama Provider — Local model support.
 *
 * Improvement over OpenClaw: First-class local model support
 * with automatic model detection and resource management.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaProvider = void 0;
const format_content_1 = require("./format-content");
const logger_1 = require("../../utils/logger");
const log = logger_1.Logger.create("provider:ollama");
class OllamaProvider {
    type = "ollama";
    name = "Ollama (Local)";
    baseUrl;
    constructor(config) {
        this.baseUrl = config.baseUrl || "http://localhost:11434";
    }
    async chat(request) {
        const model = request.model || "llama3.1";
        const messages = [
            { role: "system", content: request.systemPrompt },
            ...request.messages.map((m) => ({
                role: m.role,
                content: (0, format_content_1.formatMessageContent)(m.content),
            })),
        ];
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                messages,
                stream: false,
                options: {
                    temperature: request.temperature || 0.7,
                    num_predict: request.maxTokens || 4096,
                },
            }),
        });
        if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
        }
        const data = (await response.json());
        const msg = data.message;
        return {
            content: msg.content,
            usage: {
                inputTokens: data.prompt_eval_count || 0,
                outputTokens: data.eval_count || 0,
            },
            stopReason: "end",
            model,
        };
    }
    async *streamChat(request) {
        const model = request.model || "llama3.1";
        const messages = [
            { role: "system", content: request.systemPrompt },
            ...request.messages.map((m) => ({
                role: m.role,
                content: (0, format_content_1.formatMessageContent)(m.content),
            })),
        ];
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model, messages, stream: true }),
        });
        if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
        }
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
                    if (!line.trim())
                        continue;
                    const data = JSON.parse(line);
                    if (data.message?.content) {
                        yield { type: "text", text: data.message.content };
                    }
                    if (data.done) {
                        yield { type: "done" };
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    async countTokens(text) {
        return Math.ceil(text.length / 4);
    }
    /**
     * Check which models are available locally.
     */
    async listModels() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok)
                return [];
            const data = (await response.json());
            return data.models.map((m) => m.name);
        }
        catch {
            return [];
        }
    }
}
exports.OllamaProvider = OllamaProvider;
//# sourceMappingURL=ollama.js.map