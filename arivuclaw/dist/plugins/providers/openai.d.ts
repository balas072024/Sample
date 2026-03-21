/**
 * ArivuClaw OpenAI Provider — GPT / o-series integration.
 */
import type { LLMProvider, LLMRequest, LLMResponse, LLMStreamChunk, ProviderType } from "../../core/types";
export declare class OpenAIProvider implements LLMProvider {
    readonly type: ProviderType;
    readonly name = "OpenAI (GPT)";
    private apiKey;
    private baseUrl;
    constructor(config: {
        apiKey: string;
        baseUrl?: string;
    });
    chat(request: LLMRequest): Promise<LLMResponse>;
    streamChat(request: LLMRequest): AsyncGenerator<LLMStreamChunk>;
    countTokens(text: string): Promise<number>;
    private parseResponse;
}
//# sourceMappingURL=openai.d.ts.map