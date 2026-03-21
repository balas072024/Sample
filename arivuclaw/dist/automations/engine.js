"use strict";
/**
 * ArivuClaw Automation Engine — Event-driven workflow system.
 *
 * Allows registering automations that trigger on schedules, webhooks,
 * events, or keyword patterns. Each automation executes a sequence of
 * actions such as sending messages, running tools, calling APIs, or
 * sending notifications.
 *
 * Also includes a DailyBriefing composer and a MonitoringAgent for
 * URL/service health checking.
 *
 * @module automations/engine
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringAgent = exports.DailyBriefing = exports.AutomationEngine = void 0;
const logger_1 = require("../utils/logger");
// ─── Automation Engine ───────────────────────────────────────────────
/**
 * Core automation engine that manages triggers, matches events, and
 * executes action sequences.
 *
 * @example
 * ```ts
 * const engine = new AutomationEngine(executor);
 * engine.registerAutomation(
 *   { type: "keyword", pattern: "deploy\\s+\\w+" },
 *   [{ type: "runTool", toolName: "deploy", input: {} }],
 *   { name: "Auto Deploy", description: "Deploys on keyword" },
 * );
 * await engine.executeAutomation({ type: "keyword:deploy prod", data: {}, timestamp: new Date() });
 * ```
 */
