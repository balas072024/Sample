# Arivumaiyam AI — Providers Guide

> 8 LLM provider integrations. All implement `LLMProvider`. Swap with a config change.

---

## Quick-Start Configuration

Set the active provider in your config file or via environment variables:

```typescript
// arivuclaw.config.ts
export default {
  provider: "anthropic",          // active provider
  providers: {
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
    openai:    { apiKey: process.env.OPENAI_API_KEY },
    ollama:    { baseURL: "http://localhost:11434" },
    groq:      { apiKey: process.env.GROQ_API_KEY },
    deepseek:  { apiKey: process.env.DEEPSEEK_API_KEY },
    minimax:   { apiKey: process.env.MINIMAX_API_KEY, groupId: process.env.MINIMAX_GROUP_ID },
    google:    { apiKey: process.env.GOOGLE_API_KEY },
    neuralBrain: { mode: "simulate" },
  },
};
```

Or via a single environment variable:

```bash
export ARIVUCLAW_PROVIDER=groq
export GROQ_API_KEY=gsk_...
```

---

## Provider Comparison

| Provider | Cost | Latency | Context | Tool Calls | Free Tier |
|---|---|---|---|---|---|
| Anthropic | High | Medium | 200k | Yes | No |
| OpenAI | Medium | Medium | 128k | Yes | No |
| Ollama | Free | Local | Model-dep | Yes | Yes (local) |
| MiniMax | Low | Medium | 1M | Yes | Yes |
| DeepSeek | Very Low | Medium | 64k | Yes | Yes (limited) |
| Groq | Low | Very Fast | 128k | Yes | Yes |
| Google | Medium | Fast | 1M (Flash) | Yes | Yes |
| Neural Brain | Configurable | Configurable | Configurable | Partial | Depends on mode |

---

## Anthropic (Claude)

**File:** `src/plugins/providers/anthropic.ts`

### Setup

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

```typescript
// arivuclaw.config.ts
providers: {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultModel: "claude-opus-4-5",      // optional
  }
}
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | API key from console.anthropic.com |
| `ANTHROPIC_BASE_URL` | No | Override base URL (for proxies) |

### Available Models

| Model ID | Context | Best For |
|---|---|---|
| `claude-opus-4-5` | 200k | Complex reasoning, code |
| `claude-sonnet-4-5` | 200k | Balanced performance/cost |
| `claude-haiku-3-5` | 200k | Fast, cheap tasks |

### Model Tier Mapping

```typescript
tiers: {
  router:   { provider: "anthropic", model: "claude-haiku-3-5" },
  standard: { provider: "anthropic", model: "claude-sonnet-4-5" },
  premium:  { provider: "anthropic", model: "claude-opus-4-5" },
}
```

---

## OpenAI (GPT)

**File:** `src/plugins/providers/openai.ts`

### Setup

```bash
export OPENAI_API_KEY=sk-...
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | API key from platform.openai.com |
| `OPENAI_BASE_URL` | No | Override (e.g., Azure OpenAI endpoint) |
| `OPENAI_ORG_ID` | No | Organization ID |

### Available Models

| Model ID | Context | Best For |
|---|---|---|
| `gpt-4o` | 128k | Multimodal, strong reasoning |
| `gpt-4o-mini` | 128k | Fast, cheap tasks |
| `o3-mini` | 200k | Deep reasoning (slow) |
| `o1` | 200k | Complex multi-step problems |

### Azure OpenAI

```typescript
providers: {
  openai: {
    apiKey: process.env.AZURE_OPENAI_KEY,
    baseURL: `https://${process.env.AZURE_RESOURCE}.openai.azure.com/openai/deployments/${process.env.AZURE_DEPLOYMENT}`,
  }
}
```

---

## Ollama (Local — Free)

**File:** `src/plugins/providers/ollama.ts`

Run any open-weight model locally. Zero API cost.

### Setup

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.3
ollama pull qwen2.5-coder

# Verify
ollama list
```

### Configuration

```typescript
providers: {
  ollama: {
    baseURL: "http://localhost:11434",    // default
    defaultModel: "llama3.3",
  }
}
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | No | Default `http://localhost:11434` |
| `OLLAMA_DEFAULT_MODEL` | No | Default model name |

### Recommended Models

