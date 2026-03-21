/**
 * ArivuClaw Matrix Channel — Matrix protocol adapter.
 *
 * Uses matrix-js-sdk for communication over the Matrix open protocol.
 * Supports end-to-end encryption, rooms, and threads.
 */

import { BaseChannel } from "../base.js";
import type {
  Attachment,
  ChannelConfig,
  ChannelType,
  IncomingMessage,
} from "../../core/types.js";
import { Logger } from "../../utils/logger.js";

const log = Logger.create("channel:matrix");

// ─── Types ───────────────────────────────────────────────────────────

export interface MatrixConfig {
  /** Matrix homeserver URL (e.g., "https://matrix.org") */
  homeserverUrl: string;
  /** Bot user ID (e.g., "@arivuclaw:matrix.org") */
  userId: string;
  /** Access token for authentication */
  accessToken: string;
  /** Device ID for E2E encryption */
  deviceId?: string;
  /** Enable end-to-end encryption */
  enableEncryption?: boolean;
  /** Path to store encryption keys */
  cryptoStorePath?: string;
  /** Auto-join rooms when invited */
  autoJoinRooms?: boolean;
  /** Only respond in these rooms (empty = all rooms) */
  allowedRoomIds?: string[];
}

interface MatrixClient {
  startClient(options?: { initialSyncLimit?: number }): Promise<void>;
  stopClient(): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  joinRoom(roomId: string): Promise<void>;
  sendEvent(roomId: string, eventType: string, content: Record<string, unknown>): Promise<{ event_id: string }>;
  sendMessage(roomId: string, content: Record<string, unknown>): Promise<{ event_id: string }>;
  sendTextMessage(roomId: string, text: string): Promise<{ event_id: string }>;
  uploadContent(data: Buffer, options: { name: string; type: string }): Promise<{ content_uri: string }>;
  setDisplayName(name: string): Promise<void>;
  initCrypto(): Promise<void>;
  setGlobalErrorOnUnknownDevices(value: boolean): void;
  getRoom(roomId: string): MatrixRoom | null;
}

interface MatrixRoom {
  roomId: string;
  name: string;
  getMembers(): MatrixMember[];
}

interface MatrixMember {
  userId: string;
  name: string;
}

interface MatrixEvent {
  getType(): string;
  getSender(): string;
  getRoomId(): string;
  getId(): string;
  getContent(): Record<string, unknown>;
  getDate(): Date;
  isEncrypted(): boolean;
  getRelation(): { rel_type?: string; event_id?: string } | null;
}

// ─── MatrixChannel ───────────────────────────────────────────────────

export class MatrixChannel extends BaseChannel {
  readonly type: ChannelType = "matrix";
  readonly name = "Matrix";

  private matrixConfig!: MatrixConfig;
  private client: MatrixClient | null = null;
  private roomUserMap: Map<string, string> = new Map(); // channelUserId -> roomId

  async initialize(config: ChannelConfig): Promise<void> {
    this.matrixConfig = {
      homeserverUrl: config.credentials["homeserverUrl"] ?? "",
      userId: config.credentials["userId"] ?? "",
      accessToken: config.credentials["accessToken"] ?? "",
      deviceId: config.credentials["deviceId"],
      enableEncryption: config.options?.["enableEncryption"] as boolean ?? false,
      cryptoStorePath: config.credentials["cryptoStorePath"],
      autoJoinRooms: config.options?.["autoJoinRooms"] as boolean ?? true,
      allowedRoomIds: config.options?.["allowedRoomIds"] as string[] | undefined,
    };

    if (!this.matrixConfig.homeserverUrl || !this.matrixConfig.accessToken) {
      throw new Error(
        "Matrix channel requires homeserverUrl and accessToken in credentials",
      );
    }

    await super.initialize(config);
  }

