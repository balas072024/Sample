# ArivuClaw Architecture

> Version 1.0.0 | 54 source files | 112 skills | 10 channels | 8 LLM providers | 1153 tests passing

## System Overview

ArivuClaw is a hub-and-spoke AI agent framework. The **Gateway** is the control plane (hub), and **channels** are the spokes that connect users on different platforms to a single, unified agent runtime.

```
                          ┌─────────────────────────────────────────────┐
                          │              ArivuClaw Core                 │
                          │                                             │
  ┌──────────┐            │  ┌──────────┐    ┌────────────────────┐    │
  │ WhatsApp ├───┐        │  │          │    │   Agent Runtime    │    │
  ├──────────┤   │        │  │          │    │  ┌──────────────┐  │    │
  │ Telegram ├───┤        │  │          │    │  │  LLM Loop    │  │    │
  ├──────────┤   │        │  │ Gateway  │    │  │  (multi-turn │  │    │
  │ Discord  ├───┤◄──────►│  │          ├───►│  │   tool use)  │  │    │
  ├──────────┤   │        │  │ - Auth   │    │  └──────┬───────┘  │    │
  │  Slack   ├───┤        │  │ - Route  │    │         │          │    │
  ├──────────┤   │        │  │ - Rate   │    │  ┌──────▼───────┐  │    │
  │   Web    ├───┤        │  │   Limit  │    │  │    Skills    │  │    │
  ├──────────┤   │        │  │ - Session│    │  │  (112 tools) │  │    │
  │   CLI    ├───┤        │  │          │    │  └──────────────┘  │    │
  ├──────────┤   │        │  └──────────┘    └────────────────────┘    │
  │  Signal  ├───┤        │                                             │
  ├──────────┤   │        │  ┌──────────┐    ┌──────────┐  ┌────────┐  │
  │ iMessage ├───┤        │  │  Memory  │    │ Security │  │  MCP   │  │
  ├──────────┤   │        │  │  System  │    │  Layer   │  │ Bridge │  │
  │  Teams   ├───┤        │  │ (Vector/ │    │ (Guard/  │  │        │  │
  ├──────────┤   │        │  │  RAG)    │    │ Sandbox) │  │        │  │
  │  Matrix  ├───┘        │  └──────────┘    └──────────┘  └────────┘  │
  └──────────┘            │                                             │
                          │  ┌──────────────────────────────────────┐   │
                          │  │          LLM Providers (8)           │   │
                          │  │ Anthropic│OpenAI│Ollama│DeepSeek│... │   │
                          │  └──────────────────────────────────────┘   │
                          └─────────────────────────────────────────────┘
```

## Hub-and-Spoke Architecture

The Gateway is the central hub. Every incoming message from any channel flows through it before reaching the Agent Runtime. This design provides:

- **Single point of control** for authentication, rate limiting, and routing
- **Cross-channel identity resolution** -- a user on WhatsApp and Telegram is recognized as the same person
- **Cross-channel session continuity** -- start a conversation on Telegram, continue it on Discord
- **Unified message format** -- channels emit `IncomingMessage` objects regardless of platform

Channels are spokes. Each channel adapter implements the `ChannelAdapter` interface and translates platform-specific protocols (Baileys for WhatsApp, grammy for Telegram, discord.js for Discord, etc.) into the common ArivuClaw message format.

---

## Message Flow

```
User types on WhatsApp
        │
        ▼
┌─────────────────┐
│ WhatsApp Channel │  Receives via Baileys WebSocket
│   (spoke)        │  Converts to IncomingMessage
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Gateway       │  1. validateInput()     — reject empty/malicious
│   (control       │  2. checkRateLimit()    — per-user, per-channel, global
│    plane)        │  3. resolveUser()       — find or create UserIdentity
│                  │  4. getOrCreateSession() — 30-min cross-channel window
│                  │  5. Store in memory     — persist conversation
│                  │  6. Route to runtime    — agentRuntime.processMessage()
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Agent Runtime   │  1. enrichWithMemory()  — RAG: search vectors + facts
│  (AI loop)       │  2. selectSkills()      — match triggers to message
│                  │  3. getToolDefinitions() — build tool list from skills
│                  │  4. buildSystemPrompt()  — inject memory + skills
│                  │  5. LLM chat loop       — up to 10 tool-use rounds
│                  │     ├─ LLM returns text → done
│                  │     └─ LLM returns tool_call → execute in sandbox
│                  │        └─ feed result back → next round
│                  │  6. Return AgentResponse
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Gateway       │  sendToChannel() → WhatsApp adapter
└────────┬────────┘
         │
         ▼
User sees response on WhatsApp
```

