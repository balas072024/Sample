/**
 * Arivumaiyam AI Discord Channel — Via discord.js
 */

import { v4 as uuid } from "uuid";
import type { Attachment, ChannelType, IncomingMessage } from "../core/types";
import { BaseChannel } from "./base";

export class DiscordChannel extends BaseChannel {
  readonly type: ChannelType = "discord";
  readonly name = "Discord (discord.js)";

  private client: any = null;

  protected async connect(): Promise<void> {
    const token = this.config.credentials.botToken;
    if (!token) throw new Error("Discord bot token required");

    this.log.info("Starting Discord bot...");

    const { Client, GatewayIntentBits } = await import("discord.js");
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
    });

    this.client.on("messageCreate", async (message: any) => {
      if (message.author.bot) return;
      await this.emitMessage({
        channelType: "discord",
        channelUserId: message.author.id,
        channelMessageId: message.id,
        content: message.content,
        timestamp: message.createdAt,
        raw: message,
      });
    });

    await this.client.login(token);

    this.log.info("Discord bot started successfully — listening for messages");
  }

  protected async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
    }
    this.client = null;
  }

  protected async doSendMessage(
    channelUserId: string,
    content: string,
    attachments?: Attachment[],
  ): Promise<void> {
    if (!this.client) throw new Error("Discord client not connected");

    const user = await this.client.users.fetch(channelUserId);
    await user.send(content);

    this.log.info(`Sent message to Discord user ${channelUserId}`);
  }
}
