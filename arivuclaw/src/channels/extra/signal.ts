/**
 * Arivumaiyam AI Signal Channel — Signal messenger adapter via signal-cli.
 *
 * Uses the signal-cli daemon (JSON-RPC mode) for sending/receiving messages
 * over the Signal Protocol. Supports text, images, and file attachments.
 */

import { execFile, type ChildProcess, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import { BaseChannel } from "../base.js";
import type {
  Attachment,
  ChannelConfig,
  ChannelType,
  IncomingMessage,
} from "../../core/types.js";
import { Logger } from "../../utils/logger.js";

const log = Logger.create("channel:signal");
const execFileAsync = promisify(execFile);

// ─── Types ───────────────────────────────────────────────────────────

export interface SignalConfig {
  /** Path to the signal-cli binary */
  signalCliBin: string;
  /** Registered phone number (e.g., "+1234567890") */
  phoneNumber: string;
  /** Path to signal-cli data directory */
  dataDir?: string;
  /** Poll interval in milliseconds for incoming messages */
  pollIntervalMs?: number;
}

interface SignalJsonMessage {
  envelope: {
    source: string;
    sourceNumber?: string;
    sourceName?: string;
    timestamp: number;
    dataMessage?: {
      message: string | null;
      attachments?: SignalAttachment[];
      timestamp: number;
    };
  };
}

interface SignalAttachment {
  contentType: string;
  filename?: string;
  id: string;
  size: number;
}

// ─── SignalChannel ────────────────────────────────────────────────────

export class SignalChannel extends BaseChannel {
  readonly type: ChannelType = "signal";
  readonly name = "Signal";

  private signalConfig!: SignalConfig;
  private pollTimer?: ReturnType<typeof setInterval>;
  private daemonProcess?: ChildProcess;
  private receivingMessages = false;

  async initialize(config: ChannelConfig): Promise<void> {
    this.signalConfig = {
      signalCliBin: config.credentials["signalCliBin"] ?? "signal-cli",
      phoneNumber: config.credentials["phoneNumber"] ?? "",
      dataDir: config.credentials["dataDir"],
      pollIntervalMs: (config.options?.["pollIntervalMs"] as number) ?? 5000,
    };

    if (!this.signalConfig.phoneNumber) {
      throw new Error("Signal channel requires a phoneNumber in credentials");
    }

    await super.initialize(config);
  }

  protected async connect(): Promise<void> {
    log.info("Connecting to Signal via signal-cli...");

    // Verify signal-cli is available
    try {
      await execFileAsync(this.signalConfig.signalCliBin, ["--version"], {
        timeout: 10_000,
      });
    } catch (error) {
      throw new Error(
        `signal-cli not found at "${this.signalConfig.signalCliBin}": ${error}`,
      );
    }

    // Start the JSON-RPC daemon for receiving messages
    this.startDaemon();

    // Start polling for incoming messages
    this.startPolling();

    log.info("Signal channel connected", {
      phoneNumber: this.signalConfig.phoneNumber,
    });
  }

  protected async disconnect(): Promise<void> {
    log.info("Disconnecting Signal channel...");

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }

    if (this.daemonProcess) {
      this.daemonProcess.kill("SIGTERM");
      this.daemonProcess = undefined;
    }

    this.receivingMessages = false;
    log.info("Signal channel disconnected");
  }

  protected async doSendMessage(
    channelUserId: string,
    content: string,
    attachments?: Attachment[],
  ): Promise<void> {
    const args = this.buildBaseArgs();
    args.push("send", "-m", content, channelUserId);

    // Attach files if provided
    if (attachments && attachments.length > 0) {
      const attachmentPaths = await this.prepareAttachments(attachments);
      if (attachmentPaths.length > 0) {
        args.push("-a", ...attachmentPaths);
      }
    }

    try {
      await execFileAsync(this.signalConfig.signalCliBin, args, {
        timeout: 30_000,
      });
      log.debug("Message sent to Signal user", { channelUserId });
    } catch (error) {
      log.error("Failed to send Signal message", {
        channelUserId,
        error: String(error),
      });
      throw new Error(`Failed to send Signal message: ${error}`);
    }
  }

  // ─── Daemon & Polling ─────────────────────────────────────────────

  private startDaemon(): void {
    const args = this.buildBaseArgs();
    args.push("daemon", "--json");

    try {
      this.daemonProcess = spawn(this.signalConfig.signalCliBin, args, {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let lineBuffer = "";

      this.daemonProcess.stdout?.on("data", (chunk: Buffer) => {
        lineBuffer += chunk.toString();
        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.trim()) {
            this.handleDaemonMessage(line.trim());
          }
        }
      });

      this.daemonProcess.stderr?.on("data", (chunk: Buffer) => {
        log.warn("signal-cli daemon stderr", { output: chunk.toString().trim() });
      });

      this.daemonProcess.on("exit", (code) => {
        log.warn("signal-cli daemon exited", { code });
        this.daemonProcess = undefined;
      });

      this.receivingMessages = true;
      log.info("signal-cli daemon started");
    } catch (error) {
      log.error("Failed to start signal-cli daemon", { error: String(error) });
    }
  }

  private handleDaemonMessage(jsonLine: string): void {
    try {
      const msg: SignalJsonMessage = JSON.parse(jsonLine);
      const envelope = msg.envelope;
      const dataMessage = envelope.dataMessage;

      if (!dataMessage || (!dataMessage.message && !dataMessage.attachments?.length)) {
        return; // Skip non-data messages (receipts, typing indicators, etc.)
      }

      const incoming: IncomingMessage = {
        channelType: "signal",
        channelUserId: envelope.sourceNumber ?? envelope.source,
        channelMessageId: String(dataMessage.timestamp),
        content: dataMessage.message ?? "",
        attachments: this.convertAttachments(dataMessage.attachments),
        timestamp: new Date(envelope.timestamp),
        raw: msg,
      };

      this.emitMessage(incoming).catch((err) => {
        log.error("Error processing Signal message", { error: String(err) });
      });
    } catch (error) {
      log.debug("Failed to parse daemon message", { jsonLine, error: String(error) });
    }
  }

  private startPolling(): void {
    // Polling is a fallback if the daemon is not active
    const intervalMs = this.signalConfig.pollIntervalMs ?? 5000;

    this.pollTimer = setInterval(async () => {
      if (this.receivingMessages) return; // Daemon is handling messages

      try {
        const args = this.buildBaseArgs();
        args.push("receive", "--json", "--timeout", "1");

        const { stdout } = await execFileAsync(
          this.signalConfig.signalCliBin,
          args,
          { timeout: 15_000 },
        );

        const lines = stdout.trim().split("\n").filter(Boolean);
        for (const line of lines) {
          this.handleDaemonMessage(line);
        }
      } catch {
        // Timeout or no messages — expected behavior
      }
    }, intervalMs);
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private buildBaseArgs(): string[] {
    const args: string[] = ["-u", this.signalConfig.phoneNumber];

    if (this.signalConfig.dataDir) {
      args.push("--config", this.signalConfig.dataDir);
    }

    return args;
  }

  private convertAttachments(
    signalAttachments?: SignalAttachment[],
  ): Attachment[] | undefined {
    if (!signalAttachments || signalAttachments.length === 0) return undefined;

    return signalAttachments.map((att) => ({
      type: this.getAttachmentType(att.contentType),
      mimeType: att.contentType,
      filename: att.filename ?? `attachment-${att.id}`,
      url: att.id, // signal-cli uses the attachment ID as a reference
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

  private async prepareAttachments(attachments: Attachment[]): Promise<string[]> {
    const paths: string[] = [];

    for (const att of attachments) {
      if (att.url && fs.existsSync(att.url)) {
        paths.push(att.url);
      } else if (att.data) {
        // Write buffer to a temp file
        const tmpDir = path.join(process.cwd(), ".arivuclaw", "tmp");
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }
        const tmpPath = path.join(
          tmpDir,
          att.filename ?? `attachment-${Date.now()}`,
        );
        fs.writeFileSync(tmpPath, att.data);
        paths.push(tmpPath);
      }
    }

    return paths;
  }
}
