/**
 * ArivuClaw Anthropic Provider — Claude integration.
 */
import type { LLMProvider, LLMRequest, LLMResponse, LLMStreamChunk, ProviderType } from "../../core/types";
export declare class AnthropicProvider implements LLMProvider {
    readonly type: ProviderType;
    readonly name = "Anthropic (Claude)";
    private apiKey;
    private baseUrl;
    constructor(config: {
        apiKey: string;
        baseUrl?: string;
    });
    chat(request: LLMRequest): Promise<LLMResponse>;
    streamChat(request: LLMRequest): AsyncGenerator<LLMStreamChunk>;
    countTokens(text: string): Promise<number>;
    private formatMessages;
    private parseResponse;
    private mapStopReason;
}
//# sourceMappingURL=anthropic.d.ts.map