  protected async connect(): Promise<void> {
    log.info("Connecting Matrix channel...");

    try {
      // Dynamically import matrix-js-sdk to avoid hard dependency
      const sdk = await import("matrix-js-sdk" as string) as any;

      const clientOpts: Record<string, unknown> = {
        baseUrl: this.matrixConfig.homeserverUrl,
        accessToken: this.matrixConfig.accessToken,
        userId: this.matrixConfig.userId,
        deviceId: this.matrixConfig.deviceId,
      };

      if (this.matrixConfig.enableEncryption && this.matrixConfig.cryptoStorePath) {
        clientOpts["cryptoStore"] = this.matrixConfig.cryptoStorePath;
      }

      this.client = sdk.createClient(clientOpts) as unknown as MatrixClient;

      // Initialize E2E encryption if enabled
      if (this.matrixConfig.enableEncryption) {
        await this.initializeEncryption();
      }

      // Register event handlers
      this.registerEventHandlers();

      // Start the client sync loop
      await this.client.startClient({ initialSyncLimit: 10 });

      log.info("Matrix channel connected", {
        homeserver: this.matrixConfig.homeserverUrl,
        userId: this.matrixConfig.userId,
        encryption: this.matrixConfig.enableEncryption,
      });
    } catch (error) {
      log.error("Failed to connect Matrix channel", { error: String(error) });
      throw new Error(
        `Matrix connection failed. Ensure 'matrix-js-sdk' is installed: ${error}`,
      );
    }
  }

  protected async disconnect(): Promise<void> {
    log.info("Disconnecting Matrix channel...");

    if (this.client) {
      this.client.stopClient();
      this.client = null;
    }

    this.roomUserMap.clear();
    log.info("Matrix channel disconnected");
  }

