# Arivumaiyam AI — System Architecture

> Version 1.0.0 | 54 TypeScript source files | 112 skills | 10 channels | 8 LLM providers | 1153 tests passing

## Overview

Arivumaiyam AI is an open-source AI agent framework built around a hub-and-spoke gateway model. A single `Gateway` instance accepts connections from any of the 10 supported channel adapters and routes every message through a shared `AgentRuntime`. The runtime manages the AI reasoning loop, retrieval-augmented generation, skill dispatch, memory persistence, and security enforcement before returning a response to the originating channel.

---

## High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CHANNEL LAYER                              │
│  WhatsApp  Telegram  Discord  Slack  Web  CLI  Signal  iMessage     │
│                    Teams          Matrix                            │
└───────────────────────────┬─────────────────────────────────────────┘
                            │  normalised IncomingMessage objects
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           GATEWAY                                   │
│  hub-and-spoke session router · channel adapter registry            │
│  cross-channel identity resolver · rate limiter · HMAC verify       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │  Session + context envelope
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       AGENT RUNTIME                                 │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  AI Loop     │  │  RAG Engine  │  │   Streaming Manager      │  │
│  │  plan/act/   │  │  embed +     │  │   SSE / WebSocket /      │  │
│  │  reflect     │  │  rerank +    │  │   chunked HTTP           │  │
│  │  (≤10 turns) │  │  inject      │  │                          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────────┘  │
│         │                 │                                         │
│  ┌──────▼─────────────────▼───────────────────────────────────┐     │
│  │                    LLM PROVIDER LAYER                      │     │
│  │  Anthropic · OpenAI · Ollama · MiniMax · DeepSeek · Groq   │     │
│  │  Google · Neural Brain (simulate / hybrid / cortical)      │     │
│  │                  Model Tier Router                         │     │
│  └────────────────────────────────────────────────────────────┘     │
└──────┬──────────────┬──────────────┬──────────────┬─────────────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────────────┐
│  SKILLS  │  │    MEMORY    │  │ SECURITY │  │   MCP BRIDGE     │
│          │  │              │  │          │  │                  │
│ Registry │  │ VectorStore  │  │ Guard    │  │ MCPServer        │
│ Loader   │  │ Fact Extract │  │ Sandbox  │  │ MCPClient        │
│ Hot-Rel. │  │ Decay Engine │  │ Guardrls │  │ Tool Registry    │
│ 112 skls │  │ Episodic     │  │ 3 modes  │  │ Prompt Registry  │
└──────┬───┘  └──────────────┘  └──────────┘  └──────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                        PLUGIN SDK                                │
│  7 extension points:                                             │
│  skill · provider · channel · memory · guardrail · telemetry     │
│  · renderer                                                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## Message Flow

```
1. Inbound
   Channel → [HMAC / auth check] → Gateway.receive()
   Gateway builds Session (userId, channelId, conversationId)
   Lookup or create AgentRuntime for session

2. Pre-processing
   AgentRuntime.handleMessage(session, message)
   SecurityGuard.validateInput(message)         ← reject malicious / empty
   SecurityGuard.checkRateLimit(user, channel)  ← token bucket per user
   RAGEngine.retrieve(message.text)             ← embed + vector search top-5
   Context window assembled (history + facts + retrieved chunks)

3. AI Loop (up to 10 turns)
   ModelTierRouter selects provider + model by tier hint
   Provider.chat(messages, tools)               ← streaming or batch
   Response parsed for tool-call directives
   If tool calls present → SandboxExecutor.run(skill, args)
   Results appended to context → next turn

4. Memory Update
   VectorMemoryStore.upsert(chunks)
   FactExtractor.extract(conversation)
   DecayEngine.tick()

5. Outbound
   StreamingManager or batch response
   Gateway.send(session, response)
   Channel adapter serialises and delivers
```

---

## Gateway (`src/core/gateway.ts`)

The Gateway is the single entry point for all inbound traffic. It operates on a hub-and-spoke topology.

| Responsibility | Detail |
|---|---|
| WebSocket Server | Listens on configurable host:port (default `0.0.0.0:3000`) |
| Session Management | 30-minute sliding window; cross-channel continuity via `SessionManager` |
| Identity Resolution | Maps `(channelType, channelUserId)` to a canonical `UserIdentity` |
| Cross-Channel Routing | `routeMessage()` forwards content from one channel to another for the same user |
| Rate Limiting | Token-bucket per user; sliding-window per channel; global circuit breaker |
| HMAC Verification | Webhook payloads from WhatsApp, Slack, Discord, Teams verified before processing |
| Health | `getHealth()` returns running status, channel states, active sessions, total users |
| Graceful Shutdown | Drains connections, shuts down each adapter, persists memory |

---

## Agent Runtime (`src/core/agent-runtime.ts`)