---

## Component Descriptions

### Gateway (`src/core/gateway.ts`)

The central nervous system of ArivuClaw.

| Responsibility | Details |
|---|---|
| **WebSocket Server** | Listens on configurable host:port (default `0.0.0.0:3000`) |
| **Session Management** | 30-minute sliding window sessions with cross-channel continuity |
| **Identity Resolution** | Maps `(channelType, channelUserId)` pairs to a unified `UserIdentity` |
| **Cross-Channel Routing** | `routeMessage()` sends content from one channel to another for the same user |
| **Rate Limiting** | Delegates to `SecurityGuard.checkRateLimit()` with per-user, per-channel, global scopes |
| **Health Checks** | `getHealth()` returns running status, channel states, active sessions, total users |
| **Graceful Shutdown** | Drains connections, shuts down each channel adapter, persists memory |

### Agent Runtime (`src/core/agent-runtime.ts`)

The AI processing loop.

| Responsibility | Details |
|---|---|
| **AI Loop** | Multi-turn tool orchestration with up to 10 rounds of tool use per message |
| **RAG Memory Injection** | Searches vector store for relevant memories and user facts, injects into system prompt |
| **Skill Selection** | Matches message content against skill triggers (keyword, regex, intent) |
| **Tool Execution** | Runs tool calls through `SandboxExecutor` with permission checks |
| **Configurable Limits** | `maxTokensPerTurn`, `maxToolCallsPerTurn` enforced per interaction |

### Skill System (`src/skills/registry.ts`, `src/skills/loader.ts`)

Composable skills powered by SKILL.md manifests.

| Feature | Details |
|---|---|
| **SKILL.md Format** | YAML frontmatter (name, version, tools, triggers, permissions) + markdown body (instructions) |
| **Dependency Resolution** | Topological sort with cycle detection. Skills declare `dependencies`, `provides`, `requires` |
| **Typed Interfaces** | Skills expose and consume typed interfaces with versioned methods |
| **Hot-Reload** | File watcher on skill directories; SKILL.md changes trigger automatic reload |
| **Trigger Matching** | Priority-sorted matching: keyword, regex, intent, schedule, event |
| **Precedence** | workspace skills > user skills > bundled skills (later directories override earlier) |
| **Prompt Formatting** | XML-based compact representation with token budget awareness |

### Memory System (`src/memory/vector-store.ts`)

RAG-powered contextual memory with persistence.

| Feature | Details |
|---|---|
| **Vector Store** | In-memory with HNSWLib support. Cosine similarity search with configurable embedding provider |
| **RAG** | Automatic retrieval of top-5 relevant memories per message, injected into system prompt |
| **Fact Extraction** | Pattern-based extraction of user facts (name, location, company, preferences, email, language, timezone) |
| **Semantic Deduplication** | Cosine similarity > 0.95 triggers dedup, preventing redundant storage |
| **Memory Decay** | Configurable decay rate. Old, unreferenced memories lose relevance. Entries below 0.15 score are pruned |
| **Persistence** | JSON-based disk persistence in `.arivuclaw/memory/memory.json` |

### Security Layer (`src/security/guard.ts`, `src/security/sandbox.ts`, `src/core/guardrails.ts`)

Three execution modes with defense-in-depth.

| Component | Details |
|---|---|
| **SecurityGuard** | Input validation, URL validation, path validation, rate limiting, permission checks |
| **SandboxExecutor** | Isolated tool execution with timeouts (30s default), permission enforcement, input validation |
| **GuardrailManager** | Owner-controlled approval system. Default: auto-approve all (unrestricted). Optional: per-tool approval rules |
| **Execution Modes** | `unrestricted` (full access, default), `local-admin` (limited network), `restricted` (sandboxed) |

### LLM Providers (`src/plugins/providers/`)

Eight provider implementations plus the Neural Brain hybrid.

