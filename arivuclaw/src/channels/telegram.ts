/**
 * ArivuClaw Telegram Channel — Via grammY bot framework.
 */

import { v4 as uuid } from "uuid";
import type { Attachment, ChannelType, IncomingMessage } from "../core/types";
import { BaseChannel } from "./base";

export class TelegramChannel extends BaseChannel {
  readonly type: ChannelType = "telegram";
  readonly name = "Telegram (grammY)";

  private bot: any = null;

  protected async connect(): Promise<void> {
    const token = this.config.credentials.botToken;
    if (!token) throw new Error("Telegram bot token required");

    this.log.info("Starting Telegram bot...");

    const { Bot } = await import("grammy");
    this.bot = new Bot(token);

    this.bot.on("message:text", async (ctx: any) => {
      await this.emitMessage({
        channelType: "telegram",
        channelUserId: String(ctx.from.id),
        channelMessageId: String(ctx.message.message_id),
        content: ctx.message.text,
        timestamp: new Date(ctx.message.date * 1000),
        raw: ctx.message,
      });
    });

    this.bot.start();

    this.log.info("Telegram bot started successfully — listening for messages");
  }

  protected async disconnect(): Promise<void> {
    if (this.bot) {
      await this.bot.stop();
    }
    this.bot = null;
  }

  protected async doSendMessage(
    channelUserId: string,
    content: string,
    attachments?: Attachment[],
  ): Promise<void> {
    if (!this.bot) throw new Error("Telegram bot not connected");

    await this.bot.api.sendMessage(Number(channelUserId), content, {
      parse_mode: "Markdown",
    });

    this.log.info(`Sent message to Telegram user ${channelUserId}`);
  }
}
