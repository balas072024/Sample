/**
 * ArivuClaw Microsoft Teams Channel — Bot Framework adapter.
 *
 * Integrates with Microsoft Teams using the Bot Framework SDK.
 * Supports text messages, adaptive cards, and file attachments.
 */

import { BaseChannel } from "../base.js";
import type {
  Attachment,
  ChannelConfig,
  ChannelType,
  IncomingMessage,
} from "../../core/types.js";
import { Logger } from "../../utils/logger.js";

const log = Logger.create("channel:teams");

// ─── Types ───────────────────────────────────────────────────────────

export interface TeamsConfig {
  /** Microsoft App ID */
  appId: string;
  /** Microsoft App Password */
  appPassword: string;
  /** Tenant ID (optional, for single-tenant bots) */
  tenantId?: string;
  /** Bot endpoint port */
  port?: number;
}

export interface AdaptiveCard {
  type: "AdaptiveCard";
  version: string;
  body: AdaptiveCardElement[];
  actions?: AdaptiveCardAction[];
}

export interface AdaptiveCardElement {
  type: string;
  text?: string;
  size?: string;
  weight?: string;
  wrap?: boolean;
  url?: string;
  columns?: AdaptiveCardElement[];
  items?: AdaptiveCardElement[];
  [key: string]: unknown;
}

export interface AdaptiveCardAction {
  type: string;
  title: string;
  url?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

interface TeamsConversationReference {
  activityId: string;
  user: { id: string; name?: string };
  conversation: { id: string; tenantId?: string };
  channelId: string;
  serviceUrl: string;
}

interface TeamsActivity {
  type: string;
  id: string;
  timestamp: string;
  text?: string;
  from: { id: string; name?: string };
  conversation: { id: string; tenantId?: string };
  channelId: string;
  serviceUrl: string;
  attachments?: TeamsActivityAttachment[];
  value?: Record<string, unknown>;
}

interface TeamsActivityAttachment {
  contentType: string;
  contentUrl?: string;
  content?: unknown;
  name?: string;
}

// ─── Bot Framework Adapter Abstraction ───────────────────────────────

interface BotFrameworkAdapter {
  processActivity(req: unknown, res: unknown, logic: (context: TurnContext) => Promise<void>): Promise<void>;
  continueConversation(reference: TeamsConversationReference, logic: (context: TurnContext) => Promise<void>): Promise<void>;
}

interface TurnContext {
  activity: TeamsActivity;
  sendActivity(activity: Partial<TeamsActivity> | string): Promise<{ id: string }>;
  updateActivity(activity: Partial<TeamsActivity>): Promise<void>;
  deleteActivity(activityId: string): Promise<void>;
}

// ─── TeamsChannel ────────────────────────────────────────────────────

export class TeamsChannel extends BaseChannel {
  readonly type: ChannelType = "teams";
  readonly name = "Microsoft Teams";

  private teamsConfig!: TeamsConfig;
  private adapter: BotFrameworkAdapter | null = null;
  private conversationRefs: Map<string, TeamsConversationReference> = new Map();
  private server: { close(): void } | null = null;

  async initialize(config: ChannelConfig): Promise<void> {
    this.teamsConfig = {
      appId: config.credentials["appId"] ?? "",
      appPassword: config.credentials["appPassword"] ?? "",
      tenantId: config.credentials["tenantId"],
      port: (config.options?.["port"] as number) ?? 3978,
    };

    if (!this.teamsConfig.appId || !this.teamsConfig.appPassword) {
      throw new Error(
        "Teams channel requires appId and appPassword in credentials",
      );
    }

    await super.initialize(config);
  }

  protected async connect(): Promise<void> {
    log.info("Connecting Microsoft Teams channel...");

    try {
      // Dynamically import botbuilder to avoid hard dependency
      const botbuilder = await import("botbuilder" as string) as any;

      const credentials = new botbuilder.MicrosoftAppCredentials(
        this.teamsConfig.appId,
        this.teamsConfig.appPassword,
      );

      this.adapter = new botbuilder.BotFrameworkAdapter({
        appId: this.teamsConfig.appId,
        appPassword: this.teamsConfig.appPassword,
      }) as unknown as BotFrameworkAdapter;

      // Start HTTP server to receive messages from Teams
      const http = await import("http");
      const port = this.teamsConfig.port ?? 3978;

      this.server = http.createServer(async (req, res) => {
        if (req.method === "POST" && req.url === "/api/messages") {
          await this.adapter!.processActivity(req, res, async (context) => {
            await this.handleIncomingActivity(context);
          });
        } else {
          res.writeHead(200);
          res.end("ArivuClaw Teams Bot is running");
        }
      });

      await new Promise<void>((resolve) => {
        (this.server as ReturnType<typeof http.createServer>).listen(
          port,
          () => {
            log.info("Teams bot listening", { port });
            resolve();
          },
        );
      });

      log.info("Microsoft Teams channel connected", { port });
    } catch (error) {
      log.error("Failed to connect Teams channel", { error: String(error) });
      throw new Error(
        `Teams connection failed. Ensure 'botbuilder' package is installed: ${error}`,
      );
    }
  }

