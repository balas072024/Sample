/**
 * ArivuClaw OpenAI Provider — GPT / o-series integration.
 */

import type {
  LLMMessage,
  LLMProvider,
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  ProviderType,
} from "../../core/types.js";
import { Logger } from "../../utils/logger.js";

const log = Logger.create("provider:openai");

export class OpenAIProvider implements LLMProvider {
  readonly type: ProviderType = "openai";
  readonly name = "OpenAI (GPT)";

  private apiKey: string;
  private baseUrl: string;

  constructor(config: { apiKey: string; baseUrl?: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.openai.com/v1";
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model || "gpt-4o";

    const messages: Record<string, unknown>[] = [
      { role: "system", content: request.systemPrompt },
      ...request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const body: Record<string, unknown> = {
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

    const data = (await response.json()) as Record<string, unknown>;
    return this.parseResponse(data);
  }

  async *streamChat(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    // Simplified streaming implementation
    const response = await this.chat(request);
    yield { type: "text", text: response.content };
    yield { type: "done" };
  }

  async countTokens(text: string): Promise<number> {
    return Math.ceil(text.length / 4);
  }

  private parseResponse(data: Record<string, unknown>): LLMResponse {
    const choices = data.choices as Array<Record<string, unknown>>;
    const choice = choices[0];
    const message = choice.message as Record<string, unknown>;
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
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
      },
      stopReason: choice.finish_reason === "tool_calls" ? "tool_use" : "end",
      model: data.model as string,
    };
  }
}
