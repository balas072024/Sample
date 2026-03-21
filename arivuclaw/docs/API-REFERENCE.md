# ArivuClaw — API Reference

> All classes are TypeScript. Types are defined in `src/core/types.ts` unless noted.

---

## Core Types

```typescript
interface IncomingMessage {
  id: string;
  channelType: ChannelType;        // 'whatsapp' | 'telegram' | 'discord' | ...
  channelUserId: string;
  content: string;
  attachments?: Attachment[];
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface AgentResponse {
  text: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  memoryUsed?: MemoryEntry[];
  provider?: string;
  model?: string;
  tokensUsed?: number;
}

interface Session {
  id: string;
  userId: string;
  channelType: ChannelType;
  history: ChatMessage[];
  activeSkills: string[];
  createdAt: Date;
  lastActiveAt: Date;
}

interface UserIdentity {
  id: string;
  channels: ChannelIdentity[];    // [(channelType, channelUserId), ...]
  facts: UserFact[];
  preferences: Record<string, unknown>;
}

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  permissions?: Permission[];
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

interface ToolResult {
  id: string;
  name: string;
  result: unknown;
  error?: string;
}

interface MemoryEntry {
  id: string;
  userId: string;
  content: string;
  embedding?: number[];
  type: 'conversation' | 'fact' | 'document';
  weight: number;
  createdAt: Date;
  lastAccessedAt: Date;
}

type ChannelType =
  | 'whatsapp' | 'telegram' | 'discord' | 'slack'
  | 'web' | 'cli' | 'signal' | 'imessage' | 'teams' | 'matrix';

type ExecutionMode = 'unrestricted' | 'local-admin' | 'restricted';
type ModelTier = 'router' | 'standard' | 'premium';
```

---

## Gateway

**File:** `src/core/gateway.ts`

### Constructor

```typescript
new Gateway(config: GatewayConfig)

interface GatewayConfig {
  host?: string;                  // default '0.0.0.0'
  port?: number;                  // default 3000
  channels?: ChannelConfig[];
  agentRuntime: AgentRuntime;
  memoryStore: VectorMemoryStore;
  securityGuard: SecurityGuard;
  sessionTtlMs?: number;          // default 1_800_000 (30 min)
}
```

### Methods

| Method | Signature | Description |
|---|---|---|
| `start` | `() => Promise<void>` | Starts the gateway and all channel adapters |
| `stop` | `() => Promise<void>` | Graceful shutdown |
| `receive` | `(msg: IncomingMessage) => Promise<void>` | Called by channel adapters |
| `send` | `(session: Session, response: AgentResponse) => Promise<void>` | Delivers response |
| `routeMessage` | `(userId: string, targetChannel: ChannelType, text: string) => Promise<void>` | Cross-channel routing |
| `getHealth` | `() => GatewayHealth` | Returns health snapshot |
| `resolveUser` | `(channelType: ChannelType, channelUserId: string) => Promise<UserIdentity>` | Identity lookup/creation |
| `getOrCreateSession` | `(user: UserIdentity, channelType: ChannelType) => Session` | Session management |
| `registerChannel` | `(adapter: ChannelAdapter) => void` | Dynamic adapter registration |

---

## AgentRuntime

**File:** `src/core/agent-runtime.ts`

### Constructor

```typescript
new AgentRuntime(config: AgentRuntimeConfig)

interface AgentRuntimeConfig {
  provider: LLMProvider;
  skillRegistry: SkillRegistry;
  memoryStore: VectorMemoryStore;
  securityGuard: SecurityGuard;
  sandboxExecutor: SandboxExecutor;
  systemPrompt?: string;
  maxTokensPerTurn?: number;      // default 4096
  maxToolCallsPerTurn?: number;   // default 10
}
```

### Methods

