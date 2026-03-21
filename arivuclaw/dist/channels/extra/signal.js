"use strict";
/**
 * ArivuClaw Signal Channel — Signal messenger adapter via signal-cli.
 *
 * Uses the signal-cli daemon (JSON-RPC mode) for sending/receiving messages
 * over the Signal Protocol. Supports text, images, and file attachments.
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
exports.SignalChannel = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const util_1 = require("util");
const base_1 = require("../base");
const logger_1 = require("../../utils/logger");
const log = logger_1.Logger.create("channel:signal");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
// ─── SignalChannel ────────────────────────────────────────────────────
class SignalChannel extends base_1.BaseChannel {
    type = "signal";
    name = "Signal";
    signalConfig;
    pollTimer;
    daemonProcess;
    receivingMessages = false;
    async initialize(config) {
        this.signalConfig = {
            signalCliBin: config.credentials["signalCliBin"] ?? "signal-cli",
            phoneNumber: config.credentials["phoneNumber"] ?? "",
            dataDir: config.credentials["dataDir"],
            pollIntervalMs: config.options?.["pollIntervalMs"] ?? 5000,
        };
        if (!this.signalConfig.phoneNumber) {
            throw new Error("Signal channel requires a phoneNumber in credentials");
        }
        await super.initialize(config);
    }
    async connect() {
        log.info("Connecting to Signal via signal-cli...");
        // Verify signal-cli is available
        try {
            await execFileAsync(this.signalConfig.signalCliBin, ["--version"], {
                timeout: 10_000,
            });
        }
        catch (error) {
            throw new Error(`signal-cli not found at "${this.signalConfig.signalCliBin}": ${error}`);
        }
        // Start the JSON-RPC daemon for receiving messages
        this.startDaemon();
        // Start polling for incoming messages
        this.startPolling();
        log.info("Signal channel connected", {
            phoneNumber: this.signalConfig.phoneNumber,
        });
    }
    async disconnect() {
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
    async doSendMessage(channelUserId, content, attachments) {
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
        }
        catch (error) {
            log.error("Failed to send Signal message", {
                channelUserId,
                error: String(error),
            });
            throw new Error(`Failed to send Signal message: ${error}`);
        }
    }
    // ─── Daemon & Polling ─────────────────────────────────────────────
    startDaemon() {
        const args = this.buildBaseArgs();
        args.push("daemon", "--json");
        try {
            this.daemonProcess = (0, child_process_1.spawn)(this.signalConfig.signalCliBin, args, {
                stdio: ["ignore", "pipe", "pipe"],
            });
            let lineBuffer = "";
            this.daemonProcess.stdout?.on("data", (chunk) => {
                lineBuffer += chunk.toString();
                const lines = lineBuffer.split("\n");
                lineBuffer = lines.pop() ?? "";
                for (const line of lines) {
                    if (line.trim()) {
                        this.handleDaemonMessage(line.trim());
                    }
                }
            });
            this.daemonProcess.stderr?.on("data", (chunk) => {
                log.warn("signal-cli daemon stderr", { output: chunk.toString().trim() });
            });
            this.daemonProcess.on("exit", (code) => {
                log.warn("signal-cli daemon exited", { code });
                this.daemonProcess = undefined;
            });
            this.receivingMessages = true;
            log.info("signal-cli daemon started");
        }
        catch (error) {
            log.error("Failed to start signal-cli daemon", { error: String(error) });
        }
    }
    handleDaemonMessage(jsonLine) {
        try {
            const msg = JSON.parse(jsonLine);
            const envelope = msg.envelope;
            const dataMessage = envelope.dataMessage;
            if (!dataMessage || (!dataMessage.message && !dataMessage.attachments?.length)) {
                return; // Skip non-data messages (receipts, typing indicators, etc.)
            }
            const incoming = {
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
        }
        catch (error) {
            log.debug("Failed to parse daemon message", { jsonLine, error: String(error) });
        }
    }
    startPolling() {
        // Polling is a fallback if the daemon is not active
        const intervalMs = this.signalConfig.pollIntervalMs ?? 5000;
        this.pollTimer = setInterval(async () => {
            if (this.receivingMessages)
                return; // Daemon is handling messages
            try {
                const args = this.buildBaseArgs();
                args.push("receive", "--json", "--timeout", "1");
                const { stdout } = await execFileAsync(this.signalConfig.signalCliBin, args, { timeout: 15_000 });
                const lines = stdout.trim().split("\n").filter(Boolean);
                for (const line of lines) {
                    this.handleDaemonMessage(line);
                }
            }
            catch {
                // Timeout or no messages — expected behavior
            }
        }, intervalMs);
    }
    // ─── Helpers ──────────────────────────────────────────────────────
    buildBaseArgs() {
        const args = ["-u", this.signalConfig.phoneNumber];
        if (this.signalConfig.dataDir) {
            args.push("--config", this.signalConfig.dataDir);
        }
        return args;
    }
    convertAttachments(signalAttachments) {
        if (!signalAttachments || signalAttachments.length === 0)
            return undefined;
        return signalAttachments.map((att) => ({
            type: this.getAttachmentType(att.contentType),
            mimeType: att.contentType,
            filename: att.filename ?? `attachment-${att.id}`,
            url: att.id, // signal-cli uses the attachment ID as a reference
        }));
    }
    getAttachmentType(mimeType) {
        if (mimeType.startsWith("image/"))
            return "image";
        if (mimeType.startsWith("audio/"))
            return "audio";
        if (mimeType.startsWith("video/"))
            return "video";
        return "file";
    }
    async prepareAttachments(attachments) {
        const paths = [];
        for (const att of attachments) {
            if (att.url && fs.existsSync(att.url)) {
                paths.push(att.url);
            }
            else if (att.data) {
                // Write buffer to a temp file
                const tmpDir = path.join(process.cwd(), ".arivuclaw", "tmp");
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }
                const tmpPath = path.join(tmpDir, att.filename ?? `attachment-${Date.now()}`);
                fs.writeFileSync(tmpPath, att.data);
                paths.push(tmpPath);
            }
        }
        return paths;
    }
}
exports.SignalChannel = SignalChannel;
//# sourceMappingURL=signal.js.map