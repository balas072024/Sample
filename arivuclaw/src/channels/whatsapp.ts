/**
 * ArivuClaw WhatsApp Channel — Via Baileys (WhatsApp Web protocol).
 */

import { v4 as uuid } from "uuid";
import type { Attachment, ChannelType, IncomingMessage } from "../core/types.js";
import { BaseChannel } from "./base.js";

export class WhatsAppChannel extends BaseChannel {
  readonly type: ChannelType = "whatsapp";
  readonly name = "WhatsApp (Baileys)";

  private client: unknown = null;

  protected async connect(): Promise<void> {
    this.log.info("Connecting to WhatsApp Web...");

    // In production, this initializes the Baileys client:
    // const { default: makeWASocket, useMultiFileAuthState } = await import("baileys");
    // const { state, saveCreds } = await useMultiFileAuthState("./auth/whatsapp");
    // this.client = makeWASocket({ auth: state, printQRInTerminal: true });
    // this.client.ev.on("creds.update", saveCreds);

    // Register message listener
    // this.client.ev.on("messages.upsert", async ({ messages }) => {
    //   for (const msg of messages) {
    //     if (!msg.key.fromMe && msg.message) {
    //       await this.emitMessage(this.parseMessage(msg));
    //     }
    //   }
    // });

    this.log.info("WhatsApp channel ready (pair via QR code)");
  }

  protected async disconnect(): Promise<void> {
    // this.client?.end();
    this.client = null;
  }

  protected async doSendMessage(
    channelUserId: string,
    content: string,
    attachments?: Attachment[],
  ): Promise<void> {
    if (!this.client) throw new Error("WhatsApp not connected");

    // await this.client.sendMessage(channelUserId, { text: content });

    if (attachments) {
      for (const attachment of attachments) {
        // await this.client.sendMessage(channelUserId, {
        //   [attachment.type]: attachment.data || { url: attachment.url },
        //   mimetype: attachment.mimeType,
        //   fileName: attachment.filename,
        // });
      }
    }

    this.log.info(`Sent message to WhatsApp user ${channelUserId}`);
  }

  private parseMessage(raw: unknown): IncomingMessage {
    // Parse Baileys message format into ArivuClaw format
    const msg = raw as Record<string, unknown>;
    const key = msg.key as Record<string, string>;
    const message = msg.message as Record<string, unknown>;

    return {
      channelType: "whatsapp",
      channelUserId: key?.remoteJid || "",
      channelMessageId: key?.id || uuid(),
      content: this.extractText(message),
      timestamp: new Date(),
      raw,
    };
  }

  private extractText(message: Record<string, unknown>): string {
    if (!message) return "";
    const conv = message.conversation as string;
    if (conv) return conv;

    const extended = message.extendedTextMessage as Record<string, unknown>;
    if (extended?.text) return extended.text as string;

    return "[non-text message]";
  }
}
