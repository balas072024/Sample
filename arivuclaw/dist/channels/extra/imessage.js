"use strict";
/**
 * ArivuClaw iMessage Channel — macOS-only iMessage adapter.
 *
 * Reads incoming messages from the iMessage SQLite database (chat.db)
 * and sends outgoing messages via AppleScript / osascript.
 * Only functional on macOS with iMessage configured.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.iMessageChannel = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const util_1 = require("util");
const base_1 = require("../base");
const logger_1 = require("../../utils/logger");
const log = logger_1.Logger.create("channel:imessage");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
// ─── Platform guard ──────────────────────────────────────────────────
function assertMacOS() {
    if (os.platform() !== "darwin") {
        throw new Error("iMessage channel is only available on macOS. " +
            `Current platform: ${os.platform()}`);
    }
}
// ─── iMessageChannel ─────────────────────────────────────────────────
class iMessageChannel extends base_1.BaseChannel {
    type = "imessage";
    name = "iMessage";
    imConfig;
    chatDbPath;
    pollTimer;
    lastProcessedRowId = 0;
    async initialize(config) {
        assertMacOS();
        const homeDir = os.homedir();
        this.imConfig = {
            chatDbPath: config.credentials["chatDbPath"] ??
                path.join(homeDir, "Library", "Messages", "chat.db"),
            pollIntervalMs: config.options?.["pollIntervalMs"] ?? 3000,
            allowedSenders: config.options?.["allowedSenders"],
        };
        this.chatDbPath = this.imConfig.chatDbPath;
        await super.initialize(config);
    }
    async connect() {
        assertMacOS();
        log.info("Connecting iMessage channel...");
        // Verify the chat database exists and is readable
        if (!fs.existsSync(this.chatDbPath)) {
            throw new Error(`iMessage database not found at ${this.chatDbPath}. ` +
                "Ensure iMessage is configured on this Mac.");
        }
        // Verify sqlite3 is available
        try {
            await execFileAsync("sqlite3", ["--version"], { timeout: 5_000 });
        }
        catch {
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
    async disconnect() {
        log.info("Disconnecting iMessage channel...");
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = undefined;
        }
        log.info("iMessage channel disconnected");
    }
    async doSendMessage(channelUserId, content, attachments) {
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
                }
                else if (att.data) {
                    const tmpPath = await this.writeTempFile(att);
                    await this.sendFileViaAppleScript(channelUserId, tmpPath);
                }
            }
        }
    }
    // ─── AppleScript Sending ───────────────────────────────────────────
    async sendViaAppleScript(recipient, message) {
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
        }
        catch (error) {
            log.error("Failed to send iMessage", {
                recipient,
                error: String(error),
            });
            throw new Error(`Failed to send iMessage to ${recipient}: ${error}`);
        }
    }
    async sendFileViaAppleScript(recipient, filePath) {
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
        }
        catch (error) {
            log.error("Failed to send iMessage file", {
                recipient,
                error: String(error),
            });
        }
    }
    // ─── Database Polling ─────────────────────────────────────────────
    startPolling() {
        const intervalMs = this.imConfig.pollIntervalMs ?? 3000;
        this.pollTimer = setInterval(async () => {
            try {
                await this.pollNewMessages();
            }
            catch (error) {
                log.error("iMessage poll error", { error: String(error) });
            }
        }, intervalMs);
    }
    async pollNewMessages() {
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
            const { stdout } = await execFileAsync("sqlite3", ["-json", this.chatDbPath, query], { timeout: 10_000 });
            if (!stdout.trim())
                return;
            let rows;
            try {
                rows = JSON.parse(stdout);
            }
            catch {
                return;
            }
            for (const row of rows) {
                // Update the high-water mark
                if (row.rowid > this.lastProcessedRowId) {
                    this.lastProcessedRowId = row.rowid;
                }
                // Filter by allowed senders if configured
                if (this.imConfig.allowedSenders &&
                    !this.imConfig.allowedSenders.includes(row.handle_id)) {
                    continue;
                }
                // Fetch attachments if present
                let attachments;
                if (row.cache_has_attachments) {
                    attachments = await this.fetchAttachments(row.rowid);
                }
                const incoming = {
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
        }
        catch (error) {
            log.debug("Failed to poll iMessage database", { error: String(error) });
        }
    }
    async fetchAttachments(messageRowId) {
        const query = `
      SELECT a.filename, a.mime_type
      FROM attachment a
      JOIN message_attachment_join maj ON a.ROWID = maj.attachment_id
      WHERE maj.message_id = ${messageRowId};
    `;
        try {
            const { stdout } = await execFileAsync("sqlite3", ["-json", this.chatDbPath, query], { timeout: 5_000 });
            if (!stdout.trim())
                return [];
            const rows = JSON.parse(stdout);
            return rows.map((row) => ({
                type: this.getAttachmentType(row.mime_type),
                mimeType: row.mime_type ?? "application/octet-stream",
                filename: row.filename ? path.basename(row.filename) : undefined,
                url: row.filename?.replace("~", os.homedir()),
            }));
        }
        catch {
            return [];
        }
    }
    async getLatestRowId() {
        try {
            const { stdout } = await execFileAsync("sqlite3", [this.chatDbPath, "SELECT MAX(ROWID) FROM message;"], { timeout: 5_000 });
            return parseInt(stdout.trim(), 10) || 0;
        }
        catch {
            return 0;
        }
    }
    // ─── Helpers ──────────────────────────────────────────────────────
    convertCoreDataTimestamp(coreDataTime) {
        // macOS Core Data timestamps are nanoseconds since 2001-01-01
        const CORE_DATA_EPOCH = 978307200; // seconds between Unix epoch and 2001-01-01
        const seconds = coreDataTime / 1_000_000_000 + CORE_DATA_EPOCH;
        return new Date(seconds * 1000);
    }
    getAttachmentType(mimeType) {
        if (!mimeType)
            return "file";
        if (mimeType.startsWith("image/"))
            return "image";
        if (mimeType.startsWith("audio/"))
            return "audio";
        if (mimeType.startsWith("video/"))
            return "video";
        return "file";
    }
    async writeTempFile(attachment) {
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
exports.iMessageChannel = iMessageChannel;
//# sourceMappingURL=imessage.js.map