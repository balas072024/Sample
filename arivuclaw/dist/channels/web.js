"use strict";
/**
 * ArivuClaw Web Channel — WebSocket-based web UI and API.
 *
 * Provides:
 * - WebSocket gateway for real-time chat
 * - REST API for integration
 * - Health check endpoint
 * - Static file serving for built-in web UI
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
exports.WebChannel = void 0;
const uuid_1 = require("uuid");
const base_1 = require("./base");
class WebChannel extends base_1.BaseChannel {
    type = "web";
    name = "Web (WebSocket + REST)";
    server = null;
    wss = null;
    clients = new Map();
    async connect() {
        const port = Number(this.config.credentials.port || 6799);
        this.log.info(`Starting web server on port ${port}...`);
        const express = (await Promise.resolve().then(() => __importStar(require("express")))).default;
        const { WebSocketServer } = await Promise.resolve().then(() => __importStar(require("ws")));
        const http = await Promise.resolve().then(() => __importStar(require("http")));
        const app = express();
        app.use(express.json());
        // Health endpoint
        app.get("/health", (_req, res) => {
            res.json({ status: "ok", clients: this.clients.size });
        });
        // REST API for sending messages
        app.post("/api/message", async (req, res) => {
            const { userId, content } = req.body;
            // Validate origin to prevent CVE-2026-25253 style attacks
            const origin = req.headers.origin;
            if (origin && !this.isAllowedOrigin(origin)) {
                res.status(403).json({ error: "Forbidden origin" });
                return;
            }
            await this.emitMessage({
                channelType: "web",
                channelUserId: userId || (0, uuid_1.v4)(),
                channelMessageId: (0, uuid_1.v4)(),
                content,
                timestamp: new Date(),
            });
            res.json({ ok: true });
        });
        this.server = http.createServer(app);
        this.wss = new WebSocketServer({ server: this.server });
        this.wss.on("connection", (ws, req) => {
            const clientId = (0, uuid_1.v4)();
            // Validate gateway URL origin
            const origin = req.headers.origin;
            if (origin && !this.isAllowedOrigin(origin)) {
                ws.close(4003, "Forbidden origin");
                return;
            }
            this.clients.set(clientId, { id: clientId, userId: clientId, ws });
            this.log.info(`Web client connected: ${clientId}`);
            ws.on("message", async (data) => {
                try {
                    const parsed = JSON.parse(data.toString());
                    await this.emitMessage({
                        channelType: "web",
                        channelUserId: clientId,
                        channelMessageId: (0, uuid_1.v4)(),
                        content: parsed.content,
                        timestamp: new Date(),
                    });
                }
                catch (err) {
                    this.log.warn(`Invalid WebSocket message from ${clientId}`);
                }
            });
            ws.on("close", () => {
                this.clients.delete(clientId);
                this.log.info(`Web client disconnected: ${clientId}`);
            });
        });
        this.server.listen(port, () => {
            this.log.info(`Web server listening on port ${port}`);
        });
    }
    async disconnect() {
        if (this.server) {
            this.server.close();
        }
        this.clients.clear();
        this.server = null;
        this.wss = null;
    }
    async doSendMessage(channelUserId, content, attachments) {
        const client = this.clients.get(channelUserId);
        if (!client) {
            this.log.warn(`Web client ${channelUserId} not found`);
            return;
        }
        client.ws.send(JSON.stringify({ type: "message", content }));
        this.log.info(`Sent message to web client ${channelUserId}`);
    }
    isAllowedOrigin(origin) {
        const allowed = this.config.options?.corsOrigins || ["http://localhost:6799"];
        return allowed.some((a) => origin.startsWith(a));
    }
}
exports.WebChannel = WebChannel;
//# sourceMappingURL=web.js.map