| Method | Signature | Description |
|---|---|---|
| `processMessage` | `(session: Session, message: IncomingMessage, user: UserIdentity) => Promise<AgentResponse>` | Main AI loop |
| `enrichWithMemory` | `(userId: string, content: string) => Promise<string>` | RAG context injection |
| `selectSkills` | `(content: string, session: Session) => Promise<SkillManifest[]>` | Trigger matching |
| `buildSystemPrompt` | `(skills: SkillManifest[], memoryContext: string) => string` | Assembles system prompt |
| `executeToolCall` | `(call: ToolCall, user: UserIdentity) => Promise<ToolResult>` | Single tool dispatch |

---

## SkillRegistry

**File:** `src/skills/registry.ts`

### Constructor

```typescript
new SkillRegistry(config?: SkillRegistryConfig)

interface SkillRegistryConfig {
  skillDirs?: string[];           // directories to scan
  hotReload?: boolean;            // default true
  watchDebounceMs?: number;       // default 300
}
```

### Methods

| Method | Signature | Description |
|---|---|---|
| `loadSkills` | `(dir: string) => Promise<void>` | Scans directory for SKILL.md files |
| `register` | `(manifest: SkillManifest) => void` | Register a skill programmatically |
| `unregister` | `(name: string) => void` | Remove a skill |
| `getSkill` | `(name: string) => SkillManifest \| undefined` | Lookup by name |
| `getTool` | `(toolName: string) => ToolDefinition \| undefined` | Lookup tool across all skills |
| `matchTriggers` | `(content: string) => Promise<SkillManifest[]>` | Trigger matching (keyword/regex/intent) |
| `getToolDefinitions` | `(skills: SkillManifest[]) => ToolDefinition[]` | Collect tool definitions |
| `resolveDependencies` | `(skill: SkillManifest) => SkillManifest[]` | Topological sort |
| `listAll` | `() => SkillManifest[]` | All registered skills |

---

## SkillLoader

**File:** `src/skills/loader.ts`

### Methods

| Method | Signature | Description |
|---|---|---|
| `parseSkillMd` | `(filePath: string) => Promise<SkillManifest>` | Parse SKILL.md file |
| `formatSkillPrompt` | `(skill: SkillManifest) => string` | XML-compact prompt fragment |
| `validateManifest` | `(manifest: SkillManifest) => ValidationResult` | Schema validation |
| `watchDirectory` | `(dir: string, onChange: (path: string) => void) => FSWatcher` | Hot-reload watcher |

---

## VectorMemoryStore

**File:** `src/memory/vector-store.ts`

### Constructor

```typescript
new VectorMemoryStore(config?: MemoryConfig)

interface MemoryConfig {
  persistencePath?: string;       // default '.arivuclaw/memory/memory.json'
  embeddingProvider?: string;     // provider used for embeddings
  maxEntries?: number;            // default 10_000
  decayRate?: number;             // default 0.01 per day
  decayThreshold?: number;        // default 0.15 (prune below)
  similarityThreshold?: number;   // default 0.95 (dedup threshold)
  topK?: number;                  // default 5 (RAG results)
}
```

### Methods

| Method | Signature | Description |
|---|---|---|
| `store` | `(entry: Omit<MemoryEntry, 'id' \| 'embedding'>) => Promise<string>` | Embed + store, returns id |
| `search` | `(query: string, userId: string, limit?: number) => Promise<MemoryEntry[]>` | Cosine similarity search |
| `getFacts` | `(userId: string) => UserFact[]` | Retrieve extracted user facts |
| `storeFact` | `(userId: string, fact: UserFact) => void` | Store a user fact |
| `extractFacts` | `(userId: string, text: string) => Promise<UserFact[]>` | LLM-based fact extraction |
| `decay` | `() => Promise<number>` | Run decay pass; returns pruned count |
| `delete` | `(id: string) => boolean` | Remove a memory entry |
| `persist` | `() => Promise<void>` | Save to disk |
| `load` | `() => Promise<void>` | Load from disk |
| `getStats` | `() => MemoryStats` | Entry count, size, oldest/newest |

---

## LLM Providers

All providers implement:

