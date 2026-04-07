"use strict";
/**
 * ArivuClaw Microsoft Teams Channel — Bot Framework adapter.
 *
 * Integrates with Microsoft Teams using the Bot Framework SDK.
 * Supports text messages, adaptive cards, and file attachments.
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
exports.TeamsChannel = void 0;
const base_1 = require("../base");
const logger_1 = require("../../utils/logger");
const log = logger_1.Logger.create("channel:teams");
// ─── TeamsChannel ────────────────────────────────────────────────────
class TeamsChannel extends base_1.BaseChannel {
    type = "teams";
    name = "Microsoft Teams";
    teamsConfig;
    adapter = null;
    conversationRefs = new Map();
    server = null;
    async initialize(config) {
        this.teamsConfig = {
            appId: config.credentials["appId"] ?? "",
            appPassword: config.credentials["appPassword"] ?? "",
            tenantId: config.credentials["tenantId"],
            port: config.options?.["port"] ?? 3978,
        };
        if (!this.teamsConfig.appId || !this.teamsConfig.appPassword) {
            throw new Error("Teams channel requires appId and appPassword in credentials");
        }
        await super.initialize(config);
    }
    async connect() {
        log.info("Connecting Microsoft Teams channel...");
        try {
            // Dynamically import botbuilder to avoid hard dependency
            const botbuilder = await Promise.resolve(`${"botbuilder"}`).then(s => __importStar(require(s)));
            const credentials = new botbuilder.MicrosoftAppCredentials(this.teamsConfig.appId, this.teamsConfig.appPassword);
            this.adapter = new botbuilder.BotFrameworkAdapter({
                appId: this.teamsConfig.appId,
                appPassword: this.teamsConfig.appPassword,
            });
            // Start HTTP server to receive messages from Teams
            const http = await Promise.resolve().then(() => __importStar(require("http")));
            const port = this.teamsConfig.port ?? 3978;
            this.server = http.createServer(async (req, res) => {
                if (req.method === "POST" && req.url === "/api/messages") {
                    await this.adapter.processActivity(req, res, async (context) => {
                        await this.handleIncomingActivity(context);
                    });
                }
                else {
                    res.writeHead(200);
                    res.end("ArivuClaw Teams Bot is running");
                }
            });
            await new Promise((resolve) => {
                this.server.listen(port, () => {
                    log.info("Teams bot listening", { port });
                    resolve();
                });
            });
            log.info("Microsoft Teams channel connected", { port });
        }
        catch (error) {
            log.error("Failed to connect Teams channel", { error: String(error) });
            throw new Error(`Teams connection failed. Ensure 'botbuilder' package is installed: ${error}`);
        }
    }
    async disconnect() {
        log.info("Disconnecting Microsoft Teams channel...");
        if (this.server) {
            this.server.close();
            this.server = null;
        }
        this.adapter = null;
        this.conversationRefs.clear();
        log.info("Microsoft Teams channel disconnected");
    }
    async doSendMessage(channelUserId, content, attachments) {
        const reference = this.conversationRefs.get(channelUserId);
        if (!reference) {
            log.warn("No conversation reference for Teams user", { channelUserId });
            throw new Error(`No active conversation with Teams user ${channelUserId}. ` +
                "The user must message the bot first.");
        }
        if (!this.adapter) {
            throw new Error("Teams adapter not initialized");
        }
        await this.adapter.continueConversation(reference, async (context) => {
            const activity = {
                type: "message",
                text: content,
            };
            // Attach adaptive cards or files
            if (attachments && attachments.length > 0) {
                activity.attachments = attachments.map((att) => this.convertToTeamsAttachment(att));
            }
            await context.sendActivity(activity);
        });
        log.debug("Message sent to Teams user", { channelUserId });
    }
    // ─── Adaptive Card Helpers ─────────────────────────────────────────
    /**
     * Send an adaptive card to a Teams user.
     */
    async sendAdaptiveCard(channelUserId, card) {
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
    buildTextCard(title, body) {
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
    buildConfirmationCard(question, yesData, noData) {
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
    async handleIncomingActivity(context) {
        const activity = context.activity;
        // Store conversation reference for proactive messaging
        const reference = {
            activityId: activity.id,
            user: activity.from,
            conversation: activity.conversation,
            channelId: activity.channelId,
            serviceUrl: activity.serviceUrl,
        };
        this.conversationRefs.set(activity.from.id, reference);
        if (activity.type === "message") {
            const incoming = {
                channelType: "teams",
                channelUserId: activity.from.id,
                channelMessageId: activity.id,
                content: activity.text ?? "",
                attachments: this.convertFromTeamsAttachments(activity.attachments),
                timestamp: new Date(activity.timestamp),
                raw: activity,
            };
            await this.emitMessage(incoming);
        }
        else if (activity.type === "invoke" && activity.value) {
            // Handle adaptive card action submissions
            const incoming = {
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
    convertToTeamsAttachment(attachment) {
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
    convertFromTeamsAttachments(teamsAttachments) {
        if (!teamsAttachments || teamsAttachments.length === 0)
            return undefined;
        return teamsAttachments.map((att) => ({
            type: this.getAttachmentType(att.contentType),
            mimeType: att.contentType,
            filename: att.name,
            url: att.contentUrl,
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
}
exports.TeamsChannel = TeamsChannel;
//# sourceMappingURL=teams.js.map