| Model | Size | Best For |
|---|---|---|
| `llama3.3` | 70B | General purpose (requires 48 GB RAM) |
| `llama3.2` | 3B | Fast, low memory (4 GB RAM) |
| `qwen2.5-coder` | 7B | Code generation |
| `mistral` | 7B | Instruction following |
| `phi4` | 14B | Compact reasoning |
| `deepseek-r1` | 7B–70B | Reasoning tasks |
| `gemma3` | 4B–27B | Google's open model |

---

## Groq (Free Tier — Ultra-Fast)

**File:** `src/plugins/providers/groq.ts`

Groq's LPU hardware delivers sub-100ms token-to-first-token latency.

### Setup

```bash
# Free API key at console.groq.com
export GROQ_API_KEY=gsk_...
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Key from console.groq.com |

### Available Models

| Model ID | Context | Speed |
|---|---|---|
| `llama-3.3-70b-versatile` | 128k | Very Fast |
| `llama-3.1-8b-instant` | 128k | Extremely Fast |
| `mixtral-8x7b-32768` | 32k | Fast |
| `gemma2-9b-it` | 8k | Fast |

### Free Tier Limits

- 6,000 tokens/minute
- 500 requests/day
- No credit card required

---

## DeepSeek (Low Cost — Free Trial)

**File:** `src/plugins/providers/deepseek.ts`

OpenAI-compatible API. Best cost-per-token ratio for reasoning models.

### Setup

```bash
export DEEPSEEK_API_KEY=sk-...
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DEEPSEEK_API_KEY` | Yes | Key from platform.deepseek.com |
| `DEEPSEEK_BASE_URL` | No | Default `https://api.deepseek.com/v1` |

### Available Models

| Model ID | Description |
|---|---|
| `deepseek-chat` | General purpose (DeepSeek-V3) |
| `deepseek-reasoner` | Chain-of-thought reasoning (DeepSeek-R1) |

### Pricing (as of March 2026)

- Input: $0.14 / 1M tokens (cache hit: $0.014)
- Output: $0.28 / 1M tokens

---

## MiniMax

**File:** `src/plugins/providers/minimax.ts`

### Setup

```bash
export MINIMAX_API_KEY=...
export MINIMAX_GROUP_ID=...
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MINIMAX_API_KEY` | Yes | Key from api.minimax.chat |
| `MINIMAX_GROUP_ID` | Yes | Group ID from dashboard |
| `MINIMAX_BASE_URL` | No | Default `https://api.minimax.chat/v1` |

### Available Models

| Model ID | Context | Notes |
|---|---|---|
| `MiniMax-Text-01` | 1M | Very large context window |
| `abab6.5s-chat` | 245k | Fast, chat-optimised |

---

## Google (Gemini)

Configured via the `google` provider entry.

### Setup

```bash
export GOOGLE_API_KEY=...
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_API_KEY` | Yes | Key from aistudio.google.com |
| `GOOGLE_PROJECT_ID` | No | Vertex AI project (if using Vertex) |

### Available Models

| Model ID | Context | Notes |
|---|---|---|
| `gemini-2.0-flash` | 1M | Fast, free tier available |
| `gemini-1.5-pro` | 2M | Largest context |
| `gemini-1.5-flash` | 1M | Cost-efficient |
| `gemini-2.0-pro-exp` | 2M | Experimental flagship |

### Free Tier

- `gemini-2.0-flash`: 15 RPM, 1M TPM, 1500 RPD (no billing required)

---

## Neural Brain

**File:** `src/plugins/providers/neural-brain.ts`

Neural Brain is Arivumaiyam AI's proprietary bio-inspired reasoning layer. It wraps an existing provider and adds neuromorphic processing modes.

### Modes

| Mode | Description | Use Case |
|---|---|---|
| `simulate` | Pure software simulation of bio-inspired reasoning | Development, testing |
| `hybrid` | Combines standard LLM with neural simulation layers | Production reasoning tasks |
| `cortical` | Full cortical depth processing (multi-stage reasoning) | Complex problem solving |

### Configuration

```typescript
providers: {
  neuralBrain: {
    mode: "hybrid",
    baseProvider: "anthropic",         // underlying provider
    baseModel: "claude-sonnet-4-5",
    corticalDepth: 3,                  // reasoning layers (cortical mode)
    simulationSeed: 42,                // deterministic simulation
  }
}
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEURAL_BRAIN_MODE` | No | `simulate` \| `hybrid` \| `cortical` |
| `NEURAL_BRAIN_BASE_PROVIDER` | No | Provider to wrap |
| `NEURAL_BRAIN_CORTICAL_DEPTH` | No | Cortical depth (default: 3) |

