/**
 * Arivumaiyam AI Channel Streamer — Push streaming tokens to specific channel types.
 *
 * Each channel type has its own buffering strategy:
 * - WhatsApp/Telegram: batch tokens into sentence-sized chunks
 * - CLI: stream character-by-character
 * - Web: send via WebSocket frames
 * - Discord/Slack: edit a single message progressively
 */

import { Logger } from "../utils/logger";

const log = Logger.create("channel-streamer");

// ─── Types ───────────────────────────────────────────────────────────

export interface StreamTarget {
  channelType: string;
  channelUserId: string;
  sessionId: string;
  metadata?: Record<string, unknown>;
}

export interface StreamOptions {
  typingIndicator?: boolean;
  maxChunkSize?: number;
  flushIntervalMs?: number;
}

export interface WebSocketSink {
  send(data: string): void;
  readyState: number;
}

export interface ChannelSendFn {
  (userId: string, content: string): Promise<void>;
}

type FlushCallback = () => void;

// ─── Buffer ──────────────────────────────────────────────────────────

class TokenBuffer {
  private buffer = "";
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly threshold: number,
    private readonly intervalMs: number,
    private readonly onFlush: (text: string) => Promise<void>,
  ) {}

  append(token: string): void {
    this.buffer += token;

    if (this.buffer.length >= this.threshold || this.hitsSentenceBoundary()) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.intervalMs);
    }
  }

  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.buffer.length === 0) return;

    const text = this.buffer;
    this.buffer = "";

    try {
      await this.onFlush(text);
    } catch (err) {
      log.error("Flush failed", { error: String(err) });
    }
  }

  private hitsSentenceBoundary(): boolean {
    return /[.!?\n]\s*$/.test(this.buffer);
  }

  get pending(): string {
    return this.buffer;
  }
}

// ─── ChannelStreamer ─────────────────────────────────────────────────

export class ChannelStreamer {
  private activeStreams: Map<string, { buffer: TokenBuffer; accumulated: string }> = new Map();

  /**
   * Stream tokens to WhatsApp.
   * Batches into larger chunks (~200 chars) to avoid rate limits.
   */
  async streamToWhatsApp(
    userId: string,
    tokenStream: AsyncIterable<string>,
    send: ChannelSendFn,
    options: StreamOptions = {},
  ): Promise<string> {
    const streamKey = `whatsapp:${userId}`;
    log.debug("Starting WhatsApp stream", { userId });

    if (options.typingIndicator) {
      await this.sendTypingIndicator("whatsapp", userId, send);
    }

    let accumulated = "";
    const buffer = new TokenBuffer(
      options.maxChunkSize ?? 200,
      options.flushIntervalMs ?? 2000,
      async (text) => {
        accumulated += text;
        await send(userId, accumulated);
      },
    );
    this.activeStreams.set(streamKey, { buffer, accumulated: "" });

    try {
      for await (const token of tokenStream) {
        buffer.append(token);
      }
      await buffer.flush();
    } finally {
      this.activeStreams.delete(streamKey);
    }

    log.debug("WhatsApp stream complete", { userId, length: accumulated.length });
    return accumulated;
  }

  /**
   * Stream tokens to Telegram.
   * Edits a single message progressively in ~150 char batches.
   */
  async streamToTelegram(
    userId: string,
    tokenStream: AsyncIterable<string>,
    send: ChannelSendFn,
    editMessage: (userId: string, messageId: string, content: string) => Promise<void>,
    options: StreamOptions = {},
  ): Promise<string> {
    const streamKey = `telegram:${userId}`;
    log.debug("Starting Telegram stream", { userId });

    if (options.typingIndicator) {
      await this.sendTypingIndicator("telegram", userId, send);
    }

    // Send initial placeholder
    let accumulated = "";
    let messageId: string | null = null;

    const buffer = new TokenBuffer(
      options.maxChunkSize ?? 150,
      options.flushIntervalMs ?? 1500,
      async (text) => {
        accumulated += text;
        if (!messageId) {
          // First chunk — send a new message; store the ID for edits
          await send(userId, accumulated);
          messageId = `pending-${Date.now()}`;
        } else {
          await editMessage(userId, messageId, accumulated);
        }
      },
    );
    this.activeStreams.set(streamKey, { buffer, accumulated: "" });

    try {
      for await (const token of tokenStream) {
        buffer.append(token);
      }
      await buffer.flush();
    } finally {
      this.activeStreams.delete(streamKey);
    }

    log.debug("Telegram stream complete", { userId, length: accumulated.length });
    return accumulated;
  }

  /**
   * Stream tokens to Discord.
   * Edits a single message progressively in ~100 char batches.
   */
  async streamToDiscord(
    userId: string,
    tokenStream: AsyncIterable<string>,
    send: ChannelSendFn,
    editMessage: (userId: string, messageId: string, content: string) => Promise<void>,
    options: StreamOptions = {},
  ): Promise<string> {
    const streamKey = `discord:${userId}`;
    log.debug("Starting Discord stream", { userId });

    if (options.typingIndicator) {
      await this.sendTypingIndicator("discord", userId, send);
    }

    let accumulated = "";
    let messageId: string | null = null;

    const buffer = new TokenBuffer(
      options.maxChunkSize ?? 100,
      options.flushIntervalMs ?? 1000,
      async (text) => {
        accumulated += text;
        if (!messageId) {
          await send(userId, accumulated);
          messageId = `pending-${Date.now()}`;
        } else {
          await editMessage(userId, messageId, accumulated);
        }
      },
    );
    this.activeStreams.set(streamKey, { buffer, accumulated: "" });

    try {
      for await (const token of tokenStream) {
        buffer.append(token);
      }
      await buffer.flush();
    } finally {
      this.activeStreams.delete(streamKey);
    }

    log.debug("Discord stream complete", { userId, length: accumulated.length });
    return accumulated;
  }