The `AgentRuntime` owns the reasoning loop for a single agent configuration.

| Responsibility | Detail |
|---|---|
| AI Loop | Plan/act/reflect cycle; up to 10 tool-use rounds per message |
| RAG Injection | Searches vector store, reranks, injects top-K passages into system prompt |
| Skill Selection | Matches message against skill triggers (keyword, regex, intent) |
| Tool Execution | Runs tool calls through `SandboxExecutor` with permission checks |
| Configurable Limits | `maxTokensPerTurn`, `maxToolCallsPerTurn` enforced per interaction |

---

## Skills (`src/skills/`)

Skills are the primary extension mechanism. Each skill is a self-contained directory with a `SKILL.md` manifest.

| Feature | Detail |
|---|---|
| SKILL.md Format | YAML frontmatter (name, version, tools, triggers, permissions) + markdown body |
| Composable | Skills declare `dependsOn`; loader performs topological sort with cycle detection |
| Hot-Reload | File-system watcher triggers re-validation and live swap without process restart |
| Precedence | workspace skills > user skills > bundled skills |
| Trigger Types | `keyword`, `regex`, `intent` (LLM classification), `schedule` (cron), `event` (internal bus) |
| Prompt Formatting | XML-based compact representation with token-budget awareness |

---

## Memory (`src/memory/vector-store.ts`)

| Feature | Detail |
|---|---|
| VectorMemoryStore | In-process HNSWLib (default); optional Pinecone / pgvector backend |
| RAG | Auto-retrieval of top-5 relevant memories per message, injected into system prompt |
| Fact Extraction | Pattern-based extraction: name, location, company, preferences, email, timezone |
| Semantic Dedup | Cosine similarity > 0.95 prevents redundant storage |
| Decay Engine | Configurable decay rate; entries below score 0.15 are pruned |
| Persistence | JSON disk persistence at `.arivuclaw/memory/memory.json` |

---

## Security (`src/security/`)

Three execution modes selectable via `ARIVUCLAW_MODE` or config file.

| Mode | Description |
|---|---|
| `unrestricted` | All skills enabled, sandbox optional, full filesystem access (default) |
| `local-admin` | Skills run in a lightweight VM sandbox, network access controlled |
| `restricted` | Hard guardrail enforcement, no shell skills, no filesystem writes |

| Component | Detail |
|---|---|
| SecurityGuard | Input validation, URL validation, path traversal prevention, rate limiting |
| SandboxExecutor | Isolated tool execution; 30 s timeout; dispatches: bash, read_file, write_file, http_request, plugin |
| GuardrailManager | Owner-controlled approval rules; default is auto-approve in unrestricted mode |

---

## Providers (`src/plugins/providers/`)

All providers implement `LLMProvider`: `chat()`, `streamChat()`, `countTokens()`.

| Provider | File | Protocol | Streaming | Tool Calls |
|---|---|---|---|---|
| Anthropic | `anthropic.ts` | Anthropic SDK | Yes | Yes |
| OpenAI | `openai.ts` | OpenAI SDK | Yes | Yes |
| Ollama | `ollama.ts` | HTTP REST | Yes | Yes |
| MiniMax | `minimax.ts` | HTTP REST | Yes | Yes |
| DeepSeek | `deepseek.ts` | OpenAI-compatible | Yes | Yes |
| Groq | `groq.ts` | OpenAI-compatible | Yes | Yes |
| Google | provider config | Google AI SDK | Yes | Yes |
| Neural Brain | `neural-brain.ts` | Custom bio-inspired | Yes | Partial |

`ModelTierRouter` selects provider + model by `tier` hint: `router` (cheapest), `standard`, `premium`.

---

## MCP Bridge (`src/mcp/server.ts`)

| Component | Detail |
|---|---|
| MCPServer | Exposes Arivumaiyam AI native tools as MCP tools; publishes memory snapshots as MCP resources |
| MCPClient | Connects to external MCP servers via HTTP or stdio transport |
| MCPBridge | Bidirectional: `exposeNativeTools()` + `connectServer()` + `callExternalTool()` |
| Protocol | JSON-RPC 2.0, protocol version `2024-11-05`; supports tools, resources, prompts |
| Security | Bearer-token authentication; all tool invocations pass through `SecurityGuard` |

---

## Plugin SDK (`src/plugins/sdk/index.ts`)

Seven extension points for third-party code without forking:

| Extension Point | Interface | Purpose |
|---|---|---|
| `skill` | `ISkillPlugin` | Register custom skills |
| `provider` | `IProviderPlugin` | Add LLM providers |
| `channel` | `IChannelPlugin` | Add messaging channels |
| `memory` | `IMemoryPlugin` | Replace or augment memory backend |
| `guardrail` | `IGuardrailPlugin` | Add content/policy checks |
| `telemetry` | `ITelemetryPlugin` | Export metrics and traces |
| `renderer` | `IRendererPlugin` | Custom output formatters (Canvas, etc.) |

