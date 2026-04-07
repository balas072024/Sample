/**
 * ArivuClaw Base Channel Adapter — Abstract base for all channel implementations.
 *
 * Provides common functionality:
 * - Connection state management
 * - Message queue for offline buffering
 * - Reconnection logic with exponential backoff
 * - Unified logging
 */
import type { Attachment, ChannelAdapter, ChannelConfig, ChannelStatus, ChannelType, IncomingMessage } from "../core/types";
import { Logger } from "../utils/logger";
export declare abstract class BaseChannel implements ChannelAdapter {
    abstract readonly type: ChannelType;
    abstract readonly name: string;
    protected config: ChannelConfig;
    protected connected: boolean;
    protected messageHandler?: (msg: IncomingMessage) => Promise<void>;
    protected messageQueue: {
        userId: string;
        content: string;
        attachments?: Attachment[];
    }[];
    protected log: ReturnType<typeof Logger.create>;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectTimer?;
    constructor();
    initialize(config: ChannelConfig): Promise<void>;
    shutdown(): Promise<void>;
    onMessage(handler: (msg: IncomingMessage) => Promise<void>): void;
    sendMessage(channelUserId: string, content: string, attachments?: Attachment[]): Promise<void>;
    getStatus(): ChannelStatus;
    protected abstract connect(): Promise<void>;
    protected abstract disconnect(): Promise<void>;
    protected abstract doSendMessage(channelUserId: string, content: string, attachments?: Attachment[]): Promise<void>;
    protected emitMessage(msg: IncomingMessage): Promise<void>;
    private scheduleReconnect;
    private flushQueue;
}
//# sourceMappingURL=base.d.ts.map