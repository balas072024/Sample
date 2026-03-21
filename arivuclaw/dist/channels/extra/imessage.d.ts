/**
 * ArivuClaw iMessage Channel — macOS-only iMessage adapter.
 *
 * Reads incoming messages from the iMessage SQLite database (chat.db)
 * and sends outgoing messages via AppleScript / osascript.
 * Only functional on macOS with iMessage configured.
 */
import { BaseChannel } from "../base";
import type { Attachment, ChannelConfig, ChannelType } from "../../core/types";
export interface iMessageConfig {
    /** Path to iMessage chat database (defaults to ~/Library/Messages/chat.db) */
    chatDbPath?: string;
    /** Poll interval in milliseconds */
    pollIntervalMs?: number;
    /** Only process messages from these phone numbers / Apple IDs */
    allowedSenders?: string[];
}
export declare class iMessageChannel extends BaseChannel {
    readonly type: ChannelType;
    readonly name = "iMessage";
    private imConfig;
    private chatDbPath;
    private pollTimer?;
    private lastProcessedRowId;
    initialize(config: ChannelConfig): Promise<void>;
    protected connect(): Promise<void>;
    protected disconnect(): Promise<void>;
    protected doSendMessage(channelUserId: string, content: string, attachments?: Attachment[]): Promise<void>;
    private sendViaAppleScript;
    private sendFileViaAppleScript;
    private startPolling;
    private pollNewMessages;
    private fetchAttachments;
    private getLatestRowId;
    private convertCoreDataTimestamp;
    private getAttachmentType;
    private writeTempFile;
}
//# sourceMappingURL=imessage.d.ts.map