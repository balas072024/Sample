/**
 * Arivumaiyam AI Gateway — The central hub connecting channels to the agent runtime.
 *
 * Improvements over OpenClaw:
 * - Input validation on all gateway URLs (prevents CVE-2026-25253 style attacks)
 * - Per-channel rate limiting
 * - Unified identity resolution across channels
 * - Health check endpoints
 * - Graceful shutdown with connection draining
 */

import { EventEmitter } from "eventemitter3";
import { v4 as uuid } from "uuid";
import type {
  ArivumaiyamConfig,
  ArivumaiyamEvent,
  ChannelAdapter,
  ChannelType,
  IncomingMessage,
  Message,
  Session,
  UserIdentity,
} from "./types";
import type { AgentRuntime } from "./agent-runtime";
import type { MemoryStore } from "./types";
import { SecurityGuard } from "../security/guard";
import { Logger } from "../utils/logger";

const log = Logger.create("gateway");

export class Gateway extends EventEmitter<Record<string, (...args: unknown[]) => void>> {
  private channels = new Map<ChannelType, ChannelAdapter>();
  private sessions = new Map<string, Session>();
  private users = new Map<string, UserIdentity>();
  private securityGuard: SecurityGuard;
  private agentRuntime!: AgentRuntime;
  private isRunning = false;

  constructor(
    private config: ArivumaiyamConfig,
    private memoryStore: MemoryStore,
  ) {
    super();
    this.securityGuard = new SecurityGuard(config.security);
  }

  setAgentRuntime(runtime: AgentRuntime): void {
    this.agentRuntime = runtime;
  }

  // ─── Channel Management ──────────────────────────────────────────

  async registerChannel(adapter: ChannelAdapter): Promise<void> {
    if (this.channels.has(adapter.type)) {
      throw new Error(`Channel ${adapter.type} already registered`);
    }

    const channelConfig = this.config.channels.find((c) => c.type === adapter.type);
    if (!channelConfig || !channelConfig.enabled) {
      log.warn(`Channel ${adapter.type} not enabled in config, skipping`);
      return;
    }

    adapter.onMessage(async (msg) => this.handleIncomingMessage(msg));
    await adapter.initialize(channelConfig);

    this.channels.set(adapter.type, adapter);
    this.emitEvent({ type: "channel.connected", data: { type: adapter.type } });
    log.info(`Channel registered: ${adapter.type} (${adapter.name})`);
  }

  async unregisterChannel(type: ChannelType): Promise<void> {
    const adapter = this.channels.get(type);
    if (adapter) {
      await adapter.shutdown();
      this.channels.delete(type);
      this.emitEvent({ type: "channel.disconnected", data: { type, reason: "unregistered" } });
    }
  }

  getChannel(type: ChannelType): ChannelAdapter | undefined {
    return this.channels.get(type);
  }

  getActiveChannels(): ChannelType[] {
    return Array.from(this.channels.keys());
  }

  // ─── Message Routing ─────────────────────────────────────────────