class AutomationEngine {
    log = logger_1.Logger.create("AutomationEngine");
    automations = new Map();
    executor;
    cronTimers = new Map();
    /**
     * Create a new AutomationEngine.
     *
     * @param executor - Implementation of the action executor interface.
     */
    constructor(executor) {
        this.executor = executor;
    }
    /**
     * Register a new automation.
     *
     * @param trigger - The trigger condition for this automation.
     * @param actions - The ordered list of actions to execute.
     * @param options - Additional automation metadata.
     * @returns The created Automation object.
     */
    registerAutomation(trigger, actions, options = {
        name: "Unnamed Automation",
        description: "",
    }) {
        const id = crypto.randomUUID();
        const automation = {
            id,
            name: options.name,
            description: options.description,
            enabled: true,
            trigger,
            actions,
            runCount: 0,
        };
        this.automations.set(id, automation);
        this.log.info(`Registered automation "${automation.name}" (${trigger.type}: ${this.triggerSummary(trigger)})`);
        if (trigger.type === "schedule") {
            this.startCronSchedule(automation);
        }
        return automation;
    }
    /**
     * Execute all automations that match the given event.
     *
     * @param event - The event to match against registered triggers.
     * @returns Array of execution results for all matched automations.
     */
    async executeAutomation(event) {
        const matched = this.findMatchingAutomations(event);
        if (matched.length === 0) {
            this.log.debug(`No automations matched event: ${event.type}`);
            return [];
        }
        this.log.info(`Event "${event.type}" matched ${matched.length} automation(s)`);
        const results = [];
        for (const automation of matched) {
            const result = await this.runAutomation(automation, event);
            results.push(result);
        }
        return results;
    }
    /**
     * List all registered automations.
     *
     * @returns Array of all automation definitions.
     */
    listAutomations() {
        return Array.from(this.automations.values());
    }
    /**
     * Remove an automation by ID.
     *
     * @param id - The automation ID to remove.
     * @returns True if the automation was removed.
     */
    removeAutomation(id) {
        const timer = this.cronTimers.get(id);
        if (timer) {
            clearInterval(timer);
            this.cronTimers.delete(id);
        }
        return this.automations.delete(id);
    }
    /**
     * Shut down all automation schedules.
     */
    shutdown() {
        for (const [id, timer] of this.cronTimers) {
            clearInterval(timer);
            this.cronTimers.delete(id);
        }
        this.log.info("Automation engine shut down");
    }
    /** Find automations whose trigger matches the given event. */
    findMatchingAutomations(event) {
        const results = [];
        for (const automation of this.automations.values()) {
            if (!automation.enabled)
                continue;
            const trigger = automation.trigger;
            switch (trigger.type) {
                case "event":
                    if (event.type === trigger.eventType) {
                        results.push(automation);
                    }
                    break;
                case "webhook":
                    if (event.type === `webhook:${trigger.path}`) {
                        results.push(automation);
                    }
                    break;
                case "keyword": {
                    const text = event.data["text"] ?? "";
                    const regex = new RegExp(trigger.pattern, "i");
                    if (regex.test(text)) {
                        results.push(automation);
                    }
                    break;
                }
                // Schedule triggers are handled by cron, not event matching
                case "schedule":
                    break;
            }
        }
        return results;
    }
    /** Run a single automation and return the result. */
    async runAutomation(automation, event) {
        const startTime = Date.now();
        const actionResults = [];
        this.log.info(`Executing automation "${automation.name}" (${automation.id})`);
        for (const action of automation.actions) {
            const actionResult = await this.executeAction(action, event);
            actionResults.push(actionResult);
            if (!actionResult.success) {
                this.log.warn(`Action ${action.type} failed in automation "${automation.name}": ${actionResult.error}`);
                break; // Stop on first failure
            }
        }
        automation.lastRunAt = new Date();
        automation.runCount++;
        const durationMs = Date.now() - startTime;
        const success = actionResults.every((r) => r.success);
        this.log.info(`Automation "${automation.name}" ${success ? "completed" : "failed"} in ${durationMs}ms`);
        return {
            automationId: automation.id,
            success,
            actionResults,
            durationMs,
        };
    }
    /** Execute a single action. */
    async executeAction(action, event) {
        try {
            switch (action.type) {
                case "sendMessage": {
                    const content = this.interpolate(action.content, event.data);
                    await this.executor.sendMessage(action.channel, action.userId, content);
                    return { actionType: action.type, success: true };
                }
                case "runTool": {
                    const output = await this.executor.runTool(action.toolName, action.input);
                    return { actionType: action.type, success: true, output };
                }
                case "callAPI": {
                    const output = await this.executor.callAPI(action.url, action.method ?? "GET", action.headers, action.body);
                    return { actionType: action.type, success: true, output };
                }
                case "notify": {
                    const message = this.interpolate(action.message, event.data);
                    await this.executor.notify(action.title, message, action.via, action.recipient);
                    return { actionType: action.type, success: true };
                }
                default:
                    return {
                        actionType: action.type,
                        success: false,
                        error: "Unknown action type",
                    };
            }
        }
        catch (error) {
            return {
                actionType: action.type,
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /** Interpolate {{variable}} placeholders in a string. */
    interpolate(template, data) {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
            return data[key] !== undefined ? String(data[key]) : `{{${key}}}`;
        });
    }
    /** Start a simple interval-based cron schedule for an automation. */
    startCronSchedule(automation) {
        if (automation.trigger.type !== "schedule")
            return;
        // Parse simple cron intervals (simplified — real impl would use a cron library)
        const intervalMs = this.parseCronToInterval(automation.trigger.cron);
        if (intervalMs <= 0) {
            this.log.warn(`Could not parse cron expression "${automation.trigger.cron}" for automation "${automation.name}"`);
            return;
        }
        const timer = setInterval(() => {
            const event = {
                type: `schedule:${automation.id}`,
                data: { automationId: automation.id, cron: automation.trigger.type === "schedule" ? automation.trigger.cron : "" },
                timestamp: new Date(),
            };
            void this.runAutomation(automation, event);
        }, intervalMs);
        this.cronTimers.set(automation.id, timer);
        this.log.debug(`Cron schedule started for "${automation.name}" (every ${intervalMs}ms)`);
    }
    /**
     * Simplified cron-to-interval parser.
     * Recognises common patterns; a production system would use node-cron.
     */
    parseCronToInterval(cron) {
        const parts = cron.trim().split(/\s+/);
        if (parts.length < 5)
            return 0;
        // "* * * * *"  → every minute
        if (parts.every((p) => p === "*"))
            return 60_000;
        // "*/N * * * *" → every N minutes
        const minuteMatch = parts[0].match(/^\*\/(\d+)$/);
        if (minuteMatch && parts.slice(1).every((p) => p === "*")) {
            return parseInt(minuteMatch[1], 10) * 60_000;
        }
        // "0 * * * *" → every hour
        if (parts[0] === "0" && parts[1] === "*" && parts.slice(2).every((p) => p === "*")) {
            return 3_600_000;
        }
        // "0 */N * * *" → every N hours
        const hourMatch = parts[1].match(/^\*\/(\d+)$/);
        if (parts[0] === "0" && hourMatch && parts.slice(2).every((p) => p === "*")) {
            return parseInt(hourMatch[1], 10) * 3_600_000;
        }
        // Default: every hour for unrecognised patterns
        return 3_600_000;
    }
    /** Generate a short summary of a trigger for logging. */
    triggerSummary(trigger) {
        switch (trigger.type) {
            case "schedule":
                return trigger.cron;
            case "webhook":
                return trigger.path;
            case "event":
                return trigger.eventType;
            case "keyword":
                return `/${trigger.pattern}/`;
        }
    }
}
exports.AutomationEngine = AutomationEngine;
/**
 * Composes a daily briefing from multiple data sources: weather, calendar,
 * email summaries, and news headlines.
 *
 * @example
 * ```ts
 * const briefing = new DailyBriefing(dataSources);
 * const text = await briefing.compose("user-123", { location: "Tokyo" });
 * ```
 */
class DailyBriefing {
    log = logger_1.Logger.create("DailyBriefing");
    sources;
    /**
     * Create a new DailyBriefing composer.
     *
     * @param sources - Data source implementations for weather, calendar, etc.
     */
    constructor(sources) {
        this.sources = sources;
    }
    /**
     * Compose a full daily briefing for a user.
     *
     * @param userId - The user to compose the briefing for.
     * @param options - Options such as location and news topics.
     * @returns A formatted briefing string.
     */
    async compose(userId, options = {}) {
        this.log.info(`Composing daily briefing for user ${userId}`);
        const sections = [];
        // Weather
        try {
            const weather = await this.sources.getWeather(options.location ?? "New York");
            sections.push(`## Weather\n${weather}`);
        }
        catch (error) {
            this.log.warn(`Failed to fetch weather: ${error}`);
            sections.push("## Weather\nUnavailable");
        }
        // Calendar
        try {
            const events = await this.sources.getCalendarEvents(userId);
            if (events.length > 0) {
                sections.push(`## Calendar\n${events.map((e) => `- ${e}`).join("\n")}`);
            }
            else {
                sections.push("## Calendar\nNo events today.");
            }
        }
        catch (error) {
            this.log.warn(`Failed to fetch calendar: ${error}`);
            sections.push("## Calendar\nUnavailable");
        }
        // Email
        try {
            const emails = await this.sources.getUnreadEmails(userId);
            if (emails.length > 0) {
                const emailLines = emails
                    .slice(0, 5)
                    .map((e) => `- **${e.from}**: ${e.subject}`)
                    .join("\n");
                sections.push(`## Unread Emails (${emails.length})\n${emailLines}`);
            }
            else {
                sections.push("## Email\nInbox zero!");
            }
        }
        catch (error) {
            this.log.warn(`Failed to fetch emails: ${error}`);
            sections.push("## Email\nUnavailable");
        }
        // News
        try {
            const topics = options.newsTopics ?? ["technology", "world"];
            const headlines = await this.sources.getNewsHeadlines(topics);
            if (headlines.length > 0) {
                sections.push(`## News\n${headlines.slice(0, 5).map((h) => `- ${h}`).join("\n")}`);
            }
        }
        catch (error) {
            this.log.warn(`Failed to fetch news: ${error}`);
            sections.push("## News\nUnavailable");
        }
        const briefing = `# Daily Briefing\n\n${sections.join("\n\n")}`;
        this.log.info(`Briefing composed: ${briefing.length} chars`);
        return briefing;
    }
}
exports.DailyBriefing = DailyBriefing;
/**
 * Watches URLs and services at regular intervals and alerts on failure.
 *
 * @example
 * ```ts
 * const monitor = new MonitoringAgent(async (target, result) => {
 *   console.log(`${target.name} is ${result.healthy ? "UP" : "DOWN"}`);
 * });
 * monitor.addTarget({ name: "API", url: "https://api.example.com/health" });
 * monitor.start();
 * ```
 */
class MonitoringAgent {
    log = logger_1.Logger.create("MonitoringAgent");
    targets = [];
    timers = new Map();
    healthState = new Map();
    alertCallback;
    results = [];
    /**
     * Create a new MonitoringAgent.
     *
     * @param alertCallback - Called when a target's health status changes.
     */
    constructor(alertCallback) {
        this.alertCallback = alertCallback;
    }
    /**
     * Add a target to monitor.
     *
     * @param target - The target URL and configuration.
     */
    addTarget(target) {
        this.targets.push(target);
        this.healthState.set(target.url, true); // Assume healthy initially
        this.log.info(`Monitoring target added: ${target.name} (${target.url})`);
    }
    /**
     * Start monitoring all registered targets.
     */
    start() {
        for (const target of this.targets) {
            const interval = target.intervalMs ?? 60_000;
            const timer = setInterval(() => {
                void this.checkTarget(target);
            }, interval);
            this.timers.set(target.url, timer);
            // Run an initial check immediately
            void this.checkTarget(target);
        }
        this.log.info(`Monitoring started for ${this.targets.length} target(s)`);
    }
    /**
     * Stop monitoring all targets.
     */
    stop() {
        for (const [url, timer] of this.timers) {
            clearInterval(timer);
            this.timers.delete(url);
        }
        this.log.info("Monitoring stopped");
    }
    /**
     * Get the most recent check results.
     *
     * @param limit - Maximum number of results to return (default: 100).
     */
    getResults(limit = 100) {
        return this.results.slice(-limit);
    }
    /** Check a single target. */
    async checkTarget(target) {
        const startTime = Date.now();
        const previouslyHealthy = this.healthState.get(target.url) ?? true;
        let result;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), target.timeoutMs ?? 10_000);
            const response = await fetch(target.url, {
                signal: controller.signal,
            });
            clearTimeout(timeout);
            const responseTimeMs = Date.now() - startTime;
            const expectedStatus = target.expectedStatus ?? 200;
            const healthy = response.status === expectedStatus;
            result = {
                target,
                healthy,
                statusCode: response.status,
                responseTimeMs,
                checkedAt: new Date(),
            };
            if (!healthy) {
                result.error = `Expected status ${expectedStatus}, got ${response.status}`;
            }
        }
        catch (error) {
            result = {
                target,
                healthy: false,
                responseTimeMs: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error),
                checkedAt: new Date(),
            };
        }
        this.results.push(result);
        this.healthState.set(target.url, result.healthy);
        // Alert on state change
        if (result.healthy !== previouslyHealthy) {
            this.log.warn(`${target.name} state changed: ${previouslyHealthy ? "HEALTHY" : "DOWN"} -> ${result.healthy ? "HEALTHY" : "DOWN"}`);
            await this.alertCallback(target, result, previouslyHealthy);
        }
    }
}
exports.MonitoringAgent = MonitoringAgent;
//# sourceMappingURL=engine.js.map