/**
 * ArivuClaw Groq Provider — Ultra-fast inference, free tier available.
 *
 * Groq provides very fast inference with free API access for
 * Llama, Mixtral, and Gemma models.
 */

import type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  ProviderType,
} from "../../core/types";
import { Logger } from "../../utils/logger";

const log = Logger.create("provider:groq");

export class GroqProvider implements LLMProvider {
  readonly type: ProviderType = "groq";
  readonly name = "Groq (Fast Inference)";

  private apiKey: string;
  private baseUrl: string;

  constructor(config: { apiKey: string; baseUrl?: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.groq.com/openai/v1";
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model || "llama-3.3-70b-versatile";

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
            content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
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
      throw new Error(`Groq API error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    const choices = data.choices as Array<Record<string, unknown>>;
    const message = choices[0].message as Record<string, unknown>;
    const usage = data.usage as Record<string, number>;

    const toolCalls: LLMResponse["toolCalls"] = [];
    if (message.tool_calls) {
      for (const tc of message.tool_calls as Array<Record<string, unknown>>) {
        const fn = tc.function as Record<string, unknown>;
        toolCalls.push({
          id: tc.id as string,
          name: fn.name as string,
          input: JSON.parse(fn.arguments as string),
        });
      }
    }

    return {
      content: (message.content as string) || "",
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
      },
      stopReason: choices[0].finish_reason === "tool_calls" ? "tool_use" : "end",
      model: data.model as string,
    };
  }

  async *streamChat(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    const response = await this.chat(request);
    yield { type: "text", text: response.content };
    yield { type: "done" };
  }

  async countTokens(text: string): Promise<number> {
    return Math.ceil(text.length / 4);
  }

  getAvailableModels(): string[] {
    return [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
    ];
  }
}
