/**
 * ArivuClaw Ollama Provider — Local model support.
 *
 * Improvement over OpenClaw: First-class local model support
 * with automatic model detection and resource management.
 */
import type { LLMProvider, LLMRequest, LLMResponse, LLMStreamChunk, ProviderType } from "../../core/types";
export declare class OllamaProvider implements LLMProvider {
    readonly type: ProviderType;
    readonly name = "Ollama (Local)";
    private baseUrl;
    constructor(config: {
        baseUrl?: string;
    });
    chat(request: LLMRequest): Promise<LLMResponse>;
    streamChat(request: LLMRequest): AsyncGenerator<LLMStreamChunk>;
    countTokens(text: string): Promise<number>;
    /**
     * Check which models are available locally.
     */
    listModels(): Promise<string[]>;
}
//# sourceMappingURL=ollama.d.ts.map