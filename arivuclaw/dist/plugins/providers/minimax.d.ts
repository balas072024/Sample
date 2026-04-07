/**
 * ArivuClaw MiniMax Provider — MiniMax AI model integration.
 *
 * MiniMax offers free-tier access and competitive models.
 * API: https://api.minimax.chat
 *
 * Models:
 * - MiniMax-M2        — Latest flagship
 * - MiniMax-M2-Stable — Stable version
 * - abab6.5s-chat     — Fast, lightweight (legacy)
 * - abab6.5-chat      — Balanced (legacy)
 */
import type { LLMProvider, LLMRequest, LLMResponse, LLMStreamChunk, ProviderType } from "../../core/types";
export declare class MiniMaxProvider implements LLMProvider {
    readonly type: ProviderType;
    readonly name = "MiniMax AI";
    private apiKey;
    private groupId;
    private baseUrl;
    constructor(config: {
        apiKey: string;
        groupId?: string;
        baseUrl?: string;
    });
    chat(request: LLMRequest): Promise<LLMResponse>;
    private chatLegacy;
    streamChat(request: LLMRequest): AsyncGenerator<LLMStreamChunk>;
    countTokens(text: string): Promise<number>;
    /**
     * List available MiniMax models.
     */
    getAvailableModels(): string[];
    private parseOpenAIResponse;
    private parseOpenAIResponseOld;
    private parseLegacyResponse;
}
//# sourceMappingURL=minimax.d.ts.map