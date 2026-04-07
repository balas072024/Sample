"use strict";
/**
 * ArivuClaw Observability — Audit logging, metrics, and tracing.
 *
 * Provides structured telemetry for the entire system:
 * - TelemetryService: unified facade for audit, metrics, and tracing.
 * - MetricsCollector: tracks token usage, latency, error rates, etc.
 * - AuditLogger: writes structured JSON audit logs with file rotation.
 *
 * @module observability/telemetry
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
exports.TelemetryService = exports.AuditLogger = exports.MetricsCollector = void 0;
exports.getMetricsSummary = getMetricsSummary;
const logger_1 = require("../utils/logger");
// ─── Metrics Collector ───────────────────────────────────────────────
/**
 * Collects and aggregates runtime metrics:
 * tokensUsed, responseTimeMs, toolCallCount, errorCount,
 * activeSessionCount, and messagesPerMinute.
 *
 * @example
 * ```ts
 * const metrics = new MetricsCollector();
 * metrics.recordTokens(150);
 * metrics.recordResponseTime(320);
 * const summary = metrics.getSummary();
 * ```
 */
class MetricsCollector {
    log = logger_1.Logger.create("MetricsCollector");
    tokensUsed = 0;
    responseTimes = [];
    toolCallCounts = new Map();
    errorCount = 0;
    activeSessionCount = 0;
    messageTimestamps = [];
    startTime = Date.now();
    /**
     * Record tokens consumed by an LLM call.
     *
     * @param count - Number of tokens used.
     */
    recordTokens(count) {
        this.tokensUsed += count;
    }
    /**
     * Record a response time measurement.
     *
     * @param ms - Response time in milliseconds.
     */
    recordResponseTime(ms) {
        this.responseTimes.push(ms);
        // Keep only last 1000 measurements to avoid memory growth
        if (this.responseTimes.length > 1000) {
            this.responseTimes = this.responseTimes.slice(-500);
        }
    }
    /**
     * Record a tool call.
     *
     * @param toolName - Name of the tool that was called.
     */
    recordToolCall(toolName) {
        const current = this.toolCallCounts.get(toolName) ?? 0;
        this.toolCallCounts.set(toolName, current + 1);
    }
    /**
     * Record an error occurrence.
     */
    recordError() {
        this.errorCount++;
    }
    /**
     * Update the active session count.
     *
     * @param delta - Change in session count (+1 for new session, -1 for ended).
     */
    updateSessionCount(delta) {
        this.activeSessionCount = Math.max(0, this.activeSessionCount + delta);
    }
    /**
     * Record a message for messages-per-minute calculation.
     */
    recordMessage() {
        this.messageTimestamps.push(Date.now());
        // Keep only timestamps from the last 5 minutes
        const cutoff = Date.now() - 5 * 60_000;
        this.messageTimestamps = this.messageTimestamps.filter((t) => t > cutoff);
    }
    /**
     * Get the total number of tool calls across all tools.
     */
    getTotalToolCalls() {
        let total = 0;
        for (const count of this.toolCallCounts.values()) {
            total += count;
        }
        return total;
    }
    /**
     * Get a dashboard-friendly metrics summary.
     *
     * @returns Aggregated metrics snapshot.
     */
    getSummary() {
        const avgResponseTime = this.responseTimes.length > 0
            ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
            : 0;
        const oneMinuteAgo = Date.now() - 60_000;
        const recentMessages = this.messageTimestamps.filter((t) => t > oneMinuteAgo);
        const topTools = Array.from(this.toolCallCounts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        return {
            tokensUsed: this.tokensUsed,
            averageResponseTimeMs: Math.round(avgResponseTime),
            toolCallCount: this.getTotalToolCalls(),
            errorCount: this.errorCount,
            activeSessionCount: this.activeSessionCount,
            messagesPerMinute: recentMessages.length,
            uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
            topTools,
        };
    }
    /**
     * Reset all metrics to zero.
     */
    reset() {
        this.tokensUsed = 0;
        this.responseTimes = [];
        this.toolCallCounts.clear();
        this.errorCount = 0;
        this.activeSessionCount = 0;
        this.messageTimestamps = [];
        this.log.info("Metrics reset");
    }
}
exports.MetricsCollector = MetricsCollector;
// ─── Audit Logger ────────────────────────────────────────────────────
/**
 * Writes structured JSON audit logs to disk with automatic file rotation.
 *
 * Each line in the log file is a self-contained JSON object for easy
 * ingestion by log aggregation systems.
 *
 * @example
 * ```ts
 * const auditLogger = new AuditLogger({ directory: "/var/log/arivuclaw" });
 * await auditLogger.initialize();
 * await auditLogger.write({
 *   action: "tool.called",
 *   userId: "user-123",
 *   details: { toolName: "web_search", input: {} },
 * });
 * ```
 */
class AuditLogger {
    log = logger_1.Logger.create("AuditLogger");
    config;
    currentFileSize = 0;
    currentFilePath = "";
    writeStream = null;
    /**
     * Create a new AuditLogger.
     *
     * @param config - Audit log configuration.
     */
    constructor(config = {}) {
        this.config = {
            directory: config.directory ?? "./logs",
            maxFileSizeBytes: config.maxFileSizeBytes ?? 10 * 1024 * 1024, // 10 MB
            maxFiles: config.maxFiles ?? 10,
            prefix: config.prefix ?? "audit",
        };
    }
    /**
     * Initialize the audit logger, creating the log directory and opening
     * the initial log file.
     */
    async initialize() {
        const { mkdir } = await Promise.resolve().then(() => __importStar(require("node:fs/promises")));
        await mkdir(this.config.directory, { recursive: true });
        await this.openNewFile();
        this.log.info(`Audit logger initialized: ${this.config.directory}`);
    }
    /**
     * Write an audit entry to the current log file.
     *
     * @param entry - Partial audit entry (id and timestamp are auto-generated).
     */
    async write(entry) {
        const fullEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            level: entry.level ?? "info",
            action: entry.action,
            userId: entry.userId,
            details: entry.details,
        };
        const line = JSON.stringify(fullEntry) + "\n";
        const lineBytes = Buffer.byteLength(line, "utf-8");
        // Rotate if needed
        if (this.currentFileSize + lineBytes > this.config.maxFileSizeBytes) {
            await this.rotate();
        }
        await this.writeLine(line);
        this.currentFileSize += lineBytes;
    }
    /**
     * Close the audit logger and flush pending writes.
     */
    async close() {
        if (this.writeStream) {
            await new Promise((resolve) => {
                this.writeStream.end(() => resolve());
            });
            this.writeStream = null;
        }
        this.log.info("Audit logger closed");
    }
    /** Open a new log file with a timestamped name. */
    async openNewFile() {
        const { createWriteStream } = await Promise.resolve().then(() => __importStar(require("node:fs")));
        const { join } = await Promise.resolve().then(() => __importStar(require("node:path")));
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        this.currentFilePath = join(this.config.directory, `${this.config.prefix}-${timestamp}.jsonl`);
        this.writeStream = createWriteStream(this.currentFilePath, {
            flags: "a",
            encoding: "utf-8",
        });
        this.currentFileSize = 0;
        this.log.debug(`Opened audit log file: ${this.currentFilePath}`);
    }
    /** Rotate the current log file. */
    async rotate() {
        this.log.info("Rotating audit log file");
        // Close current file
        if (this.writeStream) {
            await new Promise((resolve) => {
                this.writeStream.end(() => resolve());
            });
        }
        // Clean up old files if we have too many
        await this.cleanOldFiles();
        // Open a new file
        await this.openNewFile();
    }
    /** Remove old log files beyond the retention limit. */
    async cleanOldFiles() {
        const { readdir, unlink, stat } = await Promise.resolve().then(() => __importStar(require("node:fs/promises")));
        const { join } = await Promise.resolve().then(() => __importStar(require("node:path")));
        try {
            const entries = await readdir(this.config.directory);
            const logFiles = entries
                .filter((f) => f.startsWith(this.config.prefix) && f.endsWith(".jsonl"))
                .sort();
            if (logFiles.length >= this.config.maxFiles) {
                const toDelete = logFiles.slice(0, logFiles.length - this.config.maxFiles + 1);
                for (const file of toDelete) {
                    await unlink(join(this.config.directory, file));
                    this.log.debug(`Deleted old audit log: ${file}`);
                }
            }
        }
        catch (error) {
            this.log.warn(`Failed to clean old audit logs: ${error}`);
        }
    }
    /** Write a line to the current write stream. */
    async writeLine(line) {
        if (!this.writeStream) {
            await this.openNewFile();
        }
        return new Promise((resolve, reject) => {
            const ok = this.writeStream.write(line, "utf-8");
            if (ok) {
                resolve();
            }
            else {
                this.writeStream.once("drain", resolve);
            }
        });
    }
}
exports.AuditLogger = AuditLogger;
// ─── Telemetry Service ───────────────────────────────────────────────
/**
 * Unified telemetry facade that coordinates audit logging, metrics
 * collection, and distributed tracing.
 *
 * @example
 * ```ts
 * const telemetry = new TelemetryService({ auditLogDir: "./logs" });
 * await telemetry.initialize();
 *
 * telemetry.logAudit("tool.called", "user-123", { toolName: "search" });
 * telemetry.trackMetric("response_time_ms", 245, { provider: "anthropic" });
 *
 * const spanId = telemetry.startSpan("llm_request");
 * // ... do work ...
 * telemetry.endSpan(spanId);
 * ```
 */