  protected async doSendMessage(
    channelUserId: string,
    content: string,
    attachments?: Attachment[],
  ): Promise<void> {
    if (!this.client) {
      throw new Error("Matrix client not initialized");
    }

    const roomId = this.roomUserMap.get(channelUserId) ?? channelUserId;

    // Send text message
    if (content) {
      await this.client.sendEvent(roomId, "m.room.message", {
        msgtype: "m.text",
        body: content,
        format: "org.matrix.custom.html",
        formatted_body: this.markdownToHtml(content),
      });
    }

    // Send attachments
    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        await this.sendAttachment(roomId, att);
      }
    }

    log.debug("Message sent to Matrix room", { roomId, channelUserId });
  }

  // ─── Thread Support ────────────────────────────────────────────────

  /**
   * Send a reply in a Matrix thread.
   */
  async sendThreadReply(
    roomId: string,
    threadRootEventId: string,
    content: string,
  ): Promise<string> {
    if (!this.client) {
      throw new Error("Matrix client not initialized");
    }

    const result = await this.client.sendEvent(roomId, "m.room.message", {
      msgtype: "m.text",
      body: content,
      "m.relates_to": {
        rel_type: "m.thread",
        event_id: threadRootEventId,
      },
    });

    log.debug("Thread reply sent", { roomId, threadRootEventId });
    return result.event_id;
  }

  // ─── E2E Encryption ────────────────────────────────────────────────

  private async initializeEncryption(): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.initCrypto();
      // Trust all devices for simplicity (can be made stricter)
      this.client.setGlobalErrorOnUnknownDevices(false);
      log.info("E2E encryption initialized");
    } catch (error) {
      log.error("Failed to initialize E2E encryption", { error: String(error) });
      log.warn("Continuing without E2E encryption");
    }
  }

  // ─── Event Handling ────────────────────────────────────────────────

  private registerEventHandlers(): void {
    if (!this.client) return;

    // Handle incoming messages
    this.client.on("Room.timeline", (...args: unknown[]) => {
      const event = args[0] as MatrixEvent;
      const room = args[1] as MatrixRoom | undefined;
      const toStartOfTimeline = args[2] as boolean;

      if (toStartOfTimeline) return; // Ignore backfill

      this.handleTimelineEvent(event, room).catch((err) => {
        log.error("Error handling Matrix event", { error: String(err) });
      });
    });

    // Auto-join rooms on invite
    if (this.matrixConfig.autoJoinRooms) {
      this.client.on("RoomMember.membership", (...args: unknown[]) => {
        const event = args[0] as MatrixEvent;
        const member = args[1] as MatrixMember;

        if (
          member.userId === this.matrixConfig.userId &&
          event.getContent()["membership"] === "invite"
        ) {
          const roomId = event.getRoomId();

          // Check if the room is allowed
          if (
            this.matrixConfig.allowedRoomIds &&
            this.matrixConfig.allowedRoomIds.length > 0 &&
            !this.matrixConfig.allowedRoomIds.includes(roomId)
          ) {
            log.info("Ignoring invite for non-allowed room", { roomId });
            return;
          }

          this.client?.joinRoom(roomId).then(() => {
            log.info("Auto-joined Matrix room", { roomId });
          }).catch((err) => {
            log.error("Failed to auto-join room", { roomId, error: String(err) });
          });
        }
      });
    }

    // Handle sync state
    this.client.on("sync", (...args: unknown[]) => {
      const state = args[0] as string;
      if (state === "PREPARED") {
        log.info("Matrix client sync complete");
      }
    });
  }

  private async handleTimelineEvent(
    event: MatrixEvent,
    room?: MatrixRoom,
  ): Promise<void> {
    // Only process room messages
    if (event.getType() !== "m.room.message") return;

    // Ignore our own messages
    if (event.getSender() === this.matrixConfig.userId) return;

    const roomId = event.getRoomId();

    // Check room allowlist
    if (
      this.matrixConfig.allowedRoomIds &&
      this.matrixConfig.allowedRoomIds.length > 0 &&
      !this.matrixConfig.allowedRoomIds.includes(roomId)
    ) {
      return;
    }

    const content = event.getContent();
    const sender = event.getSender();

    // Map sender to room for replies
    this.roomUserMap.set(sender, roomId);

    // Determine if this is a thread reply
    const relation = event.getRelation();
    const threadRootId = relation?.rel_type === "m.thread" ? relation.event_id : undefined;

    const incoming: IncomingMessage = {
      channelType: "matrix",
      channelUserId: sender,
      channelMessageId: event.getId(),
      content: (content["body"] as string) ?? "",
      attachments: this.extractAttachments(content),
      timestamp: event.getDate(),
      raw: {
        event,
        roomId,
        roomName: room?.name,
        isEncrypted: event.isEncrypted(),
        threadRootId,
      },
    };

    await this.emitMessage(incoming);
  }

  // ─── Attachment Handling ───────────────────────────────────────────

  private async sendAttachment(
    roomId: string,
    attachment: Attachment,
  ): Promise<void> {
    if (!this.client) return;

    const msgtype = this.getMsgType(attachment.type);

    if (attachment.data) {
      // Upload the file to the Matrix content repository
      const uploadResult = await this.client.uploadContent(attachment.data, {
        name: attachment.filename ?? "file",
        type: attachment.mimeType,
      });

      await this.client.sendEvent(roomId, "m.room.message", {
        msgtype,
        body: attachment.filename ?? "file",
        url: uploadResult.content_uri,
        info: {
          mimetype: attachment.mimeType,
          size: attachment.data.length,
        },
      });
    } else if (attachment.url) {
      await this.client.sendEvent(roomId, "m.room.message", {
        msgtype,
        body: attachment.filename ?? "file",
        url: attachment.url,
        info: { mimetype: attachment.mimeType },
      });
    }
  }

  private extractAttachments(
    content: Record<string, unknown>,
  ): Attachment[] | undefined {
    const msgtype = content["msgtype"] as string;

    if (!["m.image", "m.file", "m.audio", "m.video"].includes(msgtype)) {
      return undefined;
    }

    const info = content["info"] as Record<string, unknown> | undefined;

    return [
      {
        type: this.matrixMsgTypeToAttType(msgtype),
        mimeType: (info?.["mimetype"] as string) ?? "application/octet-stream",
        filename: (content["body"] as string) ?? undefined,
        url: (content["url"] as string) ?? undefined,
      },
    ];
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private getMsgType(
    attType: "image" | "file" | "audio" | "video" | "location",
  ): string {
    switch (attType) {
      case "image":
        return "m.image";
      case "audio":
        return "m.audio";
      case "video":
        return "m.video";
      default:
        return "m.file";
    }
  }

  private matrixMsgTypeToAttType(
    msgtype: string,
  ): "image" | "file" | "audio" | "video" | "location" {
    switch (msgtype) {
      case "m.image":
        return "image";
      case "m.audio":
        return "audio";
      case "m.video":
        return "video";
      default:
        return "file";
    }
  }

  private markdownToHtml(text: string): string {
    // Basic markdown to HTML conversion for Matrix formatted_body
    return text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
  }
}
