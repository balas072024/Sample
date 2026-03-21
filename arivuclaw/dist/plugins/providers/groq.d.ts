/**
 * ArivuClaw Groq Provider — Ultra-fast inference, free tier available.
 *
 * Groq provides very fast inference with free API access for
 * Llama, Mixtral, and Gemma models.
 */
import type { LLMProvider, LLMRequest, LLMResponse, LLMStreamChunk, ProviderType } from "../../core/types";
export declare class GroqProvider implements LLMProvider {
    readonly type: ProviderType;
    readonly name = "Groq (Fast Inference)";
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
//# sourceMappingURL=groq.d.ts.map