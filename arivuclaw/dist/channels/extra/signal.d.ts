/**
 * ArivuClaw Signal Channel — Signal messenger adapter via signal-cli.
 *
 * Uses the signal-cli daemon (JSON-RPC mode) for sending/receiving messages
 * over the Signal Protocol. Supports text, images, and file attachments.
 */
import { BaseChannel } from "../base";
import type { Attachment, ChannelConfig, ChannelType } from "../../core/types";
export interface SignalConfig {
    /** Path to the signal-cli binary */
    signalCliBin: string;
    /** Registered phone number (e.g., "+1234567890") */
    phoneNumber: string;
    /** Path to signal-cli data directory */
    dataDir?: string;
    /** Poll interval in milliseconds for incoming messages */
    pollIntervalMs?: number;
}
export declare class SignalChannel extends BaseChannel {
    readonly type: ChannelType;
    readonly name = "Signal";
    private signalConfig;
    private pollTimer?;
    private daemonProcess?;
    private receivingMessages;
    initialize(config: ChannelConfig): Promise<void>;
    protected connect(): Promise<void>;
    protected disconnect(): Promise<void>;
    protected doSendMessage(channelUserId: string, content: string, attachments?: Attachment[]): Promise<void>;
    private startDaemon;
    private handleDaemonMessage;
    private startPolling;
    private buildBaseArgs;
    private convertAttachments;
    private getAttachmentType;
    private prepareAttachments;
}
//# sourceMappingURL=signal.d.ts.map