```typescript
interface LLMProvider {
  name: string;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  streamChat(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string>;
  countTokens(messages: ChatMessage[]): Promise<number>;
  isAvailable(): Promise<boolean>;
}

interface ChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: ToolDefinition[];
  stream?: boolean;
  tier?: ModelTier;
}

interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}
```

### AnthropicProvider (`src/plugins/providers/anthropic.ts`)

```typescript
new AnthropicProvider(config: { apiKey: string; defaultModel?: string })
// defaultModel: 'claude-opus-4-5' | 'claude-sonnet-4-5' | 'claude-haiku-3-5'
```

### OpenAIProvider (`src/plugins/providers/openai.ts`)

```typescript
new OpenAIProvider(config: { apiKey: string; baseURL?: string; defaultModel?: string })
// defaultModel: 'gpt-4o' | 'gpt-4o-mini' | 'o1' | 'o3-mini'
```

### OllamaProvider (`src/plugins/providers/ollama.ts`)

```typescript
new OllamaProvider(config: { baseURL?: string; defaultModel?: string })
// baseURL: default 'http://localhost:11434'
```

### MiniMaxProvider (`src/plugins/providers/minimax.ts`)

```typescript
new MiniMaxProvider(config: { apiKey: string; groupId: string; defaultModel?: string })
```

### DeepSeekProvider (`src/plugins/providers/deepseek.ts`)

```typescript
new DeepSeekProvider(config: { apiKey: string; defaultModel?: string })
// defaultModel: 'deepseek-chat' | 'deepseek-reasoner'
```

### GroqProvider (`src/plugins/providers/groq.ts`)

```typescript
new GroqProvider(config: { apiKey: string; defaultModel?: string })
// defaultModel: 'llama-3.3-70b-versatile' | 'mixtral-8x7b-32768'
```

### GoogleProvider (via provider config)

```typescript
// Configured via GOOGLE_API_KEY; uses @google/generative-ai SDK
// Models: 'gemini-2.0-flash' | 'gemini-1.5-pro' | 'gemini-1.5-flash'
```

### NeuralBrainProvider (`src/plugins/providers/neural-brain.ts`)

```typescript
new NeuralBrainProvider(config: {
  mode: 'simulate' | 'hybrid' | 'cortical';
  baseProvider?: LLMProvider;    // underlying provider for hybrid/cortical
  corticalDepth?: number;        // reasoning depth (cortical mode)
})
```

---

## SecurityGuard

**File:** `src/security/guard.ts`

### Constructor

```typescript
new SecurityGuard(config: SecurityConfig)

interface SecurityConfig {
  mode: ExecutionMode;
  rateLimit?: { perUser: number; perChannel: number; global: number; windowMs: number };
  allowedPaths?: string[];
  blockedPaths?: string[];
  allowedDomains?: string[];
  blockedDomains?: string[];
}
```

### Methods

| Method | Signature | Description |
|---|---|---|
| `validateInput` | `(message: IncomingMessage) => ValidationResult` | Sanitise and validate |
| `checkRateLimit` | `(userId: string, channelType: ChannelType) => RateLimitResult` | Token-bucket check |
| `checkToolPermissions` | `(permissions: Permission[], userRoles: string[]) => boolean` | RBAC check |
| `validatePath` | `(path: string) => boolean` | Path traversal prevention |
| `validateUrl` | `(url: string) => boolean` | Domain allow/block list |
| `auditLog` | `(event: AuditEvent) => void` | Structured audit log entry |

---

## SandboxExecutor

**File:** `src/security/sandbox.ts`

### Constructor

```typescript
new SandboxExecutor(config?: SandboxConfig)

interface SandboxConfig {
  timeoutMs?: number;             // default 30_000
  mode?: ExecutionMode;
  allowedPaths?: string[];
  allowNetwork?: boolean;
  maxOutputBytes?: number;        // default 1_048_576 (1 MB)
}
```

### Methods