  protected async disconnect(): Promise<void> {
    log.info("Disconnecting Microsoft Teams channel...");

    if (this.server) {
      this.server.close();
      this.server = null;
    }

    this.adapter = null;
    this.conversationRefs.clear();

    log.info("Microsoft Teams channel disconnected");
  }

  protected async doSendMessage(
    channelUserId: string,
    content: string,
    attachments?: Attachment[],
  ): Promise<void> {
    const reference = this.conversationRefs.get(channelUserId);
    if (!reference) {
      log.warn("No conversation reference for Teams user", { channelUserId });
      throw new Error(
        `No active conversation with Teams user ${channelUserId}. ` +
          "The user must message the bot first.",
      );
    }

    if (!this.adapter) {
      throw new Error("Teams adapter not initialized");
    }

    await this.adapter.continueConversation(reference, async (context) => {
      const activity: Partial<TeamsActivity> = {
        type: "message",
        text: content,
      };

      // Attach adaptive cards or files
      if (attachments && attachments.length > 0) {
        activity.attachments = attachments.map((att) =>
          this.convertToTeamsAttachment(att),
        );
      }

      await context.sendActivity(activity);
    });

    log.debug("Message sent to Teams user", { channelUserId });
  }

  // ─── Adaptive Card Helpers ─────────────────────────────────────────

  /**
   * Send an adaptive card to a Teams user.
   */
  async sendAdaptiveCard(
    channelUserId: string,
    card: AdaptiveCard,
  ): Promise<void> {
    const reference = this.conversationRefs.get(channelUserId);
    if (!reference || !this.adapter) {
      throw new Error(`Cannot send card to ${channelUserId}: no active conversation`);
    }

    await this.adapter.continueConversation(reference, async (context) => {
      await context.sendActivity({
        type: "message",
        attachments: [
          {
            contentType: "application/vnd.microsoft.card.adaptive",
            content: card,
          },
        ],
      });
    });

    log.debug("Adaptive card sent to Teams user", { channelUserId });
  }

  /**
   * Build a simple text adaptive card.
   */
  buildTextCard(title: string, body: string): AdaptiveCard {
    return {
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        { type: "TextBlock", text: title, size: "Large", weight: "Bolder" },
        { type: "TextBlock", text: body, wrap: true },
      ],
    };
  }

  /**
   * Build a confirmation card with Yes/No actions.
   */
  buildConfirmationCard(
    question: string,
    yesData: Record<string, unknown>,
    noData: Record<string, unknown>,
  ): AdaptiveCard {
    return {
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        { type: "TextBlock", text: question, wrap: true, weight: "Bolder" },
      ],
      actions: [
        { type: "Action.Submit", title: "Yes", data: yesData },
        { type: "Action.Submit", title: "No", data: noData },
      ],
    };
  }

  // ─── Incoming Message Handling ─────────────────────────────────────

  private async handleIncomingActivity(context: TurnContext): Promise<void> {
    const activity = context.activity;

    // Store conversation reference for proactive messaging
    const reference: TeamsConversationReference = {
      activityId: activity.id,
      user: activity.from,
      conversation: activity.conversation,
      channelId: activity.channelId,
      serviceUrl: activity.serviceUrl,
    };
    this.conversationRefs.set(activity.from.id, reference);

    if (activity.type === "message") {
      const incoming: IncomingMessage = {
        channelType: "teams",
        channelUserId: activity.from.id,
        channelMessageId: activity.id,
        content: activity.text ?? "",
        attachments: this.convertFromTeamsAttachments(activity.attachments),
        timestamp: new Date(activity.timestamp),
        raw: activity,
      };

      await this.emitMessage(incoming);
    } else if (activity.type === "invoke" && activity.value) {
      // Handle adaptive card action submissions
      const incoming: IncomingMessage = {
        channelType: "teams",
        channelUserId: activity.from.id,
        channelMessageId: activity.id,
        content: JSON.stringify(activity.value),
        timestamp: new Date(activity.timestamp),
        raw: activity,
      };

      await this.emitMessage(incoming);
    }
  }

  // ─── Conversion Helpers ────────────────────────────────────────────

  private convertToTeamsAttachment(
    attachment: Attachment,
  ): TeamsActivityAttachment {
    if (attachment.type === "image") {
      return {
        contentType: attachment.mimeType,
        contentUrl: attachment.url,
        name: attachment.filename,
      };
    }

    return {
      contentType: attachment.mimeType,
      contentUrl: attachment.url,
      name: attachment.filename ?? "file",
    };
  }

  private convertFromTeamsAttachments(
    teamsAttachments?: TeamsActivityAttachment[],
  ): Attachment[] | undefined {
    if (!teamsAttachments || teamsAttachments.length === 0) return undefined;

    return teamsAttachments.map((att) => ({
      type: this.getAttachmentType(att.contentType),
      mimeType: att.contentType,
      filename: att.name,
      url: att.contentUrl,
    }));
  }

  private getAttachmentType(
    mimeType: string,
  ): "image" | "file" | "audio" | "video" | "location" {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType.startsWith("video/")) return "video";
    return "file";
  }
}