| Provider | Module | Protocol |
|---|---|---|
| Anthropic (Claude) | `anthropic.ts` | Anthropic SDK |
| OpenAI (GPT) | `openai.ts` | OpenAI SDK |
| Ollama (local) | `ollama.ts` | HTTP REST |
| MiniMax | `minimax.ts` | HTTP REST |
| DeepSeek | `deepseek.ts` | OpenAI-compatible |
| Groq | `groq.ts` | OpenAI-compatible |
| Google (Gemini) | via provider config | Google AI SDK |
| Neural Brain | `neural-brain.ts` | Custom (bio-inspired) |

All providers implement the `LLMProvider` interface: `chat()`, `streamChat()`, `countTokens()`.

### MCP Bridge (`src/mcp/server.ts`)

Model Context Protocol integration for tool interoperability.

| Component | Details |
|---|---|
| **MCPServer** | Exposes ArivuClaw's native tools as MCP tools. Other agents can connect and use them |
| **MCPClient** | Connects to external MCP servers. Supports HTTP and stdio transports |
| **MCPBridge** | Bidirectional bridge: `exposeNativeTools()` + `connectServer()` + `callExternalTool()` |
| **Protocol** | JSON-RPC 2.0, protocol version `2024-11-05`. Supports tools, resources, prompts |

---

## Data Flow Diagrams

### Incoming Message Processing

```
IncomingMessage
     │
     ├──► SecurityGuard.validateInput()
     │         │
     │         ├── fail → drop message, log warning
     │         └── pass ▼
     │
     ├──► SecurityGuard.checkRateLimit()
     │         │
     │         ├── fail → send "too fast" message
     │         └── pass ▼
     │
     ├──► resolveUser(channelType, channelUserId)
     │         └── find existing or create new UserIdentity
     │
     ├──► getOrCreateSession(user, channelType)
     │         └── reuse if < 30 min old, else create new
     │
     ├──► memoryStore.store(entry)
     │
     └──► agentRuntime.processMessage(session, message, user)
               └── returns AgentResponse
```

### Skill Resolution

```
message.content
     │
     ├──► SkillRegistry.matchTriggers(content)
     │         │
     │         ├── keyword match: "calculate" → calculator skill
     │         ├── regex match: /nmap\s+-/ → nmap-scanner skill
     │         └── intent match: "scan network" → nmap-scanner skill
     │
     ├──► Merge with session.activeSkills
     │
     ├──► Sort by trigger priority (highest first)
     │
     └──► getToolDefinitions(activeSkills)
               └── Collect all ToolDefinition[] from matched skills
```

### Tool Execution

```
LLM returns ToolCall[]
     │
     ├──► For each ToolCall:
     │      │
     │      ├── SkillRegistry.getTool(call.name)
     │      │      └── not found → error result
     │      │
     │      ├── SecurityGuard.checkToolPermissions(tool.permissions, user.roles)
     │      │      └── denied → permission error result
     │      │
     │      └── SandboxExecutor.execute(call, tool, context)
     │             │
     │             ├── Validate permissions
     │             ├── Validate input against schema
     │             ├── Dispatch: bash | read_file | write_file | http_request | plugin
     │             ├── Race against 30s timeout
     │             └── Return ToolResult
     │
     └──► Feed ToolResult[] back into LLM for next round
```

### Memory Enrichment

```
processMessage()
     │
     ├──► memoryStore.search(message.content, userId, limit=5)
     │         └── Vector similarity search → relevant MemoryEntry[]
     │
     ├──► memoryStore.getFacts(userId)
     │         └── All known UserFact[] for this user
     │
     ├──► Build memory context string:
     │         "## Relevant Context from Memory"
     │         "- [conversation] ..."
     │         "## Known User Facts"
     │         "- preference: likes = dark mode"
     │
     └──► Inject into system prompt before LLM call
```

---

## Plugin Architecture

ArivuClaw supports 7 extension points through the Plugin SDK (`src/plugins/sdk/index.ts`):