| Method | Signature | Description |
|---|---|---|
| `execute` | `(call: ToolCall, tool: ToolDefinition, ctx: ExecutionContext) => Promise<ToolResult>` | Run tool call |
| `executeShell` | `(cmd: string, opts?: ShellOptions) => Promise<ShellResult>` | Bash execution |
| `readFile` | `(path: string) => Promise<string>` | Sandboxed file read |
| `writeFile` | `(path: string, content: string) => Promise<void>` | Sandboxed file write |
| `httpRequest` | `(req: HttpRequestInput) => Promise<HttpResponse>` | Outbound HTTP |

---

## MCPServer / MCPClient / MCPBridge

**File:** `src/mcp/server.ts`

### MCPServer

```typescript
new MCPServer(config: { port?: number; authToken?: string; skillRegistry: SkillRegistry })

// Methods
start(): Promise<void>
stop(): Promise<void>
exposeTools(tools: ToolDefinition[]): void
exposeResource(resource: MCPResource): void
```

### MCPClient

```typescript
new MCPClient(config: { url: string; transport: 'http' | 'stdio'; authToken?: string })

// Methods
connect(): Promise<void>
disconnect(): Promise<void>
listTools(): Promise<MCPTool[]>
callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult>
listResources(): Promise<MCPResource[]>
readResource(uri: string): Promise<string>
```

### MCPBridge

```typescript
new MCPBridge(config: { server: MCPServer; skillRegistry: SkillRegistry })

// Methods
exposeNativeTools(): void           // publish all registry tools to MCPServer
connectServer(client: MCPClient): Promise<void>   // import external tools
callExternalTool(serverUrl: string, toolName: string, args: Record<string, unknown>): Promise<MCPToolResult>
```

---

## VisionProcessor

**File:** `src/vision/processor.ts`

```typescript
new VisionProcessor(config: { provider: LLMProvider })

// Methods
analyzeImage(imagePath: string, prompt?: string): Promise<string>
analyzeImageUrl(url: string, prompt?: string): Promise<string>
extractText(imagePath: string): Promise<string>      // OCR
describeImage(imagePath: string): Promise<string>
```

---

## StreamingManager

**File:** `src/streaming/manager.ts`

```typescript
new StreamingManager(config?: { bufferMs?: number; maxChunkSize?: number })

// Methods
streamToChannel(
  generator: AsyncGenerator<string>,
  session: Session,
  adapter: ChannelAdapter
): Promise<void>

createSSEStream(res: ServerResponse): SSEStream
createWebSocketStream(ws: WebSocket): WSStream
bufferChunks(generator: AsyncGenerator<string>, flushMs: number): AsyncGenerator<string>
```

---

## DashboardServer

**File:** `src/ui/dashboard.ts`

```typescript
new DashboardServer(config: {
  port?: number;                  // default 3001
  gateway: Gateway;
  telemetry: TelemetryService;
  auth?: { username: string; password: string };
})

// Methods
start(): Promise<void>
stop(): Promise<void>
getStats(): DashboardStats
```

---

## A2AServer

**File:** `src/a2a/protocol.ts`

```typescript
new A2AServer(config: { port?: number; agentRuntime: AgentRuntime; authToken?: string })

// Methods — Google ADK-compatible Agent-to-Agent protocol
start(): Promise<void>
stop(): Promise<void>
handleAgentMessage(msg: A2AMessage): Promise<A2AResponse>
registerPeer(peerId: string, url: string): void
sendToPeer(peerId: string, msg: A2AMessage): Promise<A2AResponse>
```

---

## AutomationEngine

**File:** `src/automations/engine.ts`

```typescript
new AutomationEngine(config: { agentRuntime: AgentRuntime; storage?: AutomationStorage })

// Methods
createAutomation(def: AutomationDef): string      // returns id
deleteAutomation(id: string): boolean
enableAutomation(id: string): void
disableAutomation(id: string): void
listAutomations(): AutomationDef[]
triggerNow(id: string): Promise<AutomationResult>

interface AutomationDef {
  id?: string;
  name: string;
  trigger: CronTrigger | EventTrigger | WebhookTrigger;
  action: string;                 // skill name or prompt
  params?: Record<string, unknown>;
  targetChannel?: ChannelType;
  targetUserId?: string;
}
```

