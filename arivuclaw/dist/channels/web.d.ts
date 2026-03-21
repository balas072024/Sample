/**
 * ArivuClaw Web Channel — WebSocket-based web UI and API.
 *
 * Provides:
 * - WebSocket gateway for real-time chat
 * - REST API for integration
 * - Health check endpoint
 * - Static file serving for built-in web UI
 */
import type { Attachment, ChannelType } from "../core/types";
import { BaseChannel } from "./base";
export declare class WebChannel extends BaseChannel {
    readonly type: ChannelType;
    readonly name = "Web (WebSocket + REST)";
    private server;
    private wss;
    private clients;
    protected connect(): Promise<void>;
    protected disconnect(): Promise<void>;
    protected doSendMessage(channelUserId: string, content: string, attachments?: Attachment[]): Promise<void>;
    private isAllowedOrigin;
}
//# sourceMappingURL=web.d.ts.map