Plugins are discovered via Node `exports` in `package.json` and loaded at startup via `PluginRegistry.loadFromDirectory()`.

```typescript
// my-plugin/index.ts
import type { PluginSDK, PluginManifest } from "arivuclaw/plugins/sdk";

export const manifest: PluginManifest = {
  name: "arivuclaw-plugin-weather",
  version: "1.0.0",
  description: "Live weather lookup",
  author: "Your Name",
  extensionPoints: ["tool"],
};

export function activate(sdk: PluginSDK): void {
  sdk.registerToolPlugin({
    kind: "tool",
    tools: [weatherTool],
    execute: async (name, input) => { /* ... */ },
  });
}

export function deactivate(): void { /* cleanup */ }
```

---

## Directory Structure

```
arivuclaw/
├── config/
│   └── default.json              # Default configuration
├── docs/                         # Documentation
├── skills/                       # 112 bundled skills
│   ├── calculator/SKILL.md
│   ├── nmap-scanner/SKILL.md
│   └── ...
├── src/
│   ├── index.ts                  # Main entry point
│   ├── a2a/
│   │   └── protocol.ts           # Agent-to-Agent protocol (Google ADK compatible)
│   ├── automations/
│   │   └── engine.ts             # Automation engine
│   ├── backup/
│   │   └── manager.ts            # Backup / restore
│   ├── canvas/
│   │   └── renderer.ts           # Visual canvas rendering
│   ├── channels/
│   │   ├── base.ts               # BaseChannel (reconnection, queue)
│   │   ├── cli.ts
│   │   ├── discord.ts
│   │   ├── slack.ts
│   │   ├── telegram.ts
│   │   ├── web.ts
│   │   ├── whatsapp.ts
│   │   └── extra/
│   │       ├── imessage.ts
│   │       ├── matrix.ts
│   │       ├── signal.ts
│   │       └── teams.ts
│   ├── cli/
│   │   ├── index.ts              # CLI entry point (commander)
│   │   ├── config.ts
│   │   └── onboard.ts            # Interactive onboarding wizard
│   ├── core/
│   │   ├── agent-runtime.ts
│   │   ├── file-upload.ts
│   │   ├── gateway.ts
│   │   ├── guardrails.ts
│   │   ├── model-tiering.ts
│   │   └── types.ts              # All TypeScript interfaces
│   ├── i18n/
│   │   └── locales.ts
│   ├── marketplace/
│   │   └── registry.ts
│   ├── mcp/
│   │   └── server.ts
│   ├── memory/
│   │   └── vector-store.ts
│   ├── oauth/
│   │   └── manager.ts            # OAuth2 (Google, GitHub, Slack, Microsoft, Discord, Spotify)
│   ├── observability/
│   │   ├── health-dashboard.ts
│   │   └── telemetry.ts
│   ├── plugins/
│   │   ├── providers/
│   │   │   ├── anthropic.ts
│   │   │   ├── openai.ts
│   │   │   ├── ollama.ts
│   │   │   ├── minimax.ts
│   │   │   ├── deepseek.ts
│   │   │   ├── groq.ts
│   │   │   └── neural-brain.ts
│   │   └── sdk/
│   │       └── index.ts
│   ├── security/
│   │   ├── guard.ts
│   │   └── sandbox.ts
│   ├── skills/
│   │   ├── registry.ts
│   │   └── loader.ts
│   ├── streaming/
│   │   ├── manager.ts
│   │   └── channel-streamer.ts
│   ├── tools/
│   │   └── system-tools.ts
│   ├── ui/
│   │   └── dashboard.ts
│   ├── utils/
│   │   └── logger.ts
│   ├── vision/
│   │   └── processor.ts
│   └── webhooks/
│       └── receiver.ts
├── tests/                        # 1153 tests (unit + integration)
├── jest.config.js
├── package.json
└── tsconfig.json
```

---

## Key Design Decisions

1. **Unrestricted by default.** Arivumaiyam AI trusts the owner. In `unrestricted` mode all tools execute without approval. Opt into guardrails per action as needed.
2. **Skills are markdown files.** SKILL.md uses YAML + markdown — portable, version-controllable, and readable by both humans and LLMs.
3. **Cross-channel identity.** A single `UserIdentity` spans all channels via `linkUserChannel()`.
4. **Memory is first-class.** Every conversation is stored with embeddings. Facts are auto-extracted. Memory decays. RAG is injected on every LLM call.
5. **Provider-agnostic.** All 8 providers implement `LLMProvider`. Swap with a config change; `ModelTierRouter` routes to cost-optimal models automatically.
6. **MCP-native.** Arivumaiyam AI both exposes and consumes MCP tools, making it interoperable with the broader AI-agent ecosystem.
