"use strict";
/**
 * ArivuClaw Base Channel Adapter — Abstract base for all channel implementations.
 *
 * Provides common functionality:
 * - Connection state management
 * - Message queue for offline buffering
 * - Reconnection logic with exponential backoff
 * - Unified logging
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseChannel = void 0;
const logger_1 = require("../utils/logger");
class BaseChannel {
    config;
    connected = false;
    messageHandler;
    messageQueue = [];
    log;
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    reconnectTimer;
    constructor() {
        this.log = logger_1.Logger.create(`channel:${this.constructor.name}`);
    }
    async initialize(config) {
        this.config = config;
        this.log.info(`Initializing ${this.name} channel...`);
        try {
            await this.connect();
            this.connected = true;
            this.reconnectAttempts = 0;
            this.log.info(`${this.name} channel connected`);
            // Flush queued messages
            await this.flushQueue();
        }
        catch (error) {
            this.log.error(`Failed to initialize ${this.name}: ${error}`);
            this.scheduleReconnect();
        }
    }
    async shutdown() {
        this.log.info(`Shutting down ${this.name} channel...`);
        if (this.reconnectTimer)
            clearTimeout(this.reconnectTimer);
        await this.disconnect();
        this.connected = false;
    }
    onMessage(handler) {
        this.messageHandler = handler;
    }
    async sendMessage(channelUserId, content, attachments) {
        if (!this.connected) {
            this.messageQueue.push({ userId: channelUserId, content, attachments });
            this.log.warn(`${this.name} not connected, message queued`);
            return;
        }
        await this.doSendMessage(channelUserId, content, attachments);
    }
    getStatus() {
        return {
            type: this.type,
            connected: this.connected,
            lastActivity: undefined,
        };
    }
    // ─── Helpers ─────────────────────────────────────────────────────
    async emitMessage(msg) {
        if (this.messageHandler) {
            await this.messageHandler(msg);
        }
    }
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.log.error(`Max reconnect attempts reached for ${this.name}`);
            return;
        }
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30_000);
        this.reconnectAttempts++;
        this.log.info(`Reconnecting ${this.name} in ${delay}ms (attempt ${this.reconnectAttempts})`);
        this.reconnectTimer = setTimeout(async () => {
            try {
                await this.connect();
                this.connected = true;
                this.reconnectAttempts = 0;
                await this.flushQueue();
            }
            catch {
                this.scheduleReconnect();
            }
        }, delay);
    }
    async flushQueue() {
        while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            try {
                await this.doSendMessage(msg.userId, msg.content, msg.attachments);
            }
            catch (error) {
                this.log.error(`Failed to flush queued message: ${error}`);
                this.messageQueue.unshift(msg);
                break;
            }
        }
    }
}
exports.BaseChannel = BaseChannel;
//# sourceMappingURL=base.js.map