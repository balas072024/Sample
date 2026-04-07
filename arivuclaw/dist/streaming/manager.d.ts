/**
 * ArivuClaw Streaming Response Manager
 *
 * Wraps LLM streaming and pushes tokens to channels in real-time.
 * Manages backpressure and token buffering to avoid flooding channels
 * with individual tokens — batches into chunks of approximately 5 words
 * before dispatching.
 *
 * @module streaming/manager
 */
import type { ChannelAdapter, LLMProvider, LLMRequest } from "../core/types";
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
export declare class StreamingManager {
    private readonly log;
    private readonly defaultBufferOptions;
    /** Number of streams currently active. */
    private activeStreams;
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
    streamToChannel(provider: LLMProvider, request: LLMRequest, channelAdapter: ChannelAdapter, userId: string, options?: Partial<StreamBufferOptions>): Promise<StreamResult>;
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
    streamWithCallback(provider: LLMProvider, request: LLMRequest, onToken: OnTokenCallback, onComplete: OnCompleteCallback, onError: OnErrorCallback, options?: Partial<StreamBufferOptions>): Promise<StreamResult>;
    /**
     * Get the number of currently active streams.
     */
    getActiveStreamCount(): number;
}
//# sourceMappingURL=manager.d.ts.map