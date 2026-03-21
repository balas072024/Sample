/**
 * ArivuClaw Telegram Channel — Via grammY bot framework.
 *
 * Full feature parity with OpenClaw:
 * - All media types: photos, voice, video, video notes, audio, stickers,
 *   animations/GIFs, documents, contacts, locations
 * - Reply threading (reply_to_message_id)
 * - Inline buttons and callback query handling
 * - Sticker vision cache (avoids repeated LLM calls for same sticker)
 * - Markdown → HTML conversion for Telegram output
 * - Group and forum topic support (message_thread_id)
 * - Link preview control
 */
import type { Attachment, ChannelType } from "../core/types";
import { BaseChannel } from "./base";
export declare class TelegramChannel extends BaseChannel {
    readonly type: ChannelType;
    readonly name = "Telegram (grammY)";
    private bot;
    private botToken;
    /** Sticker vision cache: file_unique_id → description (avoids repeat LLM calls) */
    private stickerCache;
    private static readonly STICKER_CACHE_MAX;
    /** Track last sent message ID per chat for reply threading */
    private lastBotMessageId;
    private downloadTelegramFile;
    private emitMediaMessage;
    private emitTextMessage;
    protected connect(): Promise<void>;
    cacheStickerDescription(uniqueId: string, description: string): void;
    protected disconnect(): Promise<void>;
    protected doSendMessage(channelUserId: string, content: string, attachments?: Attachment[], metadata?: Record<string, unknown>): Promise<void>;
}
//# sourceMappingURL=telegram.d.ts.map