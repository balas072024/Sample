"use strict";
/**
 * ArivuClaw Slack Channel — Via @slack/bolt
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
exports.SlackChannel = void 0;
const base_1 = require("./base");
class SlackChannel extends base_1.BaseChannel {
    type = "slack";
    name = "Slack (Bolt)";
    app = null;
    async connect() {
        const { botToken, appToken, signingSecret } = this.config.credentials;
        if (!botToken)
            throw new Error("Slack bot token required");
        this.log.info("Starting Slack app...");
        const { App } = await Promise.resolve().then(() => __importStar(require("@slack/bolt")));
        this.app = new App({
            token: botToken,
            appToken: appToken,
            signingSecret: signingSecret,
            socketMode: !!appToken,
        });
        this.app.message(async ({ message, say }) => {
            if (message.subtype)
                return;
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
    async disconnect() {
        if (this.app) {
            await this.app.stop();
        }
        this.app = null;
    }
    async doSendMessage(channelUserId, content, attachments) {
        if (!this.app)
            throw new Error("Slack app not connected");
        await this.app.client.chat.postMessage({
            channel: channelUserId,
            text: content,
        });
        this.log.info(`Sent message to Slack channel ${channelUserId}`);
    }
}
exports.SlackChannel = SlackChannel;
//# sourceMappingURL=slack.js.map