/**
 * ArivuClaw Health Dashboard — Real-time metrics.
 * Gap #21: Track uptime, response times, tokens, errors.
 */
interface MetricPoint {
    timestamp: number;
    value: number;
}
export declare class HealthDashboard {
    private startTime;
    private requests;
    private maxHistory;
    trackRequest(duration: number, tokens: number, success: boolean): void;
    getMetrics(): Record<string, unknown>;
    getHistogram(metric: "duration" | "tokens", minutes?: number): MetricPoint[];
    private formatUptime;
}
export {};
//# sourceMappingURL=health-dashboard.d.ts.map