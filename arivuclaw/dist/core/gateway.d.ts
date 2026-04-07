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
import { EventEmitter } from "eventemitter3";
import type { ArivuClawConfig, ChannelAdapter, ChannelType, Session } from "./types";
import type { AgentRuntime } from "./agent-runtime";
import type { MemoryStore } from "./types";
export declare class Gateway extends EventEmitter<Record<string, (...args: unknown[]) => void>> {
    private config;
    private memoryStore;
    private channels;
    private sessions;
    private users;
    private securityGuard;
    private agentRuntime;
    private isRunning;
    constructor(config: ArivuClawConfig, memoryStore: MemoryStore);
    setAgentRuntime(runtime: AgentRuntime): void;
    registerChannel(adapter: ChannelAdapter): Promise<void>;
    unregisterChannel(type: ChannelType): Promise<void>;
    getChannel(type: ChannelType): ChannelAdapter | undefined;
    getActiveChannels(): ChannelType[];
    private handleIncomingMessage;
    /**
     * Handle built-in system commands from any channel.
     * Returns true if the message was a system command (and was handled).
     */
    private handleSystemCommand;
    private sendToChannel;
    routeMessage(fromChannel: ChannelType, toChannel: ChannelType, userId: string, content: string): Promise<void>;
    private resolveUser;
    /**
     * Link multiple channel identities to the same user.
     * Enables cross-channel session continuity.
     */
    linkUserChannel(userId: string, channelType: ChannelType, channelUserId: string): void;
    private getOrCreateSession;
    getSession(id: string): Session | undefined;
    start(): Promise<void>;
    shutdown(): Promise<void>;
    /**
     * Restart the gateway — shuts down all channels and re-initializes them.
     * Preserves sessions and user identities across restarts.
     */
    restart(): Promise<void>;
    getHealth(): {
        running: boolean;
        channels: {
            type: ChannelType;
            connected: boolean;
        }[];
        activeSessions: number;
        totalUsers: number;
    };
    private emitEvent;
}
//# sourceMappingURL=gateway.d.ts.map