"use strict";
/**
 * ArivuClaw Matrix Channel — Matrix protocol adapter.
 *
 * Uses matrix-js-sdk for communication over the Matrix open protocol.
 * Supports end-to-end encryption, rooms, and threads.
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
exports.MatrixChannel = void 0;
const base_1 = require("../base");
const logger_1 = require("../../utils/logger");
const log = logger_1.Logger.create("channel:matrix");
// ─── MatrixChannel ───────────────────────────────────────────────────
class MatrixChannel extends base_1.BaseChannel {
    type = "matrix";
    name = "Matrix";
    matrixConfig;
    client = null;
    roomUserMap = new Map(); // channelUserId -> roomId
    async initialize(config) {
        this.matrixConfig = {
            homeserverUrl: config.credentials["homeserverUrl"] ?? "",
            userId: config.credentials["userId"] ?? "",
            accessToken: config.credentials["accessToken"] ?? "",
            deviceId: config.credentials["deviceId"],
            enableEncryption: config.options?.["enableEncryption"] ?? false,
            cryptoStorePath: config.credentials["cryptoStorePath"],
            autoJoinRooms: config.options?.["autoJoinRooms"] ?? true,
            allowedRoomIds: config.options?.["allowedRoomIds"],
        };
        if (!this.matrixConfig.homeserverUrl || !this.matrixConfig.accessToken) {
            throw new Error("Matrix channel requires homeserverUrl and accessToken in credentials");
        }
        await super.initialize(config);
    }
    async connect() {
        log.info("Connecting Matrix channel...");
        try {
            // Dynamically import matrix-js-sdk to avoid hard dependency
            const sdk = await Promise.resolve(`${"matrix-js-sdk"}`).then(s => __importStar(require(s)));
            const clientOpts = {
                baseUrl: this.matrixConfig.homeserverUrl,
                accessToken: this.matrixConfig.accessToken,
                userId: this.matrixConfig.userId,
                deviceId: this.matrixConfig.deviceId,
            };
            if (this.matrixConfig.enableEncryption && this.matrixConfig.cryptoStorePath) {
                clientOpts["cryptoStore"] = this.matrixConfig.cryptoStorePath;
            }
            this.client = sdk.createClient(clientOpts);
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
        }
        catch (error) {
            log.error("Failed to connect Matrix channel", { error: String(error) });
            throw new Error(`Matrix connection failed. Ensure 'matrix-js-sdk' is installed: ${error}`);
        }
    }
    async disconnect() {
        log.info("Disconnecting Matrix channel...");
        if (this.client) {
            this.client.stopClient();
            this.client = null;
        }
        this.roomUserMap.clear();
        log.info("Matrix channel disconnected");
    }
    async doSendMessage(channelUserId, content, attachments) {
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
    async sendThreadReply(roomId, threadRootEventId, content) {
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
    async initializeEncryption() {
        if (!this.client)
            return;
        try {
            await this.client.initCrypto();
            // Trust all devices for simplicity (can be made stricter)
            this.client.setGlobalErrorOnUnknownDevices(false);
            log.info("E2E encryption initialized");
        }
        catch (error) {
            log.error("Failed to initialize E2E encryption", { error: String(error) });
            log.warn("Continuing without E2E encryption");
        }
    }
    // ─── Event Handling ────────────────────────────────────────────────
    registerEventHandlers() {
        if (!this.client)
            return;
        // Handle incoming messages
        this.client.on("Room.timeline", (...args) => {
            const event = args[0];
            const room = args[1];
            const toStartOfTimeline = args[2];
            if (toStartOfTimeline)
                return; // Ignore backfill
            this.handleTimelineEvent(event, room).catch((err) => {
                log.error("Error handling Matrix event", { error: String(err) });
            });
        });
        // Auto-join rooms on invite
        if (this.matrixConfig.autoJoinRooms) {
            this.client.on("RoomMember.membership", (...args) => {
                const event = args[0];
                const member = args[1];
                if (member.userId === this.matrixConfig.userId &&
                    event.getContent()["membership"] === "invite") {
                    const roomId = event.getRoomId();
                    // Check if the room is allowed
                    if (this.matrixConfig.allowedRoomIds &&
                        this.matrixConfig.allowedRoomIds.length > 0 &&
                        !this.matrixConfig.allowedRoomIds.includes(roomId)) {
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
        this.client.on("sync", (...args) => {
            const state = args[0];
            if (state === "PREPARED") {
                log.info("Matrix client sync complete");
            }
        });
    }
    async handleTimelineEvent(event, room) {
        // Only process room messages
        if (event.getType() !== "m.room.message")
            return;
        // Ignore our own messages
        if (event.getSender() === this.matrixConfig.userId)
            return;
        const roomId = event.getRoomId();
        // Check room allowlist
        if (this.matrixConfig.allowedRoomIds &&
            this.matrixConfig.allowedRoomIds.length > 0 &&
            !this.matrixConfig.allowedRoomIds.includes(roomId)) {
            return;
        }
        const content = event.getContent();
        const sender = event.getSender();
        // Map sender to room for replies
        this.roomUserMap.set(sender, roomId);
        // Determine if this is a thread reply
        const relation = event.getRelation();
        const threadRootId = relation?.rel_type === "m.thread" ? relation.event_id : undefined;
        const incoming = {
            channelType: "matrix",
            channelUserId: sender,
            channelMessageId: event.getId(),
            content: content["body"] ?? "",
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
    async sendAttachment(roomId, attachment) {
        if (!this.client)
            return;
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
        }
        else if (attachment.url) {
            await this.client.sendEvent(roomId, "m.room.message", {
                msgtype,
                body: attachment.filename ?? "file",
                url: attachment.url,
                info: { mimetype: attachment.mimeType },
            });
        }
    }
    extractAttachments(content) {
        const msgtype = content["msgtype"];
        if (!["m.image", "m.file", "m.audio", "m.video"].includes(msgtype)) {
            return undefined;
        }
        const info = content["info"];
        return [
            {
                type: this.matrixMsgTypeToAttType(msgtype),
                mimeType: info?.["mimetype"] ?? "application/octet-stream",
                filename: content["body"] ?? undefined,
                url: content["url"] ?? undefined,
            },
        ];
    }
    // ─── Helpers ──────────────────────────────────────────────────────
    getMsgType(attType) {
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
    matrixMsgTypeToAttType(msgtype) {
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
    markdownToHtml(text) {
        // Basic markdown to HTML conversion for Matrix formatted_body
        return text
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g, "<em>$1</em>")
            .replace(/`(.+?)`/g, "<code>$1</code>")
            .replace(/\n/g, "<br>");
    }
}
exports.MatrixChannel = MatrixChannel;
//# sourceMappingURL=matrix.js.map