---

## TelemetryService

**File:** `src/observability/telemetry.ts`

```typescript
new TelemetryService(config?: { exporters?: TelemetryExporter[]; sampleRate?: number })

// Methods
recordMetric(name: string, value: number, tags?: Record<string, string>): void
startSpan(name: string, parentId?: string): Span
endSpan(span: Span, status?: 'ok' | 'error'): void
recordEvent(event: TelemetryEvent): void
flush(): Promise<void>
getMetrics(): MetricSnapshot[]
```

---

## HealthDashboard

**File:** `src/observability/health-dashboard.ts`

```typescript
new HealthDashboard(config: { gateway: Gateway; telemetry: TelemetryService })

// Methods
getHealth(): HealthSnapshot
getChannelHealth(channelType: ChannelType): ChannelHealth
getProviderHealth(providerName: string): ProviderHealth
startPeriodicCheck(intervalMs?: number): void    // default 30_000
```

---

## ModelTierManager

**File:** `src/core/model-tiering.ts`

```typescript
new ModelTierManager(config: ModelTierConfig)

interface ModelTierConfig {
  providers: LLMProvider[];
  tiers: {
    router: { provider: string; model: string };
    standard: { provider: string; model: string };
    premium: { provider: string; model: string };
  };
  fallbackOrder?: string[];       // provider names in fallback order
}

// Methods
selectProvider(tier: ModelTier, taskHint?: string): LLMProvider
selectModel(tier: ModelTier): string
recordLatency(provider: string, ms: number): void
recordError(provider: string, error: Error): void
getStats(): TierStats
```

---

## GuardrailManager

**File:** `src/core/guardrails.ts`

```typescript
new GuardrailManager(config: GuardrailConfig)

interface GuardrailConfig {
  rules: GuardrailRule[];
  defaultAction: 'allow' | 'deny' | 'ask';
  ownerUserId?: string;
}

interface GuardrailRule {
  id: string;
  match: { tool?: string; pattern?: string; permission?: string };
  action: 'allow' | 'deny' | 'ask';
  reason?: string;
}

// Methods
evaluate(call: ToolCall, user: UserIdentity): Promise<GuardrailDecision>
addRule(rule: GuardrailRule): void
removeRule(id: string): void
listRules(): GuardrailRule[]
```

---

## MarketplaceClient

**File:** `src/marketplace/registry.ts`

```typescript
new MarketplaceClient(config?: { registryUrl?: string; cacheDir?: string })

// Methods
search(query: string): Promise<MarketplaceSkill[]>
install(skillId: string, targetDir: string): Promise<void>
update(skillId: string): Promise<void>
uninstall(skillId: string): Promise<void>
list(): Promise<MarketplaceSkill[]>
publish(skillDir: string, token: string): Promise<string>  // returns skill id
```

---

## OAuthManager

**File:** `src/oauth/manager.ts`

```typescript
new OAuthManager(config: OAuthConfig)

interface OAuthConfig {
  providers: OAuthProviderConfig[];     // google | github | slack | microsoft | discord | spotify
  callbackBaseUrl: string;
  storage?: OAuthTokenStorage;
}

// Methods
getAuthUrl(provider: string, userId: string, scopes?: string[]): string
handleCallback(provider: string, code: string, state: string): Promise<OAuthToken>
getToken(provider: string, userId: string): Promise<OAuthToken | null>
refreshToken(provider: string, userId: string): Promise<OAuthToken>
revokeToken(provider: string, userId: string): Promise<void>
```

---

## WebhookReceiver

**File:** `src/webhooks/receiver.ts`

