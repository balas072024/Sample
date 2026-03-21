/**
 * ArivuClaw MiniMax Provider — MiniMax AI model integration.
 *
 * MiniMax offers free-tier access and competitive models.
 * API: https://api.minimax.chat
 *
 * Models:
 * - abab6.5s-chat  — Fast, lightweight
 * - abab6.5-chat   — Balanced
 * - abab5.5s-chat  — Legacy
 * - MiniMax-Text-01 — Latest flagship
 */

import type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  ProviderType,
} from "../../core/types";
import { formatMessageContent } from "./format-content";
import { Logger } from "../../utils/logger";

const log = Logger.create("provider:minimax");

export class MiniMaxProvider implements LLMProvider {
  readonly type: ProviderType = "minimax";
  readonly name = "MiniMax AI";

  private apiKey: string;
  private groupId: string;
  private baseUrl: string;

  constructor(config: { apiKey: string; groupId?: string; baseUrl?: string }) {
    this.apiKey = config.apiKey;
    this.groupId = config.groupId || "";
    this.baseUrl = config.baseUrl || "https://api.minimax.io/v1";
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model || "MiniMax-Text-01";

    const messages = [
      {
        sender_type: "BOT",
        sender_name: "ArivuClaw",
        text: request.systemPrompt,
      },
      ...request.messages.map((m) => ({
        sender_type: m.role === "user" ? "USER" : "BOT",
        sender_name: m.role === "user" ? "User" : "ArivuClaw",
        text: typeof m.content === "string" ? m.content : String(formatMessageContent(m.content)),
      })),
    ];

    const body: Record<string, unknown> = {
      model,
      messages,
      tokens_to_generate: request.maxTokens || 4096,
      temperature: request.temperature || 0.7,
      prompt: request.systemPrompt,
      role_meta: {
        user_name: "User",
        bot_name: "ArivuClaw",
      },
    };

    // MiniMax also supports OpenAI-compatible endpoint
    // Try the ChatCompletion-compatible API first
    const formattedMessages = [
      { role: "system", content: request.systemPrompt },
      ...request.messages.map((m) => ({
        role: m.role,
        content: formatMessageContent(m.content),
      })),
    ];

    const response = await fetch(`${this.baseUrl}/text/chatcompletion_v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        max_tokens: Math.min(request.maxTokens || 4096, 8192),
        temperature: request.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error(`MiniMax chatcompletion_v2 failed (${response.status}): ${errorText}`);
      // Fallback to OpenAI-compatible endpoint
      const fallbackResp = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          max_tokens: Math.min(request.maxTokens || 4096, 8192),
          temperature: request.temperature || 0.7,
        }),
      });

      if (!fallbackResp.ok) {
        const fbError = await fallbackResp.text();
        log.error(`MiniMax chat/completions also failed (${fallbackResp.status}): ${fbError}`);
        throw new Error(`MiniMax API error: ${fbError}`);
      }

      const fbData = (await fallbackResp.json()) as Record<string, unknown>;
      return this.parseOpenAIResponse(fbData, model);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return this.parseOpenAIResponse(data, model);
  }

  private async chatLegacy(body: Record<string, unknown>): Promise<LLMResponse> {
    const url = this.groupId
      ? `${this.baseUrl}/text/chatcompletion?GroupId=${this.groupId}`
      : `${this.baseUrl}/text/chatcompletion`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MiniMax API error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return this.parseLegacyResponse(data);
  }

  async *streamChat(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    const model = request.model || "MiniMax-Text-01";

    const response = await fetch(`${this.baseUrl}/text/chatcompletion_v2`, {
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
            content: formatMessageContent(m.content),
          })),
        ],
        max_tokens: Math.min(request.maxTokens || 4096, 8192),
        temperature: request.temperature || 0.7,
        stream: true,
      }),
    });

    if (!response.ok) throw new Error(`MiniMax stream error: ${response.status}`);

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
          if (line.startsWith("data: ")) {
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") {
              yield { type: "done" };
              return;
            }
            try {
              const data = JSON.parse(payload);
              const delta = data.choices?.[0]?.delta?.content;
              if (delta) {
                yield { type: "text", text: delta };
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async countTokens(text: string): Promise<number> {
    return Math.ceil(text.length / 3.5);
  }

  /**
   * List available MiniMax models.
   */
  getAvailableModels(): string[] {
    return [
      "MiniMax-Text-01",
      "abab6.5s-chat",
      "abab6.5-chat",
      "abab5.5s-chat",
      "abab5.5-chat",
    ];
  }

  private parseOpenAIResponse(data: Record<string, unknown>, model: string): LLMResponse {
    // Handle MiniMax response — may have choices[] or reply field
    const choices = data.choices as Array<Record<string, unknown>>;

    if (choices && choices.length > 0) {
      const message = choices[0].message as Record<string, unknown>;
      const usage = (data.usage as Record<string, number>) || {};
      return {
        content: (message?.content as string) || "",
        usage: { inputTokens: usage.prompt_tokens || 0, outputTokens: usage.completion_tokens || 0 },
        stopReason: "end",
        model,
      };
    }

    // MiniMax legacy format: { reply: "...", usage: {...} }
    if (data.reply) {
      const usage = (data.usage as Record<string, number>) || {};
      return {
        content: data.reply as string,
        usage: { inputTokens: usage.prompt_tokens || 0, outputTokens: usage.completion_tokens || 0 },
        stopReason: "end",
        model,
      };
    }

    // Last resort: stringify whatever came back
    log.error(`Unexpected MiniMax response format: ${JSON.stringify(data).slice(0, 500)}`);
    throw new Error(`Unexpected MiniMax response: ${JSON.stringify(data).slice(0, 200)}`);
  }

  private parseOpenAIResponseOld(data: Record<string, unknown>, model: string): LLMResponse {
    return {
      content: "",
      usage: { inputTokens: 0, outputTokens: 0 },
      stopReason: "end",
      model,
    };
  }

  private parseLegacyResponse(data: Record<string, unknown>): LLMResponse {
    const baseResp = data.base_resp as Record<string, unknown>;
    if (baseResp && baseResp.status_code !== 0) {
      throw new Error(`MiniMax error: ${baseResp.status_msg}`);
    }

    const reply = data.reply as string;
    const usage = data.usage as Record<string, number>;

    return {
      content: reply || "",
      usage: {
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
      },
      stopReason: "end",
      model: "minimax",
    };
  }
}
