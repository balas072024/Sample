/**
 * ArivuClaw WhatsApp Channel — Via Baileys (WhatsApp Web protocol).
 * Full media support: text, images, voice notes, video, audio, documents.
 */

import { v4 as uuid } from "uuid";
import type { Attachment, ChannelType, IncomingMessage } from "../core/types";
import { BaseChannel } from "./base";

export class WhatsAppChannel extends BaseChannel {
  readonly type: ChannelType = "whatsapp";
  readonly name = "WhatsApp (Baileys)";

  private client: any = null;

  protected async connect(): Promise<void> {
    this.log.info("Connecting to WhatsApp Web...");

    const { default: makeWASocket, useMultiFileAuthState, downloadMediaMessage } = await import("baileys") as any;
    const { state, saveCreds } = await useMultiFileAuthState("./auth/whatsapp");
    this.client = makeWASocket({ auth: state, printQRInTerminal: true });
    this.client.ev.on("creds.update", saveCreds);

    // Store downloadMediaMessage for use in parseMessage
    this._downloadMedia = downloadMediaMessage;

    // Register message listener
    this.client.ev.on("messages.upsert", async ({ messages }: any) => {
      for (const msg of messages) {
        if (!msg.key.fromMe && msg.message) {
          await this.emitMessage(await this.parseMessage(msg));
        }
      }
    });

    this.log.info("WhatsApp channel ready (pair via QR code)");
  }

  private _downloadMedia: any = null;

  protected async disconnect(): Promise<void> {
    if (this.client) {
      this.client.end();
    }
    this.client = null;
  }

  protected async doSendMessage(
    channelUserId: string,
    content: string,
    attachments?: Attachment[],
  ): Promise<void> {
    if (!this.client) throw new Error("WhatsApp not connected");

    await this.client.sendMessage(channelUserId, { text: content });

    if (attachments) {
      for (const attachment of attachments) {
        await this.client.sendMessage(channelUserId, {
          [attachment.type]: attachment.data || { url: attachment.url },
          mimetype: attachment.mimeType,
          fileName: attachment.filename,
        });
      }
    }

    this.log.info(`Sent message to WhatsApp user ${channelUserId}`);
  }

  private async parseMessage(raw: unknown): Promise<IncomingMessage> {
    const msg = raw as Record<string, unknown>;
    const key = msg.key as Record<string, string>;
    const message = msg.message as Record<string, unknown>;

    const base: IncomingMessage = {
      channelType: "whatsapp",
      channelUserId: key?.remoteJid || "",
      channelMessageId: key?.id || uuid(),
      content: this.extractText(message),
      timestamp: new Date(),
      raw,
    };

    if (!message) return base;

    // Extract media attachments
    const attachments = await this.extractAttachments(msg, message);
    if (attachments.length > 0) {
      base.attachments = attachments;
      // If content is empty placeholder, add a prompt
      if (base.content === "[non-text message]") {
        base.content = "Please analyze this media.";
      }
    }

    return base;
  }

  private async extractAttachments(
    msg: Record<string, unknown>,
    message: Record<string, unknown>,
  ): Promise<Attachment[]> {
    const attachments: Attachment[] = [];

    try {
      // Image message
      const imageMsg = message.imageMessage as Record<string, unknown>;
      if (imageMsg) {
        const buffer = await this.downloadWhatsAppMedia(msg);
        if (buffer) {
          const mime = (imageMsg.mimetype as string) || "image/jpeg";
          const base64 = buffer.toString("base64");
          attachments.push({
            type: "image",
            url: `data:${mime};base64,${base64}`,
            data: buffer,
            mimeType: mime,
            filename: `image_${Date.now()}.jpg`,
          });
        }
      }

      // Video message
      const videoMsg = message.videoMessage as Record<string, unknown>;
      if (videoMsg) {
        const buffer = await this.downloadWhatsAppMedia(msg);
        if (buffer) {
          const mime = (videoMsg.mimetype as string) || "video/mp4";
          const base64 = buffer.toString("base64");
          attachments.push({
            type: "video",
            url: `data:${mime};base64,${base64}`,
            data: buffer,
            mimeType: mime,
            filename: `video_${Date.now()}.mp4`,
          });
        }
      }

      // Audio/voice message
      const audioMsg = message.audioMessage as Record<string, unknown>;
      if (audioMsg) {
        const buffer = await this.downloadWhatsAppMedia(msg);
        if (buffer) {
          const mime = (audioMsg.mimetype as string) || "audio/ogg";
          const base64 = buffer.toString("base64");
          attachments.push({
            type: "audio",
            url: `data:${mime};base64,${base64}`,
            data: buffer,
            mimeType: mime,
            filename: audioMsg.ptt ? `voice_${Date.now()}.ogg` : `audio_${Date.now()}.mp3`,
          });
        }
      }

      // Document message
      const docMsg = message.documentMessage as Record<string, unknown>;
      if (docMsg) {
        const buffer = await this.downloadWhatsAppMedia(msg);
        if (buffer) {
          const mime = (docMsg.mimetype as string) || "application/octet-stream";
          const filename = (docMsg.fileName as string) || `doc_${Date.now()}`;
          const base64 = buffer.toString("base64");
          const type = mime.startsWith("image/") ? "image" as const
            : mime.startsWith("video/") ? "video" as const
            : mime.startsWith("audio/") ? "audio" as const
            : "file" as const;
          attachments.push({
            type,
            url: `data:${mime};base64,${base64}`,
            data: buffer,
            mimeType: mime,
            filename,
          });
        }
      }

      // Sticker message
      const stickerMsg = message.stickerMessage as Record<string, unknown>;
      if (stickerMsg) {
        const buffer = await this.downloadWhatsAppMedia(msg);
        if (buffer) {
          const mime = (stickerMsg.mimetype as string) || "image/webp";
          const base64 = buffer.toString("base64");
          attachments.push({
            type: "image",
            url: `data:${mime};base64,${base64}`,
            data: buffer,
            mimeType: mime,
            filename: `sticker_${Date.now()}.webp`,
          });
        }
      }
    } catch (error) {
      this.log.error(`Failed to extract WhatsApp media: ${error instanceof Error ? error.message : error}`);
    }

    return attachments;
  }

  private async downloadWhatsAppMedia(msg: Record<string, unknown>): Promise<Buffer | null> {
    try {
      if (this._downloadMedia) {
        return await this._downloadMedia(msg, this.client);
      }
      return null;
    } catch (error) {
      this.log.error(`WhatsApp media download failed: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  private extractText(message: Record<string, unknown>): string {
    if (!message) return "";

    const conv = message.conversation as string;
    if (conv) return conv;

    const extended = message.extendedTextMessage as Record<string, unknown>;
    if (extended?.text) return extended.text as string;

    // Captions on media messages
    const imageMsg = message.imageMessage as Record<string, unknown>;
    if (imageMsg?.caption) return imageMsg.caption as string;

    const videoMsg = message.videoMessage as Record<string, unknown>;
    if (videoMsg?.caption) return videoMsg.caption as string;

    const docMsg = message.documentMessage as Record<string, unknown>;
    if (docMsg?.caption) return docMsg.caption as string;

    // Check if it's a media message (will be handled by attachments)
    if (message.imageMessage || message.videoMessage || message.audioMessage ||
        message.documentMessage || message.stickerMessage) {
      return "[non-text message]";
    }

    return "[non-text message]";
  }
}