```typescript
new WebhookReceiver(config: {
  port?: number;
  secret?: string;              // HMAC secret
  endpoints?: WebhookEndpoint[];
})

// Methods
start(): Promise<void>
stop(): Promise<void>
registerEndpoint(endpoint: WebhookEndpoint): void
verifySignature(payload: Buffer, signature: string): boolean

interface WebhookEndpoint {
  path: string;
  method?: 'POST' | 'GET';
  handler: (payload: unknown, headers: Record<string, string>) => Promise<void>;
  verifyHmac?: boolean;
}
```

---

## BackupManager

**File:** `src/backup/manager.ts`

```typescript
new BackupManager(config: { backupDir?: string; includeMemory?: boolean; includeConfig?: boolean })

// Methods
createBackup(label?: string): Promise<string>   // returns backup path
restoreBackup(backupPath: string): Promise<void>
listBackups(): BackupMetadata[]
deleteBackup(backupPath: string): Promise<void>
scheduleAutoBackup(cronExpr: string): void
```

---

## FileUploadHandler

**File:** `src/core/file-upload.ts`

```typescript
new FileUploadHandler(config?: { maxSizeMb?: number; allowedMimeTypes?: string[]; uploadDir?: string })

// Methods
handleUpload(file: UploadedFile): Promise<ProcessedFile>
processImage(file: ProcessedFile): Promise<string>     // returns description
processDocument(file: ProcessedFile): Promise<string>  // returns extracted text
processAudio(file: ProcessedFile): Promise<string>     // returns transcript
```

---

## CanvasRenderer

**File:** `src/canvas/renderer.ts`

```typescript
new CanvasRenderer(config?: { width?: number; height?: number; format?: 'png' | 'svg' })

// Methods
renderMarkdown(md: string): Promise<Buffer>
renderChart(data: ChartData): Promise<Buffer>
renderDiagram(spec: DiagramSpec): Promise<Buffer>
renderTable(rows: Record<string, unknown>[]): Promise<Buffer>
```

---

## I18n

**File:** `src/i18n/locales.ts`

```typescript
// Singleton — import { i18n } from 'arivuclaw/i18n/locales'

i18n.t(key: string, locale?: string, vars?: Record<string, string>): string
i18n.addLocale(locale: string, translations: Record<string, string>): void
i18n.getSupportedLocales(): string[]
i18n.detectLocale(user: UserIdentity): string
```

---

## Channel Adapters

All adapters extend `BaseChannel` and implement:

```typescript
interface ChannelAdapter {
  channelType: ChannelType;
  start(): Promise<void>;
  stop(): Promise<void>;
  send(userId: string, response: AgentResponse): Promise<void>;
  isConnected(): boolean;
  getCapabilities(): ChannelCapabilities;
}

interface ChannelCapabilities {
  streaming: boolean;
  fileUpload: boolean;
  richText: boolean;
  reactions: boolean;
  threads: boolean;
  maxMessageLength: number;
}
```

| Adapter | File | Library | Capabilities |
|---|---|---|---|
| WhatsAppAdapter | `channels/whatsapp.ts` | Baileys | streaming, fileUpload, richText |
| TelegramAdapter | `channels/telegram.ts` | grammy | streaming, fileUpload, richText, reactions |
| DiscordAdapter | `channels/discord.ts` | discord.js | streaming, fileUpload, richText, reactions, threads |
| SlackAdapter | `channels/slack.ts` | @slack/bolt | streaming, fileUpload, richText, reactions, threads |
| WebAdapter | `channels/web.ts` | ws | streaming, fileUpload, richText |
| CLIAdapter | `channels/cli.ts` | readline | streaming |
| SignalAdapter | `channels/extra/signal.ts` | signal-cli | fileUpload |
| iMessageAdapter | `channels/extra/imessage.ts` | AppleScript | fileUpload |
| TeamsAdapter | `channels/extra/teams.ts` | botframework | fileUpload, richText, threads |
| MatrixAdapter | `channels/extra/matrix.ts` | matrix-js-sdk | fileUpload, richText |
