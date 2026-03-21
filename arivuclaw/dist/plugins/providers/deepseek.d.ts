/**
 * ArivuClaw DeepSeek Provider — Free/cheap DeepSeek models.
 *
 * DeepSeek offers competitive free-tier and very low-cost access.
 * Uses OpenAI-compatible API format.
 */
import type { LLMProvider, LLMRequest, LLMResponse, LLMStreamChunk, ProviderType } from "../../core/types";
export declare class DeepSeekProvider implements LLMProvider {
    readonly type: ProviderType;
    readonly name = "DeepSeek";
    private apiKey;
    private baseUrl;
    constructor(config: {
        apiKey: string;
        baseUrl?: string;
    });
    chat(request: LLMRequest): Promise<LLMResponse>;
    streamChat(request: LLMRequest): AsyncGenerator<LLMStreamChunk>;
    countTokens(text: string): Promise<number>;
    getAvailableModels(): string[];
}
//# sourceMappingURL=deepseek.d.ts.map