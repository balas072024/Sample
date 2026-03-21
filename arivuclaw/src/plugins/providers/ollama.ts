/**
 * Arivumaiyam AI Ollama Provider — Local model support.
 *
 * Improvement over OpenClaw: First-class local model support
 * with automatic model detection and resource management.
 */

import type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  ProviderType,
} from "../../core/types";
import { Logger } from "../../utils/logger";

const log = Logger.create("provider:ollama");

export class OllamaProvider implements LLMProvider {
  readonly type: ProviderType = "ollama";
  readonly name = "Ollama (Local)";

  private baseUrl: string;

  constructor(config: { baseUrl?: string }) {
    this.baseUrl = config.baseUrl || "http://localhost:11434";
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model || "llama3.1";

    const messages = [
      { role: "system", content: request.systemPrompt },
      ...request.messages.map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
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

    const data = (await response.json()) as Record<string, unknown>;
    const msg = data.message as Record<string, string>;

    return {
      content: msg.content,
      usage: {
        inputTokens: (data.prompt_eval_count as number) || 0,
        outputTokens: (data.eval_count as number) || 0,
      },
      stopReason: "end",
      model,
    };
  }

  async *streamChat(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    const model = request.model || "llama3.1";

    const messages = [
      { role: "system", content: request.systemPrompt },
      ...request.messages.map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
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
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const data = JSON.parse(line);
          if (data.message?.content) {
            yield { type: "text", text: data.message.content };
          }
          if (data.done) {
            yield { type: "done" };
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async countTokens(text: string): Promise<number> {
    return Math.ceil(text.length / 4);
  }

  /**
   * Check which models are available locally.
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];
      const data = (await response.json()) as { models: { name: string }[] };
      return data.models.map((m) => m.name);
    } catch {
      return [];
    }
  }
}
