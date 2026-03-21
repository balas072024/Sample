/**
 * SCENARIO 3: LLM Provider initialization and configuration
 */

import { AnthropicProvider } from "../../src/plugins/providers/anthropic";
import { OpenAIProvider } from "../../src/plugins/providers/openai";
import { OllamaProvider } from "../../src/plugins/providers/ollama";
import { MiniMaxProvider } from "../../src/plugins/providers/minimax";
import { DeepSeekProvider } from "../../src/plugins/providers/deepseek";
import { GroqProvider } from "../../src/plugins/providers/groq";
import { NeuralBrainProvider } from "../../src/plugins/providers/neural-brain";

describe("Scenario 3: LLM Providers", () => {
  describe("AnthropicProvider", () => {
    it("initializes with config", () => {
      const provider = new AnthropicProvider({ apiKey: "test-key" });
      expect(provider.type).toBe("anthropic");
      expect(provider.name).toContain("Anthropic");
    });

    it("counts tokens approximately", async () => {
      const provider = new AnthropicProvider({ apiKey: "test" });
      const count = await provider.countTokens("Hello world, this is a test");
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(100);
    });
  });

  describe("OpenAIProvider", () => {
    it("initializes with config", () => {
      const provider = new OpenAIProvider({ apiKey: "test-key" });
      expect(provider.type).toBe("openai");
      expect(provider.name).toContain("OpenAI");
    });
  });

  describe("OllamaProvider", () => {
    it("initializes with default URL", () => {
      const provider = new OllamaProvider({});
      expect(provider.type).toBe("ollama");
      expect(provider.name).toContain("Ollama");
    });

    it("initializes with custom URL", () => {
      const provider = new OllamaProvider({ baseUrl: "http://custom:11434" });
      expect(provider.type).toBe("ollama");
    });
  });

  describe("MiniMaxProvider", () => {
    it("initializes with config", () => {
      const provider = new MiniMaxProvider({ apiKey: "test-key" });
      expect(provider.type).toBe("minimax");
      expect(provider.name).toContain("MiniMax");
    });

    it("lists available models", () => {
      const provider = new MiniMaxProvider({ apiKey: "test" });
      const models = provider.getAvailableModels();
      expect(models).toContain("MiniMax-Text-01");
      expect(models.length).toBeGreaterThan(0);
    });
  });

  describe("DeepSeekProvider", () => {
    it("initializes with config", () => {
      const provider = new DeepSeekProvider({ apiKey: "test-key" });
      expect(provider.type).toBe("deepseek");
      expect(provider.name).toContain("DeepSeek");
    });

    it("lists available models", () => {
      const provider = new DeepSeekProvider({ apiKey: "test" });
      const models = provider.getAvailableModels();
      expect(models).toContain("deepseek-chat");
    });
  });

  describe("GroqProvider", () => {
    it("initializes with config", () => {
      const provider = new GroqProvider({ apiKey: "test-key" });
      expect(provider.type).toBe("groq");
      expect(provider.name).toContain("Groq");
    });

    it("lists available models", () => {
      const provider = new GroqProvider({ apiKey: "test" });
      const models = provider.getAvailableModels();
      expect(models.length).toBeGreaterThan(0);
    });
  });

  describe("NeuralBrainProvider", () => {
    it("initializes in simulate mode", () => {
      const provider = new NeuralBrainProvider({ neuralMode: "simulate" });
      expect(provider.name).toContain("Neural Brain");
    });

    it("initializes in hybrid mode with backbone", () => {
      const backbone = new AnthropicProvider({ apiKey: "test" });
      const provider = new NeuralBrainProvider(
        { neuralMode: "hybrid", backboneProvider: "anthropic" },
        backbone,
      );
      const stats = provider.getStats();
      expect(stats.mode).toBe("hybrid");
      expect(stats.backbone).toContain("Anthropic");
    });

    it("returns stats", () => {
      const provider = new NeuralBrainProvider({ neuralMode: "simulate" });
      const stats = provider.getStats();
      expect(stats.associativeMemoryEntries).toBe(0);
      expect(stats.activationPatterns).toBe(0);
    });

    it("handles simulated chat without backbone", async () => {
      const provider = new NeuralBrainProvider({ neuralMode: "simulate" });
      const response = await provider.chat({
        model: "test",
        systemPrompt: "test",
        messages: [{ role: "user", content: "hello" }],
      });
      expect(response.content).toContain("Neural Brain");
      expect(response.model).toBe("neural-brain-simulated");
    });

    it("builds associative memory over multiple chats", async () => {
      const provider = new NeuralBrainProvider({ neuralMode: "simulate" });

      await provider.chat({
        model: "test",
        systemPrompt: "test",
        messages: [{ role: "user", content: "what is TypeScript" }],
      });

      const stats = provider.getStats();
      expect(stats.associativeMemoryEntries).toBe(1);
    });
  });
});
