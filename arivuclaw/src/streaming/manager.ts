/**
 * Arivumaiyam AI Streaming Response Manager
 *
 * Wraps LLM streaming and pushes tokens to channels in real-time.
 * Manages backpressure and token buffering to avoid flooding channels
 * with individual tokens — batches into chunks of approximately 5 words
 * before dispatching.
 *
 * @module streaming/manager
 */

import type {
  ChannelAdapter,
  LLMProvider,
  LLMRequest,
  LLMStreamChunk,
} from "../core/types";
import { Logger } from "../utils/logger";

// ─── Types ───────────────────────────────────────────────────────────

/** Callback invoked for each buffered token chunk. */
export type OnTokenCallback = (chunk: string) => void | Promise<void>;

/** Callback invoked when streaming completes with the full response. */
export type OnCompleteCallback = (fullText: string) => void | Promise<void>;

/** Callback invoked when a streaming error occurs. */
export type OnErrorCallback = (error: Error) => void | Promise<void>;

/** Options for controlling stream buffering behaviour. */
export interface StreamBufferOptions {
  /** Approximate number of words to buffer before flushing (default: 5). */
  wordBatchSize: number;
  /** Maximum milliseconds to wait before flushing a partial buffer (default: 300). */
  flushIntervalMs: number;
}

/** Result returned after a stream completes. */
export interface StreamResult {
  /** The full concatenated text from the stream. */
  fullText: string;
  /** Total number of chunks dispatched to the consumer. */
  chunksDispatched: number;
  /** Total wall-clock duration of the stream in milliseconds. */
  durationMs: number;
}

// ─── Token Buffer ────────────────────────────────────────────────────

/**
 * Accumulates streamed tokens and flushes them in word-sized batches
 * to avoid spamming downstream consumers with single-character updates.
 */
class TokenBuffer {
  private buffer = "";
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly onFlush: (chunk: string) => Promise<void>;
  private readonly options: StreamBufferOptions;

  constructor(
    onFlush: (chunk: string) => Promise<void>,
    options: StreamBufferOptions,
  ) {
    this.onFlush = onFlush;
    this.options = options;
  }

  /**
   * Append text to the buffer and flush if the word threshold is reached.
   *
   * @param text - Incoming token text.
   */
  async append(text: string): Promise<void> {
    this.buffer += text;

    const wordCount = this.buffer.trim().split(/\s+/).length;
    if (wordCount >= this.options.wordBatchSize) {
      await this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  /**
   * Flush any remaining buffered text immediately.
   */
  async flush(): Promise<void> {
    this.cancelScheduledFlush();
    if (this.buffer.length === 0) return;

    const chunk = this.buffer;
    this.buffer = "";
    await this.onFlush(chunk);
  }

  /** Schedule a timed flush for partial buffers. */
  private scheduleFlush(): void {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flush();
    }, this.options.flushIntervalMs);
  }

  /** Cancel any pending timed flush. */
  private cancelScheduledFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

// ─── Streaming Manager ───────────────────────────────────────────────

/**
 * Manages streaming LLM responses and dispatching token chunks to
 * channel adapters or arbitrary callbacks.
 *
 * @example
 * ```ts
 * const manager = new StreamingManager();
 * const result = await manager.streamToChannel(provider, request, channel, userId);
 * console.log(`Streamed ${result.chunksDispatched} chunks in ${result.durationMs}ms`);
 * ```
 */
export class StreamingManager {
  private readonly log = Logger.create("StreamingManager");
  private readonly defaultBufferOptions: StreamBufferOptions = {
    wordBatchSize: 5,
    flushIntervalMs: 300,
  };

  /** Number of streams currently active. */
  private activeStreams = 0;

  /**
   * Stream an LLM response directly to a channel adapter.
   *
   * Tokens are buffered and sent as chunks of ~5 words to the channel
   * to avoid overwhelming the user with rapid, tiny messages.
   *
   * @param provider - The LLM provider to stream from.
   * @param request - The LLM request to send.
   * @param channelAdapter - The channel adapter to push chunks to.
   * @param userId - The channel user ID to send messages to.
   * @param options - Optional buffer tuning parameters.
   * @returns A StreamResult with the full response and statistics.
   */
  async streamToChannel(
    provider: LLMProvider,
    request: LLMRequest,
    channelAdapter: ChannelAdapter,
    userId: string,
    options?: Partial<StreamBufferOptions>,
  ): Promise<StreamResult> {
    this.log.info(
      `Starting stream to channel ${channelAdapter.type} for user ${userId}`,
    );

    const bufferOptions: StreamBufferOptions = {
      ...this.defaultBufferOptions,
      ...options,
    };

    let chunksDispatched = 0;

    const result = await this.streamWithCallback(
      provider,
      request,
      async (chunk: string) => {
        await channelAdapter.sendMessage(userId, chunk);
        chunksDispatched++;
      },
      async (fullText: string) => {
        this.log.debug(
          `Stream to channel ${channelAdapter.type} completed (${fullText.length} chars)`,
        );
      },
      async (error: Error) => {
        this.log.error(
          `Stream error on channel ${channelAdapter.type}: ${error.message}`,
        );
        await channelAdapter.sendMessage(
          userId,
          "[Streaming error — response may be incomplete]",
        );
      },
      bufferOptions,
    );

    return { ...result, chunksDispatched };
  }

  /**
   * Stream an LLM response with custom callbacks for tokens, completion, and errors.
   *
   * @param provider - The LLM provider to stream from.
   * @param request - The LLM request to send.
   * @param onToken - Callback invoked for each buffered token chunk.
   * @param onComplete - Callback invoked when the stream finishes.
   * @param onError - Callback invoked if a streaming error occurs.
   * @param options - Optional buffer tuning parameters.
   * @returns A StreamResult with the full response and statistics.
   */
  async streamWithCallback(
    provider: LLMProvider,
    request: LLMRequest,
    onToken: OnTokenCallback,
    onComplete: OnCompleteCallback,
    onError: OnErrorCallback,
    options?: Partial<StreamBufferOptions>,
  ): Promise<StreamResult> {
    const bufferOptions: StreamBufferOptions = {
      ...this.defaultBufferOptions,
      ...options,
    };

    const startTime = Date.now();
    let fullText = "";
    let chunksDispatched = 0;

    const buffer = new TokenBuffer(async (chunk: string) => {
      chunksDispatched++;
      await onToken(chunk);
    }, bufferOptions);

    this.activeStreams++;
    this.log.debug(
      `Active streams: ${this.activeStreams} (provider: ${provider.name})`,
    );

    try {
      const stream: AsyncGenerator<LLMStreamChunk> =
        provider.streamChat(request);

      for await (const chunk of stream) {
        if (chunk.type === "text" && chunk.text) {
          fullText += chunk.text;
          await buffer.append(chunk.text);
        }

        if (chunk.type === "done") {
          break;
        }
      }

      // Flush any remaining tokens in the buffer
      await buffer.flush();

      await onComplete(fullText);

      const durationMs = Date.now() - startTime;
      this.log.info(
        `Stream completed: ${fullText.length} chars, ${chunksDispatched} chunks, ${durationMs}ms`,
      );

      return { fullText, chunksDispatched, durationMs };
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error(String(error));

      // Flush whatever we have so the user sees partial output
      await buffer.flush();

      await onError(err);

      const durationMs = Date.now() - startTime;
      return { fullText, chunksDispatched, durationMs };
    } finally {
      this.activeStreams--;
    }
  }

  /**
   * Get the number of currently active streams.
   */
  getActiveStreamCount(): number {
    return this.activeStreams;
  }
}
