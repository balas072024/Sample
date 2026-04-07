"use strict";
/**
 * ArivuClaw Gateway — The central hub connecting channels to the agent runtime.
 *
 * Improvements over OpenClaw:
 * - Input validation on all gateway URLs (prevents CVE-2026-25253 style attacks)
 * - Per-channel rate limiting
 * - Unified identity resolution across channels
 * - Health check endpoints
 * - Graceful shutdown with connection draining
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gateway = void 0;
const eventemitter3_1 = require("eventemitter3");
const uuid_1 = require("uuid");
const guard_1 = require("../security/guard");
const logger_1 = require("../utils/logger");
const log = logger_1.Logger.create("gateway");
class Gateway extends eventemitter3_1.EventEmitter {
    config;
    memoryStore;
    channels = new Map();
    sessions = new Map();
    users = new Map();
    securityGuard;
    agentRuntime;
    isRunning = false;
    constructor(config, memoryStore) {
        super();
        this.config = config;
        this.memoryStore = memoryStore;
        this.securityGuard = new guard_1.SecurityGuard(config.security);
    }
    setAgentRuntime(runtime) {
        this.agentRuntime = runtime;
    }
    // ─── Channel Management ──────────────────────────────────────────
    async registerChannel(adapter) {
        if (this.channels.has(adapter.type)) {
            throw new Error(`Channel ${adapter.type} already registered`);
        }
        const channelConfig = this.config.channels.find((c) => c.type === adapter.type);
        if (!channelConfig || !channelConfig.enabled) {
            log.warn(`Channel ${adapter.type} not enabled in config, skipping`);
            return;
        }
        adapter.onMessage(async (msg) => this.handleIncomingMessage(msg));
        await adapter.initialize(channelConfig);
        this.channels.set(adapter.type, adapter);
        this.emitEvent({ type: "channel.connected", data: { type: adapter.type } });
        log.info(`Channel registered: ${adapter.type} (${adapter.name})`);
    }
    async unregisterChannel(type) {
        const adapter = this.channels.get(type);
        if (adapter) {
            await adapter.shutdown();
            this.channels.delete(type);
            this.emitEvent({ type: "channel.disconnected", data: { type, reason: "unregistered" } });
        }
    }
    getChannel(type) {
        return this.channels.get(type);
    }
    getActiveChannels() {
        return Array.from(this.channels.keys());
    }
    // ─── Message Routing ─────────────────────────────────────────────
    async handleIncomingMessage(incoming) {
        try {
            // Security: Validate and sanitize input
            if (!this.securityGuard.validateInput(incoming)) {
                log.warn(`Blocked message from ${incoming.channelUserId}: failed validation`);
                return;
            }
            // Rate limiting
            if (!this.securityGuard.checkRateLimit(incoming.channelUserId, incoming.channelType)) {
                log.warn(`Rate limited: ${incoming.channelUserId} on ${incoming.channelType}`);
                await this.sendToChannel(incoming.channelType, incoming.channelUserId, "You're sending messages too quickly. Please wait a moment.");
                return;
            }
            // Handle system commands before routing to AI
            const handled = await this.handleSystemCommand(incoming);
            if (handled)
                return;
            this.emitEvent({ type: "message.received", data: incoming });
            // Resolve or create user identity
            const user = this.resolveUser(incoming.channelType, incoming.channelUserId);
            // Get or create session (cross-channel session continuity)
            const session = this.getOrCreateSession(user, incoming.channelType);
            // Build message object
            const message = {
                id: (0, uuid_1.v4)(),
                sessionId: session.id,
                role: "user",
                content: incoming.content,
                attachments: incoming.attachments,
                channelType: incoming.channelType,
                channelMessageId: incoming.channelMessageId,
                timestamp: incoming.timestamp,
            };
            session.messages.push(message);
            session.updatedAt = new Date();
            // Store in memory
            await this.memoryStore.store({
                id: message.id,
                userId: user.id,
                content: message.content,
                type: "conversation",
                source: incoming.channelType,
                timestamp: message.timestamp,
            });
            // Route to agent runtime
            const response = await this.agentRuntime.processMessage(session, message, user);
            // Send response back through the originating channel
            await this.sendToChannel(incoming.channelType, incoming.channelUserId, response.content);
            // Store assistant response
            const assistantMsg = {
                id: (0, uuid_1.v4)(),
                sessionId: session.id,
                role: "assistant",
                content: response.content,
                channelType: incoming.channelType,
                timestamp: new Date(),
            };
            session.messages.push(assistantMsg);
            this.emitEvent({
                type: "message.sent",
                data: { channelType: incoming.channelType, content: response.content },
            });
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            log.error(`Error handling message: ${errMsg}`);
            this.emitEvent({ type: "error", data: { message: errMsg } });
            // Build a helpful error message for the user
            let userError = "Sorry, I encountered an error processing your message.";
            if (errMsg.includes("401") || errMsg.includes("authentication") || errMsg.includes("api_key")) {
                userError += "\n\n**Cause:** Invalid or missing API key. Check your .env file and make sure your ANTHROPIC_API_KEY (or other provider key) is set correctly.";
            }
            else if (errMsg.includes("429") || errMsg.includes("rate")) {
                userError += "\n\n**Cause:** API rate limit reached. Wait a moment and try again.";
            }
            else if (errMsg.includes("fetch") || errMsg.includes("ECONNREFUSED") || errMsg.includes("network")) {
                userError += "\n\n**Cause:** Cannot reach the AI provider. Check your internet connection.";
            }
            else if (errMsg.includes("insufficient_quota") || errMsg.includes("billing")) {
                userError += "\n\n**Cause:** API quota exceeded. Check your billing/credits with your provider.";
            }
            else {
                userError += `\n\n**Error:** ${errMsg}`;
            }
            // Send error feedback to user
            try {
                await this.sendToChannel(incoming.channelType, incoming.channelUserId, userError);
            }
            catch {
                // Silent fallback — channel may be down
            }
        }
    }
    /**
     * Handle built-in system commands from any channel.
     * Returns true if the message was a system command (and was handled).
     */
    async handleSystemCommand(incoming) {
        const text = incoming.content.trim().toLowerCase();
        // /restart or "restart gateway"
        if (text === "/restart" || text === "restart gateway" || text === "/restart gateway") {
            await this.sendToChannel(incoming.channelType, incoming.channelUserId, "🔄 Restarting gateway... Hold on.");
            try {
                await this.restart();
                await this.sendToChannel(incoming.channelType, incoming.channelUserId, "✅ Gateway restarted successfully! All channels reconnected.");
            }
            catch (err) {
                await this.sendToChannel(incoming.channelType, incoming.channelUserId, `❌ Restart failed: ${err instanceof Error ? err.message : String(err)}`);
            }
            return true;
        }
        // /status
        if (text === "/status" || text === "gateway status") {
            const health = this.getHealth();
            const channelList = health.channels
                .map(c => `  ${c.type}: ${c.connected ? "✅ Connected" : "❌ Offline"}`)
                .join("\n");
            await this.sendToChannel(incoming.channelType, incoming.channelUserId, `🦀 ArivuClaw Status\n\nRunning: ${health.running ? "Yes" : "No"}\nSessions: ${health.activeSessions}\nUsers: ${health.totalUsers}\n\nChannels:\n${channelList}`);
            return true;
        }
        // /ping
        if (text === "/ping") {
            await this.sendToChannel(incoming.channelType, incoming.channelUserId, "🏓 Pong! Gateway is alive.");
            return true;
        }
        return false;
    }
    async sendToChannel(type, userId, content) {
        const channel = this.channels.get(type);
        if (!channel) {
            throw new Error(`Channel ${type} not registered`);
        }
        await channel.sendMessage(userId, content);
    }
    // ─── Cross-channel message routing ───────────────────────────────
    async routeMessage(fromChannel, toChannel, userId, content) {
        const user = this.users.get(userId);
        if (!user)
            throw new Error(`User ${userId} not found`);
        const targetChannelUserId = user.channels.get(toChannel);
        if (!targetChannelUserId) {
            throw new Error(`User ${userId} not linked on channel ${toChannel}`);
        }
        await this.sendToChannel(toChannel, targetChannelUserId, content);
    }
    // ─── User Identity Resolution ────────────────────────────────────
    resolveUser(channelType, channelUserId) {
        // Look for existing user with this channel identity
        for (const user of this.users.values()) {
            if (user.channels.get(channelType) === channelUserId) {
                return user;
            }
        }
        // Create new user
        const user = {
            id: (0, uuid_1.v4)(),
            displayName: `User-${channelUserId.slice(-4)}`,
            channels: new Map([[channelType, channelUserId]]),
            roles: ["user"],
            createdAt: new Date(),
        };
        this.users.set(user.id, user);
        return user;
    }
    /**
     * Link multiple channel identities to the same user.
     * Enables cross-channel session continuity.
     */
    linkUserChannel(userId, channelType, channelUserId) {
        const user = this.users.get(userId);
        if (!user)
            throw new Error(`User ${userId} not found`);
        user.channels.set(channelType, channelUserId);
        log.info(`Linked ${channelType}:${channelUserId} to user ${userId}`);
    }
    // ─── Session Management ──────────────────────────────────────────
    getOrCreateSession(user, channelType) {
        // Look for an active session for this user (cross-channel continuity)
        for (const session of this.sessions.values()) {
            if (session.userId === user.id) {
                const ageMs = Date.now() - session.updatedAt.getTime();
                if (ageMs < 30 * 60 * 1000) {
                    // 30-minute session window
                    return session;
                }
            }
        }
        const session = {
            id: (0, uuid_1.v4)(),
            userId: user.id,
            channelType,
            channelSessionId: (0, uuid_1.v4)(),
            messages: [],
            activeSkills: [],
            memoryContext: {
                shortTerm: [],
                longTerm: [],
                facts: [],
                relevanceScore: 0,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {},
        };
        this.sessions.set(session.id, session);
        this.emitEvent({ type: "session.created", data: { sessionId: session.id, userId: user.id } });
        return session;
    }
    getSession(id) {
        return this.sessions.get(id);
    }
    // ─── Lifecycle ───────────────────────────────────────────────────
    async start() {
        if (this.isRunning)
            return;
        log.info("ArivuClaw Gateway starting...");
        await this.memoryStore.initialize();
        for (const [type, adapter] of this.channels) {
            log.info(`  Channel ${type}: ${adapter.getStatus().connected ? "connected" : "pending"}`);
        }
        this.isRunning = true;
        log.info("ArivuClaw Gateway is running 🦀");
    }
    async shutdown() {
        if (!this.isRunning)
            return;
        log.info("ArivuClaw Gateway shutting down...");
        // Graceful shutdown: drain active sessions
        for (const [type, adapter] of this.channels) {
            try {
                await adapter.shutdown();
                log.info(`  Channel ${type}: disconnected`);
            }
            catch (error) {
                log.error(`  Error shutting down channel ${type}: ${error}`);
            }
        }
        await this.memoryStore.shutdown();
        this.channels.clear();
        this.isRunning = false;
        log.info("ArivuClaw Gateway stopped");
    }
    /**
     * Restart the gateway — shuts down all channels and re-initializes them.
     * Preserves sessions and user identities across restarts.
     */
    async restart() {
        log.info("ArivuClaw Gateway restarting...");
        // Save channel adapters before shutdown clears them
        const adapters = new Map(this.channels);
        // Shut down all channels gracefully
        for (const [type, adapter] of adapters) {
            try {
                await adapter.shutdown();
                log.info(`  Channel ${type}: disconnected for restart`);
            }
            catch (error) {
                log.error(`  Error shutting down channel ${type}: ${error}`);
            }
        }
        this.channels.clear();
        this.isRunning = false;
        // Re-register and reconnect all channels
        for (const [type, adapter] of adapters) {
            try {
                const channelConfig = this.config.channels.find((c) => c.type === type);
                if (channelConfig && channelConfig.enabled) {
                    adapter.onMessage(async (msg) => this.handleIncomingMessage(msg));
                    await adapter.initialize(channelConfig);
                    this.channels.set(type, adapter);
                    log.info(`  Channel ${type}: reconnected`);
                }
            }
            catch (error) {
                log.error(`  Failed to restart channel ${type}: ${error}`);
            }
        }
        try {
            await this.memoryStore.initialize();
        }
        catch (error) {
            log.warn(`Memory store re-init failed (non-critical): ${error}`);
        }
        this.isRunning = true;
        this.emitEvent({ type: "channel.connected", data: { type: "cli" } });
        log.info("ArivuClaw Gateway restarted successfully 🦀");
    }
    // ─── Health ──────────────────────────────────────────────────────
    getHealth() {
        return {
            running: this.isRunning,
            channels: Array.from(this.channels.entries()).map(([type, adapter]) => ({
                type,
                connected: adapter.getStatus().connected,
            })),
            activeSessions: this.sessions.size,
            totalUsers: this.users.size,
        };
    }
    emitEvent(event) {
        this.emit(event.type, event.data);
    }
}
exports.Gateway = Gateway;
//# sourceMappingURL=gateway.js.map