  private async handleIncomingMessage(incoming: IncomingMessage): Promise<void> {
    try {
      // Security: Validate and sanitize input
      if (!this.securityGuard.validateInput(incoming)) {
        log.warn(`Blocked message from ${incoming.channelUserId}: failed validation`);
        return;
      }

      // Rate limiting
      if (!this.securityGuard.checkRateLimit(incoming.channelUserId, incoming.channelType)) {
        log.warn(`Rate limited: ${incoming.channelUserId} on ${incoming.channelType}`);
        await this.sendToChannel(
          incoming.channelType,
          incoming.channelUserId,
          "You're sending messages too quickly. Please wait a moment.",
        );
        return;
      }

      this.emitEvent({ type: "message.received", data: incoming });

      // Resolve or create user identity
      const user = this.resolveUser(incoming.channelType, incoming.channelUserId);

      // Get or create session (cross-channel session continuity)
      const session = this.getOrCreateSession(user, incoming.channelType);

      // Build message object
      const message: Message = {
        id: uuid(),
        sessionId: session.id,
        role: "user",
        content: incoming.content,
        attachments: incoming.attachments,
        channelType: incoming.channelType,
        channelMessageId: incoming.channelMessageId,
        timestamp: incoming.timestamp,
      };

      session.messages.push(message);
      session.updatedAt = new Date();

      // Store in memory
      await this.memoryStore.store({
        id: message.id,
        userId: user.id,
        content: message.content,
        type: "conversation",
        source: incoming.channelType,
        timestamp: message.timestamp,
      });

      // Route to agent runtime
      const response = await this.agentRuntime.processMessage(session, message, user);

      // Send response back through the originating channel
      await this.sendToChannel(incoming.channelType, incoming.channelUserId, response.content);

      // Store assistant response
      const assistantMsg: Message = {
        id: uuid(),
        sessionId: session.id,
        role: "assistant",
        content: response.content,
        channelType: incoming.channelType,
        timestamp: new Date(),
      };
      session.messages.push(assistantMsg);

      this.emitEvent({
        type: "message.sent",
        data: { channelType: incoming.channelType, content: response.content },
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      log.error(`Error handling message: ${errMsg}`);
      this.emitEvent({ type: "error", data: { message: errMsg } });

      // Send error feedback to user
      try {
        await this.sendToChannel(
          incoming.channelType,
          incoming.channelUserId,
          "Sorry, I encountered an error processing your message. Please try again.",
        );
      } catch {
        // Silent fallback — channel may be down
      }
    }
  }

  private async sendToChannel(
    type: ChannelType,
    userId: string,
    content: string,
  ): Promise<void> {
    const channel = this.channels.get(type);
    if (!channel) {
      throw new Error(`Channel ${type} not registered`);
    }
    await channel.sendMessage(userId, content);
  }

  // ─── Cross-channel message routing ───────────────────────────────

  async routeMessage(
    fromChannel: ChannelType,
    toChannel: ChannelType,
    userId: string,
    content: string,
  ): Promise<void> {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User ${userId} not found`);

    const targetChannelUserId = user.channels.get(toChannel);
    if (!targetChannelUserId) {
      throw new Error(`User ${userId} not linked on channel ${toChannel}`);
    }

    await this.sendToChannel(toChannel, targetChannelUserId, content);
  }

  // ─── User Identity Resolution ────────────────────────────────────

  private resolveUser(channelType: ChannelType, channelUserId: string): UserIdentity {
    // Look for existing user with this channel identity
    for (const user of this.users.values()) {
      if (user.channels.get(channelType) === channelUserId) {
        return user;
      }
    }

    // Create new user
    const user: UserIdentity = {
      id: uuid(),
      displayName: `User-${channelUserId.slice(-4)}`,
      channels: new Map([[channelType, channelUserId]]),
      roles: ["user"],
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  /**
   * Link multiple channel identities to the same user.
   * Enables cross-channel session continuity.
   */
  linkUserChannel(userId: string, channelType: ChannelType, channelUserId: string): void {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User ${userId} not found`);
    user.channels.set(channelType, channelUserId);
    log.info(`Linked ${channelType}:${channelUserId} to user ${userId}`);
  }

  // ─── Session Management ──────────────────────────────────────────

  private getOrCreateSession(user: UserIdentity, channelType: ChannelType): Session {
    // Look for an active session for this user (cross-channel continuity)
    for (const session of this.sessions.values()) {
      if (session.userId === user.id) {
        const ageMs = Date.now() - session.updatedAt.getTime();
        if (ageMs < 30 * 60 * 1000) {
          // 30-minute session window
          return session;
        }
      }
    }

    const session: Session = {
      id: uuid(),
      userId: user.id,
      channelType,
      channelSessionId: uuid(),
      messages: [],
      activeSkills: [],
      memoryContext: {
        shortTerm: [],
        longTerm: [],
        facts: [],
        relevanceScore: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
    };

    this.sessions.set(session.id, session);
    this.emitEvent({ type: "session.created", data: { sessionId: session.id, userId: user.id } });
    return session;
  }

  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  // ─── Lifecycle ───────────────────────────────────────────────────

  async start(): Promise<void> {
    if (this.isRunning) return;
    log.info("Arivumaiyam AI Gateway starting...");

    await this.memoryStore.initialize();

    for (const [type, adapter] of this.channels) {
      log.info(`  Channel ${type}: ${adapter.getStatus().connected ? "connected" : "pending"}`);
    }

    this.isRunning = true;
    log.info("Arivumaiyam AI Gateway is running 🦀");
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) return;
    log.info("Arivumaiyam AI Gateway shutting down...");

    // Graceful shutdown: drain active sessions
    for (const [type, adapter] of this.channels) {
      try {
        await adapter.shutdown();
        log.info(`  Channel ${type}: disconnected`);
      } catch (error) {
        log.error(`  Error shutting down channel ${type}: ${error}`);
      }
    }

    await this.memoryStore.shutdown();
    this.channels.clear();
    this.isRunning = false;
    log.info("Arivumaiyam AI Gateway stopped");
  }

  // ─── Health ──────────────────────────────────────────────────────

  getHealth(): {
    running: boolean;
    channels: { type: ChannelType; connected: boolean }[];
    activeSessions: number;
    totalUsers: number;
  } {
    return {
      running: this.isRunning,
      channels: Array.from(this.channels.entries()).map(([type, adapter]) => ({
        type,
        connected: adapter.getStatus().connected,
      })),
      activeSessions: this.sessions.size,
      totalUsers: this.users.size,
    };
  }

  private emitEvent(event: ArivumaiyamEvent): void {
    this.emit(event.type, event.data);
  }
}