  /**
   * Stream tokens to Slack.
   * Updates a single message via chat.update in ~120 char batches.
   */
  async streamToSlack(
    userId: string,
    tokenStream: AsyncIterable<string>,
    send: ChannelSendFn,
    updateMessage: (userId: string, ts: string, content: string) => Promise<void>,
    options: StreamOptions = {},
  ): Promise<string> {
    const streamKey = `slack:${userId}`;
    log.debug("Starting Slack stream", { userId });

    if (options.typingIndicator) {
      await this.sendTypingIndicator("slack", userId, send);
    }

    let accumulated = "";
    let messageTs: string | null = null;

    const buffer = new TokenBuffer(
      options.maxChunkSize ?? 120,
      options.flushIntervalMs ?? 1200,
      async (text) => {
        accumulated += text;
        if (!messageTs) {
          await send(userId, accumulated);
          messageTs = `pending-${Date.now()}`;
        } else {
          await updateMessage(userId, messageTs, accumulated);
        }
      },
    );
    this.activeStreams.set(streamKey, { buffer, accumulated: "" });

    try {
      for await (const token of tokenStream) {
        buffer.append(token);
      }
      await buffer.flush();
    } finally {
      this.activeStreams.delete(streamKey);
    }

    log.debug("Slack stream complete", { userId, length: accumulated.length });
    return accumulated;
  }

  /**
   * Stream tokens to Web via WebSocket.
   * Sends each token as an individual WebSocket frame for low latency.
   */
  async streamToWeb(
    socket: WebSocketSink,
    sessionId: string,
    tokenStream: AsyncIterable<string>,
    options: StreamOptions = {},
  ): Promise<string> {
    const streamKey = `web:${sessionId}`;
    log.debug("Starting Web stream", { sessionId });

    const OPEN = 1; // WebSocket.OPEN

    if (options.typingIndicator && socket.readyState === OPEN) {
      socket.send(JSON.stringify({ type: "typing", sessionId }));
    }

    let accumulated = "";

    // For web, stream each token immediately as a frame
    const buffer = new TokenBuffer(
      options.maxChunkSize ?? 1, // stream each token individually
      options.flushIntervalMs ?? 50,
      async (text) => {
        accumulated += text;
        if (socket.readyState === OPEN) {
          socket.send(JSON.stringify({
            type: "token",
            sessionId,
            token: text,
            accumulated,
          }));
        }
      },
    );
    this.activeStreams.set(streamKey, { buffer, accumulated: "" });

    try {
      for await (const token of tokenStream) {
        buffer.append(token);
      }
      await buffer.flush();

      // Send completion frame
      if (socket.readyState === OPEN) {
        socket.send(JSON.stringify({
          type: "done",
          sessionId,
          content: accumulated,
        }));
      }
    } finally {
      this.activeStreams.delete(streamKey);
    }

    log.debug("Web stream complete", { sessionId, length: accumulated.length });
    return accumulated;
  }

  /**
   * Stream tokens to CLI.
   * Writes character-by-character to stdout for a typewriter effect.
   */
  async streamToCLI(
    tokenStream: AsyncIterable<string>,
    writer: { write(s: string): boolean } = process.stdout,
    options: StreamOptions = {},
  ): Promise<string> {
    const streamKey = `cli:${Date.now()}`;
    log.debug("Starting CLI stream");

    let accumulated = "";

    // CLI streams character-by-character, no buffering needed
    const buffer = new TokenBuffer(
      1, // flush every character
      options.flushIntervalMs ?? 0,
      async (text) => {
        accumulated += text;
        writer.write(text);
      },
    );
    this.activeStreams.set(streamKey, { buffer, accumulated: "" });

    try {
      for await (const token of tokenStream) {
        buffer.append(token);
      }
      await buffer.flush();

      // Trailing newline
      writer.write("\n");
    } finally {
      this.activeStreams.delete(streamKey);
    }

    log.debug("CLI stream complete", { length: accumulated.length });
    return accumulated;
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private async sendTypingIndicator(
    _channel: string,
    _userId: string,
    _send: ChannelSendFn,
  ): Promise<void> {
    // Typing indicators are channel-specific; the actual implementation
    // is handled by the channel adapter. This is a no-op placeholder that
    // subclasses or callers can override by providing a custom send function.
    log.debug("Typing indicator requested", { channel: _channel, userId: _userId });
  }

  /**
   * Cancel an in-progress stream.
   */
  cancel(streamKey: string): void {
    const stream = this.activeStreams.get(streamKey);
    if (stream) {
      stream.buffer.flush().catch(() => {});
      this.activeStreams.delete(streamKey);
      log.info("Stream cancelled", { streamKey });
    }
  }

  /**
   * Returns the number of currently active streams.
   */
  get activeStreamCount(): number {
    return this.activeStreams.size;
  }
}