| Extension Point | Interface | Purpose |
|---|---|---|
| **channel** | `ChannelPluginConfig` | Add custom channel adapters (e.g., LINE, IRC) |
| **memory** | `MemoryPluginConfig` | Swap the memory store (e.g., pgvector, Pinecone) |
| **tool** | `ToolPluginConfig` | Register additional tools with custom execution logic |
| **provider** | `ProviderPluginConfig` | Add new LLM providers |
| **hook** | `HookPluginConfig` | Run before/after events (message.received, tool.called, etc.) |
| **middleware** | `MiddlewarePluginConfig` | Modify LLM requests/responses in a pipeline (priority-ordered) |
| **transform** | `TransformPluginConfig` | Transform content inbound, outbound, or both (translate, redact, format) |

### Plugin Module Structure

```typescript
// my-plugin/index.ts
import type { PluginSDK, PluginManifest } from "arivuclaw/plugins/sdk";

export const manifest: PluginManifest = {
  name: "arivuclaw-plugin-weather",
  version: "1.0.0",
  description: "Weather lookup tool",
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

export function deactivate(): void {
  // cleanup
}
```

Plugins are loaded from a directory via `PluginRegistry.loadFromDirectory()`. Each subdirectory or `.ts`/`.js` file is dynamically imported.

---

## Deployment Architecture

### Single-Node (Laptop)

```
┌──────────────────────────────────┐
│           Your Laptop            │
│                                  │
│  ┌────────────────────────────┐  │
│  │     ArivuClaw Process      │  │
│  │  Gateway :3000             │  │
│  │  + CLI channel             │  │
│  │  + WhatsApp (Baileys)      │  │
│  │  + Memory (HNSWLib local)  │  │
│  │  + Skills (./skills)       │  │
│  └────────────────────────────┘  │
│                                  │
│  .arivuclaw/memory/memory.json   │
│  auth/whatsapp/ (session data)   │
└──────────────────────────────────┘
```

### Docker

```
┌────────────────────────────────────┐
│         Docker Compose             │
│                                    │
│  ┌──────────────┐  ┌───────────┐  │
│  │  arivuclaw   │  │  postgres │  │
│  │  (Node.js)   │◄─┤  (pgvec)  │  │
│  │  :3000       │  │  :5432    │  │
│  └──────────────┘  └───────────┘  │
│                                    │
│  Volumes:                          │
│  - ./skills:/app/skills            │
│  - ./config:/app/config            │
│  - arivuclaw-data:/app/.arivuclaw  │
└────────────────────────────────────┘
```

### Kubernetes

```
┌──────────────────────────────────────────────┐
│              Kubernetes Cluster              │
│                                              │
│  ┌────────────┐   ┌────────────────────────┐ │
│  │  Ingress   │   │  ArivuClaw Deployment  │ │
│  │  (nginx)   ├──►│  replicas: 1-3         │ │
│  └────────────┘   │  resources:            │ │
│                    │    cpu: 500m-2000m     │ │
│                    │    mem: 512Mi-2Gi      │ │
│                    └────────────────────────┘ │
│                                              │
│  ┌──────────────┐  ┌─────────────────┐       │
│  │  PostgreSQL  │  │  ConfigMap/      │       │
│  │  (pgvector)  │  │  Secrets         │       │
│  └──────────────┘  └─────────────────┘       │
└──────────────────────────────────────────────┘
```

---

## Directory Structure

