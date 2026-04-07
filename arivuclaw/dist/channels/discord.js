"use strict";
/**
 * ArivuClaw Discord Channel — Via discord.js
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
exports.DiscordChannel = void 0;
const base_1 = require("./base");
class DiscordChannel extends base_1.BaseChannel {
    type = "discord";
    name = "Discord (discord.js)";
    client = null;
    async connect() {
        const token = this.config.credentials.botToken;
        if (!token)
            throw new Error("Discord bot token required");
        this.log.info("Starting Discord bot...");
        const { Client, GatewayIntentBits } = await Promise.resolve().then(() => __importStar(require("discord.js")));
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages,
            ],
        });
        this.client.on("messageCreate", async (message) => {
            if (message.author.bot)
                return;
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
    async disconnect() {
        if (this.client) {
            await this.client.destroy();
        }
        this.client = null;
    }
    async doSendMessage(channelUserId, content, attachments) {
        if (!this.client)
            throw new Error("Discord client not connected");
        const user = await this.client.users.fetch(channelUserId);
        await user.send(content);
        this.log.info(`Sent message to Discord user ${channelUserId}`);
    }
}
exports.DiscordChannel = DiscordChannel;
//# sourceMappingURL=discord.js.map