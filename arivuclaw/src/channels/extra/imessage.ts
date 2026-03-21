/**
 * Arivumaiyam AI iMessage Channel — macOS-only iMessage adapter.
 *
 * Reads incoming messages from the iMessage SQLite database (chat.db)
 * and sends outgoing messages via AppleScript / osascript.
 * Only functional on macOS with iMessage configured.
 */

import { exec, execFile } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";
import { BaseChannel } from "../base";
import type {
  Attachment,
  ChannelConfig,
  ChannelType,
  IncomingMessage,
} from "../../core/types";
import { Logger } from "../../utils/logger";

const log = Logger.create("channel:imessage");
const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

// ─── Types ───────────────────────────────────────────────────────────

export interface iMessageConfig {
  /** Path to iMessage chat database (defaults to ~/Library/Messages/chat.db) */
  chatDbPath?: string;
  /** Poll interval in milliseconds */
  pollIntervalMs?: number;
  /** Only process messages from these phone numbers / Apple IDs */
  allowedSenders?: string[];
}

interface ChatDbRow {
  rowid: number;
  text: string;
  handle_id: string;
  date: number;
  is_from_me: number;
  cache_has_attachments: number;
  attachment_filename?: string;
  attachment_mime_type?: string;
}

// ─── Platform guard ──────────────────────────────────────────────────

function assertMacOS(): void {
  if (os.platform() !== "darwin") {
    throw new Error(
      "iMessage channel is only available on macOS. " +
        `Current platform: ${os.platform()}`,
    );
  }
}

// ─── iMessageChannel ─────────────────────────────────────────────────

export class iMessageChannel extends BaseChannel {
  readonly type: ChannelType = "imessage";
  readonly name = "iMessage";

  private imConfig!: iMessageConfig;
  private chatDbPath!: string;
  private pollTimer?: ReturnType<typeof setInterval>;
  private lastProcessedRowId = 0;

  async initialize(config: ChannelConfig): Promise<void> {
    assertMacOS();

    const homeDir = os.homedir();
    this.imConfig = {
      chatDbPath:
        config.credentials["chatDbPath"] ??
        path.join(homeDir, "Library", "Messages", "chat.db"),
      pollIntervalMs: (config.options?.["pollIntervalMs"] as number) ?? 3000,
      allowedSenders: config.options?.["allowedSenders"] as string[] | undefined,
    };

    this.chatDbPath = this.imConfig.chatDbPath!;

    await super.initialize(config);
  }

  protected async connect(): Promise<void> {
    assertMacOS();
    log.info("Connecting iMessage channel...");

    // Verify the chat database exists and is readable
    if (!fs.existsSync(this.chatDbPath)) {
      throw new Error(
        `iMessage database not found at ${this.chatDbPath}. ` +
          "Ensure iMessage is configured on this Mac.",
      );
    }

    // Verify sqlite3 is available
    try {
      await execFileAsync("sqlite3", ["--version"], { timeout: 5_000 });
    } catch {
      throw new Error("sqlite3 is required but not found on PATH");
    }

    // Get the latest row ID so we only process new messages
    this.lastProcessedRowId = await this.getLatestRowId();

    // Start polling for new messages
    this.startPolling();

    log.info("iMessage channel connected", {
      dbPath: this.chatDbPath,
      lastRowId: this.lastProcessedRowId,
    });
  }

  protected async disconnect(): Promise<void> {
    log.info("Disconnecting iMessage channel...");

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }

    log.info("iMessage channel disconnected");
  }

  protected async doSendMessage(
    channelUserId: string,
    content: string,
    attachments?: Attachment[],
  ): Promise<void> {
    assertMacOS();

    // Send text message via AppleScript
    if (content) {
      await this.sendViaAppleScript(channelUserId, content);
    }

    // Send attachments as separate messages
    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        if (att.url && fs.existsSync(att.url)) {
          await this.sendFileViaAppleScript(channelUserId, att.url);
        } else if (att.data) {
          const tmpPath = await this.writeTempFile(att);
          await this.sendFileViaAppleScript(channelUserId, tmpPath);
        }
      }
    }
  }

  // ─── AppleScript Sending ───────────────────────────────────────────

  private async sendViaAppleScript(
    recipient: string,
    message: string,
  ): Promise<void> {
    // Escape special characters for AppleScript string
    const escapedMessage = message
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');

    const script = `
      tell application "Messages"
        set targetService to 1st account whose service type = iMessage
        set targetBuddy to participant "${recipient}" of targetService
        send "${escapedMessage}" to targetBuddy
      end tell
    `;

    try {
      await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
        timeout: 15_000,
      });
      log.debug("iMessage sent", { recipient });
    } catch (error) {
      log.error("Failed to send iMessage", {
        recipient,
        error: String(error),
      });
      throw new Error(`Failed to send iMessage to ${recipient}: ${error}`);
    }
  }

  private async sendFileViaAppleScript(
    recipient: string,
    filePath: string,
  ): Promise<void> {
    const absolutePath = path.resolve(filePath);
    const script = `
      tell application "Messages"
        set targetService to 1st account whose service type = iMessage
        set targetBuddy to participant "${recipient}" of targetService
        send POSIX file "${absolutePath}" to targetBuddy
      end tell
    `;

    try {
      await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
        timeout: 30_000,
      });
      log.debug("iMessage file sent", { recipient, filePath: absolutePath });
    } catch (error) {
      log.error("Failed to send iMessage file", {
        recipient,
        error: String(error),
      });
    }
  }

  // ─── Database Polling ─────────────────────────────────────────────

  private startPolling(): void {
    const intervalMs = this.imConfig.pollIntervalMs ?? 3000;

    this.pollTimer = setInterval(async () => {
      try {
        await this.pollNewMessages();
      } catch (error) {
        log.error("iMessage poll error", { error: String(error) });
      }
    }, intervalMs);
  }

  private async pollNewMessages(): Promise<void> {
    const query = `
      SELECT
        m.ROWID as rowid,
        m.text as text,
        h.id as handle_id,
        m.date as date,
        m.is_from_me as is_from_me,
        m.cache_has_attachments as cache_has_attachments
      FROM message m
      LEFT JOIN handle h ON m.handle_id = h.ROWID
      WHERE m.ROWID > ${this.lastProcessedRowId}
        AND m.is_from_me = 0
      ORDER BY m.ROWID ASC
      LIMIT 50;
    `;

    try {
      const { stdout } = await execFileAsync(
        "sqlite3",
        ["-json", this.chatDbPath, query],
        { timeout: 10_000 },
      );

      if (!stdout.trim()) return;

      let rows: ChatDbRow[];
      try {
        rows = JSON.parse(stdout);
      } catch {
        return;
      }

      for (const row of rows) {
        // Update the high-water mark
        if (row.rowid > this.lastProcessedRowId) {
          this.lastProcessedRowId = row.rowid;
        }

        // Filter by allowed senders if configured
        if (
          this.imConfig.allowedSenders &&
          !this.imConfig.allowedSenders.includes(row.handle_id)
        ) {
          continue;
        }

        // Fetch attachments if present
        let attachments: Attachment[] | undefined;
        if (row.cache_has_attachments) {
          attachments = await this.fetchAttachments(row.rowid);
        }

        const incoming: IncomingMessage = {
          channelType: "imessage",
          channelUserId: row.handle_id,
          channelMessageId: String(row.rowid),
          content: row.text ?? "",
          attachments,
          timestamp: this.convertCoreDataTimestamp(row.date),
          raw: row,
        };

        await this.emitMessage(incoming);
      }
    } catch (error) {
      log.debug("Failed to poll iMessage database", { error: String(error) });
    }
  }

  private async fetchAttachments(messageRowId: number): Promise<Attachment[]> {
    const query = `
      SELECT a.filename, a.mime_type
      FROM attachment a
      JOIN message_attachment_join maj ON a.ROWID = maj.attachment_id
      WHERE maj.message_id = ${messageRowId};
    `;

    try {
      const { stdout } = await execFileAsync(
        "sqlite3",
        ["-json", this.chatDbPath, query],
        { timeout: 5_000 },
      );

      if (!stdout.trim()) return [];

      const rows: { filename: string; mime_type: string }[] = JSON.parse(stdout);

      return rows.map((row) => ({
        type: this.getAttachmentType(row.mime_type),
        mimeType: row.mime_type ?? "application/octet-stream",
        filename: row.filename ? path.basename(row.filename) : undefined,
        url: row.filename?.replace("~", os.homedir()),
      }));
    } catch {
      return [];
    }
  }

  private async getLatestRowId(): Promise<number> {
    try {
      const { stdout } = await execFileAsync(
        "sqlite3",
        [this.chatDbPath, "SELECT MAX(ROWID) FROM message;"],
        { timeout: 5_000 },
      );
      return parseInt(stdout.trim(), 10) || 0;
    } catch {
      return 0;
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private convertCoreDataTimestamp(coreDataTime: number): Date {
    // macOS Core Data timestamps are nanoseconds since 2001-01-01
    const CORE_DATA_EPOCH = 978307200; // seconds between Unix epoch and 2001-01-01
    const seconds = coreDataTime / 1_000_000_000 + CORE_DATA_EPOCH;
    return new Date(seconds * 1000);
  }

  private getAttachmentType(
    mimeType: string,
  ): "image" | "file" | "audio" | "video" | "location" {
    if (!mimeType) return "file";
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType.startsWith("video/")) return "video";
    return "file";
  }

  private async writeTempFile(attachment: Attachment): Promise<string> {
    const tmpDir = path.join(process.cwd(), ".arivuclaw", "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const filename = attachment.filename ?? `attachment-${Date.now()}`;
    const tmpPath = path.join(tmpDir, filename);
    if (attachment.data) {
      fs.writeFileSync(tmpPath, attachment.data);
    }
    return tmpPath;
  }
}
