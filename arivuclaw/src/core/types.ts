/**
 * ArivuClaw Core Type Definitions
 *
 * Improvements over OpenClaw:
 * - Typed skill interfaces with dependency resolution
 * - Sandboxed execution contexts
 * - Built-in RAG memory types
 * - Fine-grained permission model
 */

import { z } from "zod";

// ─── Identity & Session ──────────────────────────────────────────────

export interface UserIdentity {
  id: string;
  displayName: string;
  channels: Map<ChannelType, string>; // channelType -> channel-specific userId
  roles: UserRole[];
  createdAt: Date;
}

export type UserRole = "owner" | "admin" | "user" | "guest";

export interface Session {
  id: string;
  userId: string;
  channelType: ChannelType;
  channelSessionId: string;
  messages: Message[];
  activeSkills: string[];
  memoryContext: MemoryContext;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
}

// ─── Messages ────────────────────────────────────────────────────────

export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  attachments?: Attachment[];
  channelType: ChannelType;
  channelMessageId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface Attachment {
  type: "image" | "file" | "audio" | "video" | "location";
  url?: string;
  data?: Buffer;
  mimeType: string;
  filename?: string;
}

// ─── Channels ────────────────────────────────────────────────────────

export type ChannelType =
  | "whatsapp"
  | "telegram"
  | "discord"
  | "slack"
  | "signal"
  | "imessage"
  | "matrix"
  | "teams"
  | "line"
  | "irc"
  | "web"
  | "cli"
  | "api";

export interface ChannelAdapter {
  readonly type: ChannelType;
  readonly name: string;

  initialize(config: ChannelConfig): Promise<void>;
  shutdown(): Promise<void>;

  sendMessage(channelUserId: string, content: string, attachments?: Attachment[]): Promise<void>;
  onMessage(handler: (msg: IncomingMessage) => Promise<void>): void;

  getStatus(): ChannelStatus;
}

export interface ChannelConfig {
  type: ChannelType;
  enabled: boolean;
  credentials: Record<string, string>;
  options?: Record<string, unknown>;
}

export interface ChannelStatus {
  type: ChannelType;
  connected: boolean;
  lastActivity?: Date;
  error?: string;
}

export interface IncomingMessage {
  channelType: ChannelType;
  channelUserId: string;
  channelMessageId: string;
  content: string;
  attachments?: Attachment[];
  timestamp: Date;
  raw?: unknown;
}

// ─── LLM Providers ──────────────────────────────────────────────────

export type ProviderType = "anthropic" | "openai" | "google" | "ollama" | "minimax" | "deepseek" | "groq" | "custom";

export interface LLMProvider {
  readonly type: ProviderType;
  readonly name: string;

  chat(request: LLMRequest): Promise<LLMResponse>;
  streamChat(request: LLMRequest): AsyncGenerator<LLMStreamChunk>;
  countTokens(text: string): Promise<number>;
}

export interface LLMRequest {
  model: string;
  systemPrompt: string;
  messages: LLMMessage[];
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string | LLMContentBlock[];
}

export interface LLMContentBlock {
  type: "text" | "image" | "tool_use" | "tool_result";
  text?: string;
  imageUrl?: string;
  toolUseId?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: string;
}

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage: { inputTokens: number; outputTokens: number };
  stopReason: "end" | "tool_use" | "max_tokens" | "stop_sequence";
  model: string;
}

export interface LLMStreamChunk {
  type: "text" | "tool_use_start" | "tool_use_delta" | "tool_use_end" | "done";
  text?: string;
  toolCall?: Partial<ToolCall>;
}

// ─── Tools & Skills ──────────────────────────────────────────────────

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType<unknown>;
  permissions: ToolPermission[];
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  output: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export type ToolPermission =
  | "filesystem.read"
  | "filesystem.write"
  | "filesystem.delete"
  | "network.http"
  | "network.websocket"
  | "network.tcp"
  | "browser.navigate"
  | "browser.interact"
  | "code.execute"
  | "system.process"
  | "system.env"
  | "system.admin"
  | "system.clipboard"
  | "system.screenshot"
  | "system.audio"
  | "system.notifications"
  | "channel.send"
  | "memory.read"
  | "memory.write"
  | "schedule.create"
  | "schedule.delete"
  | "docker.manage"
  | "git.ops"
  | "database.query"
  | "email.send"
  | "image.process"
  | "pdf.process"
  | "translate.text"
  | "ocr.extract"
  | "tts.speak"
  | "unrestricted";

export type ExecutionMode = "restricted" | "unrestricted" | "local-admin";