class TelemetryService {
    log = logger_1.Logger.create("TelemetryService");
    metrics;
    auditLogger;
    spans = new Map();
    /**
     * Create a new TelemetryService.
     *
     * @param options - Configuration options.
     */
    constructor(options = {}) {
        this.metrics = new MetricsCollector();
        this.auditLogger = new AuditLogger({
            directory: options.auditLogDir ?? "./logs",
            maxFileSizeBytes: options.maxFileSizeBytes,
            maxFiles: options.maxFiles,
        });
    }
    /**
     * Initialize the telemetry subsystems.
     */
    async initialize() {
        await this.auditLogger.initialize();
        this.log.info("Telemetry service initialized");
    }
    /**
     * Write a structured audit log entry.
     *
     * @param action - The action that was performed.
     * @param userId - The user who performed the action.
     * @param details - Additional structured details.
     */
    logAudit(action, userId, details) {
        void this.auditLogger.write({ action, userId, details, level: "info" });
        this.log.debug(`Audit: ${action} by ${userId}`);
    }
    /**
     * Track a named metric value.
     *
     * @param name - Metric name.
     * @param value - Metric value.
     * @param tags - Dimensional tags for filtering.
     */
    trackMetric(name, value, tags = {}) {
        // Route known metrics to the collector
        switch (name) {
            case "tokensUsed":
                this.metrics.recordTokens(value);
                break;
            case "responseTimeMs":
                this.metrics.recordResponseTime(value);
                break;
            case "errorCount":
                this.metrics.recordError();
                break;
            default:
                break;
        }
        this.log.debug(`Metric: ${name}=${value} tags=${JSON.stringify(tags)}`);
    }
    /**
     * Start a new trace span.
     *
     * @param name - Human-readable span name.
     * @param attributes - Optional key-value attributes.
     * @returns The span ID used to end the span later.
     */
    startSpan(name, attributes = {}) {
        const id = crypto.randomUUID();
        const span = {
            id,
            name,
            startMs: Date.now(),
            attributes,
        };
        this.spans.set(id, span);
        this.log.debug(`Span started: ${name} (${id})`);
        return id;
    }
    /**
     * End a previously started trace span.
     *
     * @param spanId - The span ID returned by startSpan.
     * @returns The completed Span, or undefined if not found.
     */
    endSpan(spanId) {
        const span = this.spans.get(spanId);
        if (!span) {
            this.log.warn(`Span not found: ${spanId}`);
            return undefined;
        }
        span.endMs = Date.now();
        span.durationMs = span.endMs - span.startMs;
        this.spans.delete(spanId);
        this.log.debug(`Span ended: ${span.name} (${span.durationMs}ms)`);
        return span;
    }
    /**
     * Get the current metrics summary for dashboard display.
     *
     * @returns Aggregated metrics snapshot.
     */
    getMetricsSummary() {
        return this.metrics.getSummary();
    }
    /**
     * Get the underlying MetricsCollector for direct access.
     */
    getMetrics() {
        return this.metrics;
    }
    /**
     * Shut down telemetry subsystems.
     */
    async shutdown() {
        await this.auditLogger.close();
        this.log.info("Telemetry service shut down");
    }
}
exports.TelemetryService = TelemetryService;
/**
 * Convenience function to get a metrics summary from a TelemetryService.
 *
 * @param service - The telemetry service instance.
 * @returns Dashboard-friendly metrics object.
 */
function getMetricsSummary(service) {
    return service.getMetricsSummary();
}
//# sourceMappingURL=telemetry.js.map