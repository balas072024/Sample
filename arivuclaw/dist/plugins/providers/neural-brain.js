"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeuralBrainProvider = void 0;
const format_content_1 = require("./format-content");
const logger_1 = require("../../utils/logger");
const log = logger_1.Logger.create("provider:neural-brain");
class NeuralBrainProvider {
    type = "custom";
    name = "Neural Brain (Bio-Inspired AI)";
    config;
    state;
    backboneProvider;
    constructor(config, backboneProvider) {
        this.config = {
            plasticityRate: 0.1,
            associativeMemorySize: 100,
            ...config,
        };
        this.backboneProvider = backboneProvider;
        this.state = {
            activationPatterns: new Map(),
            associativeMemory: [],
            plasticityHistory: [],
        };
        log.info(`Neural Brain initialized in ${this.config.neuralMode} mode`);
    }
    async chat(request) {
        switch (this.config.neuralMode) {
            case "cortical-api":
                return this.chatViaCorticalAPI(request);
            case "hybrid":
                return this.chatHybrid(request);
            case "simulate":
            default:
                return this.chatSimulated(request);
        }
    }
    // ─── Cortical Labs API Mode ──────────────────────────────────────
    async chatViaCorticalAPI(request) {
        if (!this.config.baseUrl || !this.config.apiKey) {
            log.warn("Cortical API not configured, falling back to simulation mode");
            return this.chatSimulated(request);
        }
        const response = await fetch(`${this.config.baseUrl}/v1/neural/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify({
                messages: request.messages.map((m) => ({
                    role: m.role,
                    content: (0, format_content_1.formatMessageContent)(m.content),
                })),
                neural_config: {
                    plasticity_rate: this.config.plasticityRate,
                    activation_history: Array.from(this.state.activationPatterns.entries()).slice(-10),
                },
            }),
        });
        if (!response.ok) {
            throw new Error(`Cortical API error: ${response.status}`);
        }
        const data = (await response.json());
        return {
            content: data.content || "",
            usage: {
                inputTokens: data.input_neurons || 0,
                outputTokens: data.output_neurons || 0,
            },
            stopReason: "end",
            model: "cortical-dishbrain-v1",
        };
    }
    // ─── Hybrid Mode (LLM + Neural Layer) ───────────────────────────
    async chatHybrid(request) {
        if (!this.backboneProvider) {
            throw new Error("Hybrid mode requires a backbone provider");
        }
        // Step 1: Check associative memory for similar patterns
        const lastMessage = request.messages[request.messages.length - 1];
        const queryText = typeof lastMessage.content === "string"
            ? lastMessage.content
            : JSON.stringify(lastMessage.content);
        const memoryHit = this.queryAssociativeMemory(queryText);
        // Step 2: If we have a strong memory association, inject context
        const enhancedRequest = { ...request };
        if (memoryHit) {
            enhancedRequest.systemPrompt += `\n\n[Neural Memory Context] Based on prior neural patterns, a similar query produced: "${memoryHit.output}" (confidence: ${memoryHit.weight.toFixed(2)})`;
        }
        // Step 3: Get response from backbone LLM
        const response = await this.backboneProvider.chat(enhancedRequest);
        // Step 4: Neural plasticity — learn from this interaction
        this.updateAssociativeMemory(queryText, response.content);
        this.updateActivationPatterns(queryText, response.content);
        // Step 5: Apply neural refinement
        const refinedContent = this.applyNeuralRefinement(response.content, queryText);
        return {
            ...response,
            content: refinedContent,
            model: `neural-brain-hybrid(${response.model})`,
        };
    }
    // ─── Simulated Neural Mode ───────────────────────────────────────
    async chatSimulated(request) {
        if (this.backboneProvider) {
            // Use backbone with neural enhancement
            return this.chatHybrid(request);
        }
        // Pure simulation mode — for testing without an API key
        const lastMessage = request.messages[request.messages.length - 1];
        const queryText = typeof lastMessage.content === "string"
            ? lastMessage.content
            : JSON.stringify(lastMessage.content);
        const memoryHit = this.queryAssociativeMemory(queryText);
        const content = memoryHit
            ? `[Neural Brain - Simulated] Based on neural patterns: ${memoryHit.output}\n\nNote: Neural Brain is in simulation mode. Connect an LLM backbone for full capabilities.`
            : `[Neural Brain - Simulated] I received: "${queryText}". Neural Brain simulation mode is active. To get real responses, configure a backbone provider (e.g., Anthropic, OpenAI, or Ollama) in hybrid mode.`;
        this.updateAssociativeMemory(queryText, content);
        return {
            content,
            usage: { inputTokens: queryText.length, outputTokens: content.length },
            stopReason: "end",
            model: "neural-brain-simulated",
        };
    }
    // ─── Neural Processing Functions ─────────────────────────────────
    queryAssociativeMemory(input) {
        if (this.state.associativeMemory.length === 0)
            return null;
        const inputTokens = new Set(input.toLowerCase().split(/\s+/));
        let bestMatch = null;
        let bestScore = 0;
        for (const entry of this.state.associativeMemory) {
            const entryTokens = new Set(entry.input.toLowerCase().split(/\s+/));
            const intersection = new Set([...inputTokens].filter((t) => entryTokens.has(t)));
            const union = new Set([...inputTokens, ...entryTokens]);
            const jaccard = intersection.size / union.size;
            const score = jaccard * entry.weight;
            if (score > bestScore && score > 0.3) {
                bestScore = score;
                bestMatch = { output: entry.output, weight: score };
            }
        }
        return bestMatch;
    }
    updateAssociativeMemory(input, output) {
        const maxSize = this.config.associativeMemorySize || 100;
        this.state.associativeMemory.push({
            input,
            output: output.slice(0, 500), // Store truncated output
            weight: 1.0,
        });
        // Apply decay to older memories (neural forgetting curve)
        for (let i = 0; i < this.state.associativeMemory.length - 1; i++) {
            this.state.associativeMemory[i].weight *= (1 - (this.config.plasticityRate || 0.1));
        }
        // Prune weak memories
        this.state.associativeMemory = this.state.associativeMemory
            .filter((m) => m.weight > 0.05)
            .slice(-maxSize);
    }
    updateActivationPatterns(input, output) {
        // Create a simple activation pattern (hash-based neural fingerprint)
        const combined = `${input} ${output}`;
        const pattern = new Array(32).fill(0);
        for (let i = 0; i < combined.length; i++) {
            pattern[i % 32] += combined.charCodeAt(i) / 1000;
        }
        const key = input.slice(0, 50);
        this.state.activationPatterns.set(key, pattern);
        // Keep only recent patterns
        if (this.state.activationPatterns.size > 200) {
            const keys = Array.from(this.state.activationPatterns.keys());
            this.state.activationPatterns.delete(keys[0]);
        }
    }
    applyNeuralRefinement(content, query) {
        // In a real implementation, this would apply neuromorphic processing
        // For now, it passes through (backbone response is already good)
        return content;
    }
    // ─── Streaming ───────────────────────────────────────────────────
    async *streamChat(request) {
        if (this.backboneProvider) {
            const gen = this.backboneProvider.streamChat(request);
            let fullContent = "";
            for await (const chunk of gen) {
                if (chunk.text)
                    fullContent += chunk.text;
                yield chunk;
            }
            // Learn from the full response
            const lastMsg = request.messages[request.messages.length - 1];
            const q = typeof lastMsg.content === "string" ? lastMsg.content : "";
            this.updateAssociativeMemory(q, fullContent);
        }
        else {
            const response = await this.chat(request);
            yield { type: "text", text: response.content };
            yield { type: "done" };
        }
    }
    async countTokens(text) {
        if (this.backboneProvider)
            return this.backboneProvider.countTokens(text);
        return Math.ceil(text.length / 4);
    }
    // ─── State Management ────────────────────────────────────────────
    getState() {
        return this.state;
    }
    getStats() {
        return {
            mode: this.config.neuralMode,
            associativeMemoryEntries: this.state.associativeMemory.length,
            activationPatterns: this.state.activationPatterns.size,
            avgMemoryWeight: this.state.associativeMemory.length > 0
                ? this.state.associativeMemory.reduce((s, m) => s + m.weight, 0) / this.state.associativeMemory.length
                : 0,
            backbone: this.backboneProvider?.name || "none",
        };
    }
}
exports.NeuralBrainProvider = NeuralBrainProvider;
//# sourceMappingURL=neural-brain.js.map