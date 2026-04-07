/**
 * ArivuClaw WhatsApp Channel — Via Baileys (WhatsApp Web protocol).
 * Full media support: text, images, voice notes, video, audio, documents.
 */
import type { Attachment, ChannelType } from "../core/types";
import { BaseChannel } from "./base";
export declare class WhatsAppChannel extends BaseChannel {
    readonly type: ChannelType;
    readonly name = "WhatsApp (Baileys)";
    private client;
    protected connect(): Promise<void>;
    private _downloadMedia;
    protected disconnect(): Promise<void>;
    protected doSendMessage(channelUserId: string, content: string, attachments?: Attachment[]): Promise<void>;
    private parseMessage;
    private extractAttachments;
    private downloadWhatsAppMedia;
    private extractText;
}
//# sourceMappingURL=whatsapp.d.ts.map