/**
 * ArivuClaw Web UI Dashboard — Serves a real-time status dashboard.
 *
 * Provides an Express HTTP server with API endpoints for system health,
 * sessions, skills, channels, memory stats, providers, and configuration.
 * The root route serves a self-contained HTML dashboard with a dark theme.
 *
 * @module ui/dashboard
 */
import type { ArivuClawConfig, ChannelStatus, ProviderType, Session, SkillManifest } from "../core/types";
/** Memory statistics exposed by the memory subsystem. */
export interface MemoryStats {
    totalEntries: number;
    totalFacts: number;
    vectorDimensions: number;
    storageSizeBytes: number;
}
/** Configuration for the dashboard server. */
export interface DashboardConfig {
    /** Port to listen on (default: 7890). */
    port: number;
    /** Hostname to bind to (default: "127.0.0.1"). */
    host: string;
}
/** Data provider callbacks the dashboard uses to fetch live data. */
export interface DashboardDataProvider {
    getSessions(): Session[];
    getSkills(): SkillManifest[];
    getChannelStatuses(): ChannelStatus[];
    getMemoryStats(): MemoryStats;
    getProviders(): {
        type: ProviderType;
        name: string;
        model: string;
    }[];
    getConfig(): ArivuClawConfig;
    updateConfig(patch: Partial<ArivuClawConfig>): void;
}
/**
 * Generate a self-contained HTML string for the dashboard.
 * Includes inline CSS (dark theme) and JavaScript that polls the API.
 *
 * @returns Complete HTML document string.
 */
export declare function generateDashboardHTML(): string;
/**
 * Express-style HTTP server for the ArivuClaw web dashboard.
 *
 * @example
 * ```ts
 * const dashboard = new DashboardServer(dataProvider, { port: 7890, host: "0.0.0.0" });
 * await dashboard.start();
 * ```
 */
export declare class DashboardServer {
    private readonly log;
    private readonly config;
    private readonly data;
    private readonly routes;
    private server;
    /**
     * Create a new DashboardServer.
     *
     * @param dataProvider - Callbacks for fetching live system data.
     * @param config - Server configuration (port, host).
     */
    constructor(dataProvider: DashboardDataProvider, config?: Partial<DashboardConfig>);
    /**
     * Start the HTTP server.
     *
     * @returns Promise that resolves once the server is listening.
     */
    start(): Promise<void>;
    /**
     * Stop the HTTP server.
     */
    stop(): Promise<void>;
    /** Register all API routes. */
    private registerRoutes;
    /** Route an incoming HTTP request to the appropriate handler. */
    private handleRequest;
    /** Write a JSON response. */
    private json;
}
//# sourceMappingURL=dashboard.d.ts.map