### Simulate Mode

In `simulate` mode Neural Brain does not call any external API. All responses are generated by a built-in simulation engine. Useful for offline development and unit testing.

```typescript
const provider = new NeuralBrainProvider({ mode: "simulate" });
// No API key needed, no network calls
```

### Hybrid Mode

Calls the base provider for token generation, then applies a neural post-processing pass to improve coherence and factual accuracy.

### Cortical Mode

Runs `corticalDepth` sequential reasoning passes before producing the final answer. Each pass can refine the previous one. Slower but highest quality.

---

## Model Tiering

The `ModelTierManager` routes each request to the appropriate provider+model based on a tier hint.

### Configuration

```typescript
// arivuclaw.config.ts
modelTiering: {
  tiers: {
    router:   { provider: "groq",      model: "llama-3.1-8b-instant" },
    standard: { provider: "anthropic", model: "claude-sonnet-4-5" },
    premium:  { provider: "anthropic", model: "claude-opus-4-5" },
  },
  fallbackOrder: ["anthropic", "openai", "groq", "ollama"],
}
```

### Usage in Skills

```yaml
# In SKILL.md frontmatter
tools:
  - name: quick_answer
    tier: router          # cheapest model, fast
  - name: deep_analysis
    tier: premium         # best model
```

### Automatic Tier Selection

If no `tier` is specified, the runtime uses `standard`. The `AgentRuntime` promotes to `premium` automatically when:

- Message contains code > 500 lines
- Tool call count exceeds 5 in a session
- User explicitly asks for "best" or "most accurate" response

---

## Streaming Support

All 8 providers support streaming via `streamChat()`:

```typescript
const stream = provider.streamChat(messages, { stream: true });
for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

The `StreamingManager` handles per-channel delivery:

| Channel | Streaming Method |
|---|---|
| Web | WebSocket (ws) |
| Telegram | `sendMessage` with edit-in-place |
| Discord | Message edit |
| Slack | Message update API |
| CLI | stdout write |
| WhatsApp | Typing indicator + single final message |
| Signal | Single final message |
| iMessage | Single final message |
| Teams | Activity update |
| Matrix | Event stream |

---

## Implementing a Custom Provider

```typescript
import type { LLMProvider, ChatMessage, ChatOptions, ChatResponse } from "arivuclaw/core/types";

export class MyCustomProvider implements LLMProvider {
  name = "my-custom";

  constructor(private config: { apiKey: string; baseURL: string }) {}

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const res = await fetch(`${this.config.baseURL}/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages, model: options?.model ?? "default" }),
    });
    const data = await res.json();
    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens, totalTokens: data.usage.total_tokens },
    };
  }

  async *streamChat(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string> {
    // SSE streaming implementation
    const res = await fetch(`${this.config.baseURL}/chat/stream`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages, stream: true }),
    });
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6));
          if (data.choices?.[0]?.delta?.content) yield data.choices[0].delta.content;
        }
      }
    }
  }

  async countTokens(messages: ChatMessage[]): Promise<number> {
    // Approximate: 4 chars per token
    return messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.config.baseURL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }
}
```

Register via the Plugin SDK:

```typescript
sdk.registerProviderPlugin({
  kind: "provider",
  name: "my-custom",
  provider: new MyCustomProvider({ apiKey: process.env.MY_API_KEY!, baseURL: "https://api.example.com/v1" }),
});
```

---

## Environment Variable Summary

```bash
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_BASE_URL=                     # optional proxy

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=                        # optional, e.g. Azure
OPENAI_ORG_ID=                          # optional

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama3.3

# Groq
GROQ_API_KEY=gsk_...

# DeepSeek
DEEPSEEK_API_KEY=sk-...

# MiniMax
MINIMAX_API_KEY=...
MINIMAX_GROUP_ID=...

# Google
GOOGLE_API_KEY=...

# Neural Brain
NEURAL_BRAIN_MODE=simulate
NEURAL_BRAIN_BASE_PROVIDER=anthropic
NEURAL_BRAIN_CORTICAL_DEPTH=3

# Active provider
ARIVUCLAW_PROVIDER=anthropic
```
