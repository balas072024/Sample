/**
 * ArivuClaw Neural Brain Provider — Experimental biological neural computing.
 *
 * Inspired by Cortical Labs' DishBrain project that wired living human neurons
 * into an LLM for token selection. This provider supports:
 *
 * 1. Cortical Labs API (when available) — actual biological neural compute
 * 2. Brain-inspired neural architectures (neuromorphic computing)
 * 3. Hybrid mode: use any LLM as backbone with "neural brain" refinement layer
 *
 * The Neural Brain mode adds a bio-inspired processing layer that simulates
 * neural plasticity, attention patterns, and associative memory on top of
 * standard LLM inference — giving ArivuClaw more human-like reasoning.
 */
import type { LLMProvider, LLMRequest, LLMResponse, LLMStreamChunk, ProviderType } from "../../core/types";
interface NeuralBrainConfig {
    apiKey?: string;
    baseUrl?: string;
    backboneProvider?: string;
    backboneModel?: string;
    neuralMode: "simulate" | "cortical-api" | "hybrid";
    plasticityRate?: number;
    associativeMemorySize?: number;
}
interface NeuralState {
    activationPatterns: Map<string, number[]>;
    associativeMemory: {
        input: string;
        output: string;
        weight: number;
    }[];
    plasticityHistory: number[];
}
export declare class NeuralBrainProvider implements LLMProvider {
    readonly type: ProviderType;
    readonly name = "Neural Brain (Bio-Inspired AI)";
    private config;
    private state;
    private backboneProvider?;
    constructor(config: NeuralBrainConfig, backboneProvider?: LLMProvider);
    chat(request: LLMRequest): Promise<LLMResponse>;
    private chatViaCorticalAPI;
    private chatHybrid;
    private chatSimulated;
    private queryAssociativeMemory;
    private updateAssociativeMemory;
    private updateActivationPatterns;
    private applyNeuralRefinement;
    streamChat(request: LLMRequest): AsyncGenerator<LLMStreamChunk>;
    countTokens(text: string): Promise<number>;
    getState(): NeuralState;
    getStats(): Record<string, unknown>;
}
export {};
//# sourceMappingURL=neural-brain.d.ts.map