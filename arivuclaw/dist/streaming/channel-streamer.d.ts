/**
 * ArivuClaw Channel Streamer — Push streaming tokens to specific channel types.
 *
 * Each channel type has its own buffering strategy:
 * - WhatsApp/Telegram: batch tokens into sentence-sized chunks
 * - CLI: stream character-by-character
 * - Web: send via WebSocket frames
 * - Discord/Slack: edit a single message progressively
 */
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
export declare class ChannelStreamer {
    private activeStreams;
    /**
     * Stream tokens to WhatsApp.
     * Batches into larger chunks (~200 chars) to avoid rate limits.
     */
    streamToWhatsApp(userId: string, tokenStream: AsyncIterable<string>, send: ChannelSendFn, options?: StreamOptions): Promise<string>;
    /**
     * Stream tokens to Telegram.
     * Edits a single message progressively in ~150 char batches.
     */
    streamToTelegram(userId: string, tokenStream: AsyncIterable<string>, send: ChannelSendFn, editMessage: (userId: string, messageId: string, content: string) => Promise<void>, options?: StreamOptions): Promise<string>;
    /**
     * Stream tokens to Discord.
     * Edits a single message progressively in ~100 char batches.
     */
    streamToDiscord(userId: string, tokenStream: AsyncIterable<string>, send: ChannelSendFn, editMessage: (userId: string, messageId: string, content: string) => Promise<void>, options?: StreamOptions): Promise<string>;
    /**
     * Stream tokens to Slack.
     * Updates a single message via chat.update in ~120 char batches.
     */
    streamToSlack(userId: string, tokenStream: AsyncIterable<string>, send: ChannelSendFn, updateMessage: (userId: string, ts: string, content: string) => Promise<void>, options?: StreamOptions): Promise<string>;
    /**
     * Stream tokens to Web via WebSocket.
     * Sends each token as an individual WebSocket frame for low latency.
     */
    streamToWeb(socket: WebSocketSink, sessionId: string, tokenStream: AsyncIterable<string>, options?: StreamOptions): Promise<string>;
    /**
     * Stream tokens to CLI.
     * Writes character-by-character to stdout for a typewriter effect.
     */
    streamToCLI(tokenStream: AsyncIterable<string>, writer?: {
        write(s: string): boolean;
    }, options?: StreamOptions): Promise<string>;
    private sendTypingIndicator;
    /**
     * Cancel an in-progress stream.
     */
    cancel(streamKey: string): void;
    /**
     * Returns the number of currently active streams.
     */
    get activeStreamCount(): number;
}
//# sourceMappingURL=channel-streamer.d.ts.map