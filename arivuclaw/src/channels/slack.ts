/**
 * ArivuClaw Slack Channel — Via @slack/bolt
 */

import type { Attachment, ChannelType, IncomingMessage } from "../core/types";
import { BaseChannel } from "./base";

export class SlackChannel extends BaseChannel {
  readonly type: ChannelType = "slack";
  readonly name = "Slack (Bolt)";

  private app: any = null;

  protected async connect(): Promise<void> {
    const { botToken, appToken, signingSecret } = this.config.credentials;
    if (!botToken) throw new Error("Slack bot token required");

    this.log.info("Starting Slack app...");

    const { App } = await import("@slack/bolt");
    this.app = new App({
      token: botToken,
      appToken: appToken,
      signingSecret: signingSecret,
      socketMode: !!appToken,
    });

    this.app.message(async ({ message, say }: any) => {
      if (message.subtype) return;
      await this.emitMessage({
        channelType: "slack",
        channelUserId: message.user,
        channelMessageId: message.ts,
        content: message.text || "",
        timestamp: new Date(parseFloat(message.ts) * 1000),
        raw: message,
      });
    });

    await this.app.start();

    this.log.info("Slack app started successfully — listening for messages");
  }

  protected async disconnect(): Promise<void> {
    if (this.app) {
      await this.app.stop();
    }
    this.app = null;
  }

  protected async doSendMessage(
    channelUserId: string,
    content: string,
    attachments?: Attachment[],
  ): Promise<void> {
    if (!this.app) throw new Error("Slack app not connected");

    await this.app.client.chat.postMessage({
      channel: channelUserId,
      text: content,
    });

    this.log.info(`Sent message to Slack channel ${channelUserId}`);
  }
}
