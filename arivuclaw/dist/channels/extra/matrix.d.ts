/**
 * ArivuClaw Matrix Channel — Matrix protocol adapter.
 *
 * Uses matrix-js-sdk for communication over the Matrix open protocol.
 * Supports end-to-end encryption, rooms, and threads.
 */
import { BaseChannel } from "../base";
import type { Attachment, ChannelConfig, ChannelType } from "../../core/types";
export interface MatrixConfig {
    /** Matrix homeserver URL (e.g., "https://matrix.org") */
    homeserverUrl: string;
    /** Bot user ID (e.g., "@arivuclaw:matrix.org") */
    userId: string;
    /** Access token for authentication */
    accessToken: string;
    /** Device ID for E2E encryption */
    deviceId?: string;
    /** Enable end-to-end encryption */
    enableEncryption?: boolean;
    /** Path to store encryption keys */
    cryptoStorePath?: string;
    /** Auto-join rooms when invited */
    autoJoinRooms?: boolean;
    /** Only respond in these rooms (empty = all rooms) */
    allowedRoomIds?: string[];
}
export declare class MatrixChannel extends BaseChannel {
    readonly type: ChannelType;
    readonly name = "Matrix";
    private matrixConfig;
    private client;
    private roomUserMap;
    initialize(config: ChannelConfig): Promise<void>;
    protected connect(): Promise<void>;
    protected disconnect(): Promise<void>;
    protected doSendMessage(channelUserId: string, content: string, attachments?: Attachment[]): Promise<void>;
    /**
     * Send a reply in a Matrix thread.
     */
    sendThreadReply(roomId: string, threadRootEventId: string, content: string): Promise<string>;
    private initializeEncryption;
    private registerEventHandlers;
    private handleTimelineEvent;
    private sendAttachment;
    private extractAttachments;
    private getMsgType;
    private matrixMsgTypeToAttType;
    private markdownToHtml;
}
//# sourceMappingURL=matrix.d.ts.map