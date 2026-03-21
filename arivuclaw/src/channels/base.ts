/**
 * ArivuClaw Base Channel Adapter — Abstract base for all channel implementations.
 *
 * Provides common functionality:
 * - Connection state management
 * - Message queue for offline buffering
 * - Reconnection logic with exponential backoff
 * - Unified logging
 */

import type {
  Attachment,
  ChannelAdapter,
  ChannelConfig,
  ChannelStatus,
  ChannelType,
  IncomingMessage,
} from "../core/types.js";
import { Logger } from "../utils/logger.js";

export abstract class BaseChannel implements ChannelAdapter {
  abstract readonly type: ChannelType;
  abstract readonly name: string;

  protected config!: ChannelConfig;
  protected connected = false;
  protected messageHandler?: (msg: IncomingMessage) => Promise<void>;
  protected messageQueue: { userId: string; content: string; attachments?: Attachment[] }[] = [];
  protected log: ReturnType<typeof Logger.create>;

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.log = Logger.create(`channel:${this.constructor.name}`);
  }

  async initialize(config: ChannelConfig): Promise<void> {
    this.config = config;
    this.log.info(`Initializing ${this.name} channel...`);

    try {
      await this.connect();
      this.connected = true;
      this.reconnectAttempts = 0;
      this.log.info(`${this.name} channel connected`);

      // Flush queued messages
      await this.flushQueue();
    } catch (error) {
      this.log.error(`Failed to initialize ${this.name}: ${error}`);
      this.scheduleReconnect();
    }
  }

  async shutdown(): Promise<void> {
    this.log.info(`Shutting down ${this.name} channel...`);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    await this.disconnect();
    this.connected = false;
  }

  onMessage(handler: (msg: IncomingMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async sendMessage(channelUserId: string, content: string, attachments?: Attachment[]): Promise<void> {
    if (!this.connected) {
      this.messageQueue.push({ userId: channelUserId, content, attachments });
      this.log.warn(`${this.name} not connected, message queued`);
      return;
    }

    await this.doSendMessage(channelUserId, content, attachments);
  }

  getStatus(): ChannelStatus {
    return {
      type: this.type,
      connected: this.connected,
      lastActivity: undefined,
    };
  }

  // ─── Abstract methods for subclasses ─────────────────────────────

  protected abstract connect(): Promise<void>;
  protected abstract disconnect(): Promise<void>;
  protected abstract doSendMessage(
    channelUserId: string,
    content: string,
    attachments?: Attachment[],
  ): Promise<void>;

  // ─── Helpers ─────────────────────────────────────────────────────

  protected async emitMessage(msg: IncomingMessage): Promise<void> {
    if (this.messageHandler) {
      await this.messageHandler(msg);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log.error(`Max reconnect attempts reached for ${this.name}`);
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30_000);
    this.reconnectAttempts++;

    this.log.info(`Reconnecting ${this.name} in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        this.connected = true;
        this.reconnectAttempts = 0;
        await this.flushQueue();
      } catch {
        this.scheduleReconnect();
      }
    }, delay);
  }

  private async flushQueue(): Promise<void> {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift()!;
      try {
        await this.doSendMessage(msg.userId, msg.content, msg.attachments);
      } catch (error) {
        this.log.error(`Failed to flush queued message: ${error}`);
        this.messageQueue.unshift(msg);
        break;
      }
    }
  }
}