export interface SkillManifest {
  name: string;
  version: string;
  description: string;
  author?: string;
  tags?: string[];

  // Improvement over OpenClaw: typed interfaces and dependencies
  dependencies?: SkillDependency[];
  provides?: SkillInterface[];
  requires?: SkillInterface[];

  permissions: ToolPermission[];
  tools: ToolDefinition[];
  triggers?: SkillTrigger[];

  // Skill environment requirements
  environment?: {
    platforms?: ("linux" | "darwin" | "win32")[];
    binaries?: string[];
    envVars?: string[];
  };
}

export interface SkillDependency {
  skill: string;
  version: string;
  optional?: boolean;
}

export interface SkillInterface {
  name: string;
  version: string;
  methods: SkillMethod[];
}

export interface SkillMethod {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

export interface SkillTrigger {
  type: "keyword" | "regex" | "intent" | "schedule" | "event";
  pattern: string;
  priority?: number;
}

// ─── Memory & RAG ────────────────────────────────────────────────────

export interface MemoryContext {
  shortTerm: Message[];        // Current session context
  longTerm: MemoryEntry[];     // Retrieved from vector store
  facts: UserFact[];           // Extracted user facts
  relevanceScore: number;
}

export interface MemoryEntry {
  id: string;
  userId: string;
  content: string;
  embedding?: number[];
  type: "conversation" | "fact" | "skill_result" | "document";
  source: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface UserFact {
  id: string;
  userId: string;
  category: string;       // e.g., "preference", "personal", "work"
  key: string;
  value: string;
  confidence: number;      // 0-1
  source: string;
  extractedAt: Date;
}

export interface MemoryStore {
  readonly type: string;

  initialize(): Promise<void>;
  shutdown(): Promise<void>;

  store(entry: MemoryEntry): Promise<void>;
  search(query: string, userId: string, limit?: number): Promise<MemoryEntry[]>;
  getRecent(userId: string, limit?: number): Promise<MemoryEntry[]>;
  delete(id: string): Promise<void>;

  storeFact(fact: UserFact): Promise<void>;
  getFacts(userId: string, category?: string): Promise<UserFact[]>;
}

// ─── Security ────────────────────────────────────────────────────────

export interface SecurityPolicy {
  maxTokensPerTurn: number;
  maxToolCallsPerTurn: number;
  allowedDomains: string[];
  blockedDomains: string[];
  allowedPaths: string[];
  blockedPaths: string[];
  sandboxEnabled: boolean;
  requireApprovalFor: ToolPermission[];
  rateLimits: RateLimit[];
}

export interface RateLimit {
  scope: "user" | "channel" | "global";
  maxRequests: number;
  windowMs: number;
}

export interface SandboxContext {
  id: string;
  permissions: ToolPermission[];
  timeoutMs: number;
  memoryLimitMb: number;
  allowedModules: string[];
  workDir: string;
}

// ─── Configuration ───────────────────────────────────────────────────

export interface ArivuClawConfig {
  mode: ExecutionMode;
  gateway: {
    host: string;
    port: number;
    corsOrigins: string[];
  };
  providers: Record<string, ProviderConfig>;
  defaultProvider: ProviderType;
  defaultModel: string;
  channels: ChannelConfig[];
  memory: MemoryStoreConfig;
  security: SecurityPolicy;
  skills: {
    directories: string[];
    autoload: boolean;
    hotReload: boolean;
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
    file?: string;
  };
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel: string;
  options?: Record<string, unknown>;
}

export interface MemoryStoreConfig {
  type: "local" | "hnswlib" | "pgvector" | "custom";
  embeddingProvider: ProviderType;
  embeddingModel: string;
  options?: Record<string, unknown>;
}

// ─── Events ──────────────────────────────────────────────────────────

export type ArivuClawEvent =
  | { type: "message.received"; data: IncomingMessage }
  | { type: "message.sent"; data: { channelType: ChannelType; content: string } }
  | { type: "tool.called"; data: { toolName: string; input: Record<string, unknown> } }
  | { type: "tool.completed"; data: ToolResult }
  | { type: "skill.loaded"; data: { name: string } }
  | { type: "skill.error"; data: { name: string; error: string } }
  | { type: "channel.connected"; data: { type: ChannelType } }
  | { type: "channel.disconnected"; data: { type: ChannelType; reason: string } }
  | { type: "session.created"; data: { sessionId: string; userId: string } }
  | { type: "session.ended"; data: { sessionId: string } }
  | { type: "memory.stored"; data: { entryId: string } }
  | { type: "security.violation"; data: { userId: string; action: string; reason: string } }
  | { type: "error"; data: { message: string; stack?: string } };
