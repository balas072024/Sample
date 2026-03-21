"use strict";
/**
 * ArivuClaw WhatsApp Channel — Via Baileys (WhatsApp Web protocol).
 * Full media support: text, images, voice notes, video, audio, documents.
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
exports.WhatsAppChannel = void 0;
const uuid_1 = require("uuid");
const base_1 = require("./base");
class WhatsAppChannel extends base_1.BaseChannel {
    type = "whatsapp";
    name = "WhatsApp (Baileys)";
    client = null;
    async connect() {
        this.log.info("Connecting to WhatsApp Web...");
        const { default: makeWASocket, useMultiFileAuthState, downloadMediaMessage } = await Promise.resolve().then(() => __importStar(require("baileys")));
        const { state, saveCreds } = await useMultiFileAuthState("./auth/whatsapp");
        this.client = makeWASocket({ auth: state, printQRInTerminal: true });
        this.client.ev.on("creds.update", saveCreds);
        // Store downloadMediaMessage for use in parseMessage
        this._downloadMedia = downloadMediaMessage;
        // Register message listener
        this.client.ev.on("messages.upsert", async ({ messages }) => {
            for (const msg of messages) {
                if (!msg.key.fromMe && msg.message) {
                    await this.emitMessage(await this.parseMessage(msg));
                }
            }
        });
        this.log.info("WhatsApp channel ready (pair via QR code)");
    }
    _downloadMedia = null;
    async disconnect() {
        if (this.client) {
            this.client.end();
        }
        this.client = null;
    }
    async doSendMessage(channelUserId, content, attachments) {
        if (!this.client)
            throw new Error("WhatsApp not connected");
        await this.client.sendMessage(channelUserId, { text: content });
        if (attachments) {
            for (const attachment of attachments) {
                await this.client.sendMessage(channelUserId, {
                    [attachment.type]: attachment.data || { url: attachment.url },
                    mimetype: attachment.mimeType,
                    fileName: attachment.filename,
                });
            }
        }
        this.log.info(`Sent message to WhatsApp user ${channelUserId}`);
    }
    async parseMessage(raw) {
        const msg = raw;
        const key = msg.key;
        const message = msg.message;
        const base = {
            channelType: "whatsapp",
            channelUserId: key?.remoteJid || "",
            channelMessageId: key?.id || (0, uuid_1.v4)(),
            content: this.extractText(message),
            timestamp: new Date(),
            raw,
        };
        if (!message)
            return base;
        // Extract media attachments
        const attachments = await this.extractAttachments(msg, message);
        if (attachments.length > 0) {
            base.attachments = attachments;
            // If content is empty placeholder, add a prompt
            if (base.content === "[non-text message]") {
                base.content = "Please analyze this media.";
            }
        }
        return base;
    }
    async extractAttachments(msg, message) {
        const attachments = [];
        try {
            // Image message
            const imageMsg = message.imageMessage;
            if (imageMsg) {
                const buffer = await this.downloadWhatsAppMedia(msg);
                if (buffer) {
                    const mime = imageMsg.mimetype || "image/jpeg";
                    const base64 = buffer.toString("base64");
                    attachments.push({
                        type: "image",
                        url: `data:${mime};base64,${base64}`,
                        data: buffer,
                        mimeType: mime,
                        filename: `image_${Date.now()}.jpg`,
                    });
                }
            }
            // Video message
            const videoMsg = message.videoMessage;
            if (videoMsg) {
                const buffer = await this.downloadWhatsAppMedia(msg);
                if (buffer) {
                    const mime = videoMsg.mimetype || "video/mp4";
                    const base64 = buffer.toString("base64");
                    attachments.push({
                        type: "video",
                        url: `data:${mime};base64,${base64}`,
                        data: buffer,
                        mimeType: mime,
                        filename: `video_${Date.now()}.mp4`,
                    });
                }
            }
            // Audio/voice message
            const audioMsg = message.audioMessage;
            if (audioMsg) {
                const buffer = await this.downloadWhatsAppMedia(msg);
                if (buffer) {
                    const mime = audioMsg.mimetype || "audio/ogg";
                    const base64 = buffer.toString("base64");
                    attachments.push({
                        type: "audio",
                        url: `data:${mime};base64,${base64}`,
                        data: buffer,
                        mimeType: mime,
                        filename: audioMsg.ptt ? `voice_${Date.now()}.ogg` : `audio_${Date.now()}.mp3`,
                    });
                }
            }
            // Document message
            const docMsg = message.documentMessage;
            if (docMsg) {
                const buffer = await this.downloadWhatsAppMedia(msg);
                if (buffer) {
                    const mime = docMsg.mimetype || "application/octet-stream";
                    const filename = docMsg.fileName || `doc_${Date.now()}`;
                    const base64 = buffer.toString("base64");
                    const type = mime.startsWith("image/") ? "image"
                        : mime.startsWith("video/") ? "video"
                            : mime.startsWith("audio/") ? "audio"
                                : "file";
                    attachments.push({
                        type,
                        url: `data:${mime};base64,${base64}`,
                        data: buffer,
                        mimeType: mime,
                        filename,
                    });
                }
            }
            // Sticker message
            const stickerMsg = message.stickerMessage;
            if (stickerMsg) {
                const buffer = await this.downloadWhatsAppMedia(msg);
                if (buffer) {
                    const mime = stickerMsg.mimetype || "image/webp";
                    const base64 = buffer.toString("base64");
                    attachments.push({
                        type: "image",
                        url: `data:${mime};base64,${base64}`,
                        data: buffer,
                        mimeType: mime,
                        filename: `sticker_${Date.now()}.webp`,
                    });
                }
            }
        }
        catch (error) {
            this.log.error(`Failed to extract WhatsApp media: ${error instanceof Error ? error.message : error}`);
        }
        return attachments;
    }
    async downloadWhatsAppMedia(msg) {
        try {
            if (this._downloadMedia) {
                return await this._downloadMedia(msg, this.client);
            }
            return null;
        }
        catch (error) {
            this.log.error(`WhatsApp media download failed: ${error instanceof Error ? error.message : error}`);
            return null;
        }
    }
    extractText(message) {
        if (!message)
            return "";
        const conv = message.conversation;
        if (conv)
            return conv;
        const extended = message.extendedTextMessage;
        if (extended?.text)
            return extended.text;
        // Captions on media messages
        const imageMsg = message.imageMessage;
        if (imageMsg?.caption)
            return imageMsg.caption;
        const videoMsg = message.videoMessage;
        if (videoMsg?.caption)
            return videoMsg.caption;
        const docMsg = message.documentMessage;
        if (docMsg?.caption)
            return docMsg.caption;
        // Check if it's a media message (will be handled by attachments)
        if (message.imageMessage || message.videoMessage || message.audioMessage ||
            message.documentMessage || message.stickerMessage) {
            return "[non-text message]";
        }
        return "[non-text message]";
    }
}
exports.WhatsAppChannel = WhatsAppChannel;
//# sourceMappingURL=whatsapp.js.map