```
arivuclaw/
├── config/
│   └── default.json              # Default configuration
├── docs/                         # Documentation (you are here)
├── skills/                       # 112 bundled skills
│   ├── calculator/SKILL.md       # Each skill is a directory with SKILL.md
│   ├── nmap-scanner/SKILL.md
│   ├── code-exec/SKILL.md
│   └── ...
├── src/
│   ├── index.ts                  # Main entry point
│   ├── a2a/
│   │   └── protocol.ts           # Agent-to-Agent protocol (Google ADK compatible)
│   ├── automations/
│   │   └── engine.ts             # Automation engine for scheduled/triggered workflows
│   ├── backup/
│   │   └── manager.ts            # Backup and restore for config, memory, sessions
│   ├── canvas/
│   │   └── renderer.ts           # Visual canvas rendering for rich output
│   ├── channels/
│   │   ├── base.ts               # BaseChannel abstract class (reconnection, queue)
│   │   ├── index.ts              # Channel exports
│   │   ├── cli.ts                # CLI channel adapter
│   │   ├── discord.ts            # Discord channel (discord.js)
│   │   ├── slack.ts              # Slack channel (@slack/bolt)
│   │   ├── telegram.ts           # Telegram channel (grammy)
│   │   ├── web.ts                # Web/WebSocket channel (ws)
│   │   ├── whatsapp.ts           # WhatsApp channel (Baileys)
│   │   └── extra/
│   │       ├── imessage.ts       # iMessage channel
│   │       ├── matrix.ts         # Matrix channel
│   │       ├── signal.ts         # Signal channel
│   │       └── teams.ts          # Microsoft Teams channel
│   ├── cli/
│   │   ├── index.ts              # CLI entry point (commander)
│   │   ├── config.ts             # CLI config management
│   │   └── onboard.ts            # Interactive onboarding wizard
│   ├── core/
│   │   ├── agent-runtime.ts      # AI processing loop
│   │   ├── file-upload.ts        # File upload handler
│   │   ├── gateway.ts            # Central gateway
│   │   ├── guardrails.ts         # Owner-controlled approval workflows
│   │   ├── model-tiering.ts      # Cost-optimised model selection
│   │   └── types.ts              # All TypeScript interfaces and types
│   ├── i18n/
│   │   └── locales.ts            # Internationalization support
│   ├── marketplace/
│   │   └── registry.ts           # Skill marketplace client
│   ├── mcp/
│   │   └── server.ts             # MCP server, client, and bridge
│   ├── memory/
│   │   └── vector-store.ts       # Vector memory store with RAG
│   ├── oauth/
│   │   └── manager.ts            # OAuth2 manager (Google, GitHub, Slack, Microsoft, Discord, Spotify)
│   ├── observability/
│   │   ├── health-dashboard.ts   # Health monitoring dashboard
│   │   └── telemetry.ts          # Telemetry and metrics collection
│   ├── plugins/
│   │   ├── providers/            # LLM provider implementations
│   │   │   ├── anthropic.ts
│   │   │   ├── openai.ts
│   │   │   ├── ollama.ts
│   │   │   ├── minimax.ts
│   │   │   ├── deepseek.ts
│   │   │   ├── groq.ts
│   │   │   └── neural-brain.ts
│   │   └── sdk/
│   │       └── index.ts          # Plugin SDK (7 extension points)
│   ├── security/
│   │   ├── guard.ts              # SecurityGuard (validation, rate limiting, permissions)
│   │   └── sandbox.ts            # SandboxExecutor (isolated tool execution)
│   ├── skills/
│   │   ├── registry.ts           # Skill registry (loading, triggers, dependencies)
│   │   └── loader.ts             # Skill prompt formatter
│   ├── streaming/
│   │   ├── manager.ts            # StreamingManager (LLM streaming with buffering)
│   │   └── channel-streamer.ts   # Per-channel streaming adapter
│   ├── tools/
│   │   └── system-tools.ts       # Built-in system tools
│   ├── ui/
│   │   └── dashboard.ts          # Web dashboard server
│   ├── utils/
│   │   └── logger.ts             # Winston-based logger
│   ├── vision/
│   │   └── processor.ts          # Image/vision processing
│   └── webhooks/
│       └── receiver.ts           # Webhook receiver with HMAC verification
├── tests/                        # 1153 tests (unit + integration)
├── jest.config.js
├── package.json
└── tsconfig.json
```

---

## Key Design Decisions

1. **Unrestricted by default.** ArivuClaw trusts the owner. In `unrestricted` mode, all tools execute without approval. The owner can opt into guardrails for specific actions.

2. **Skills are markdown files, not code.** SKILL.md files are YAML + markdown. This means skills are portable, version-controllable, and readable by both humans and LLMs.

3. **Cross-channel identity.** A single `UserIdentity` spans all channels. `linkUserChannel()` connects WhatsApp, Telegram, Discord accounts to one identity.

4. **Memory is first-class.** Every conversation is stored with embeddings. Facts are auto-extracted. Memory decays over time. RAG is injected into every LLM call.

5. **Provider-agnostic.** All 8 providers implement the same `LLMProvider` interface. Swap providers with a config change. Model tiering routes tasks to cost-optimal models automatically.

6. **MCP-native.** ArivuClaw both exposes and consumes MCP tools, making it interoperable with the broader AI agent ecosystem.
