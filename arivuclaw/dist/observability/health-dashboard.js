"use strict";
/**
 * ArivuClaw Health Dashboard — Real-time metrics.
 * Gap #21: Track uptime, response times, tokens, errors.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthDashboard = void 0;
const logger_1 = require("../utils/logger");
const log = logger_1.Logger.create("health");
class HealthDashboard {
    startTime = Date.now();
    requests = [];
    maxHistory = 86400; // 24h of per-second data
    trackRequest(duration, tokens, success) {
        this.requests.push({ duration, tokens, success, timestamp: Date.now() });
        if (this.requests.length > this.maxHistory)
            this.requests.shift();
    }
    getMetrics() {
        const now = Date.now();
        const lastMinute = this.requests.filter((r) => now - r.timestamp < 60_000);
        const lastHour = this.requests.filter((r) => now - r.timestamp < 3_600_000);
        return {
            uptime: Math.floor((now - this.startTime) / 1000),
            uptimeHuman: this.formatUptime(now - this.startTime),
            requestsPerMinute: lastMinute.length,
            requestsPerHour: lastHour.length,
            avgResponseTime: lastHour.length > 0 ? Math.round(lastHour.reduce((s, r) => s + r.duration, 0) / lastHour.length) : 0,
            tokensUsedLastHour: lastHour.reduce((s, r) => s + r.tokens, 0),
            tokensUsedTotal: this.requests.reduce((s, r) => s + r.tokens, 0),
            errorRate: lastHour.length > 0 ? (lastHour.filter((r) => !r.success).length / lastHour.length * 100).toFixed(1) + "%" : "0%",
            totalRequests: this.requests.length,
            memoryUsage: process.memoryUsage(),
        };
    }
    getHistogram(metric, minutes = 60) {
        const cutoff = Date.now() - minutes * 60_000;
        const filtered = this.requests.filter((r) => r.timestamp > cutoff);
        const bucketSize = 60_000; // 1 minute buckets
        const buckets = new Map();
        for (const r of filtered) {
            const bucket = Math.floor(r.timestamp / bucketSize) * bucketSize;
            if (!buckets.has(bucket))
                buckets.set(bucket, []);
            buckets.get(bucket).push(metric === "duration" ? r.duration : r.tokens);
        }
        return Array.from(buckets.entries())
            .map(([ts, vals]) => ({ timestamp: ts, value: vals.reduce((s, v) => s + v, 0) / vals.length }))
            .sort((a, b) => a.timestamp - b.timestamp);
    }
    formatUptime(ms) {
        const s = Math.floor(ms / 1000);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        return `${h}h ${m}m ${s % 60}s`;
    }
}
exports.HealthDashboard = HealthDashboard;
//# sourceMappingURL=health-dashboard.js.map