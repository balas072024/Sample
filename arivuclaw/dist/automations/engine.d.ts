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
import type { ChannelType } from "../core/types";
/** A cron-schedule trigger. */
export interface ScheduleTrigger {
    readonly type: "schedule";
    /** Cron expression (e.g. "0 8 * * *"). */
    cron: string;
}
/** A webhook trigger activated by an HTTP POST to the given path. */
export interface WebhookTrigger {
    readonly type: "webhook";
    /** URL path that activates this trigger (e.g. "/hooks/deploy"). */
    path: string;
}
/** An internal event trigger. */
export interface EventTrigger {
    readonly type: "event";
    /** Event type string to match (e.g. "message.received"). */
    eventType: string;
}
/** A keyword-pattern trigger that fires when a message matches. */
export interface KeywordTrigger {
    readonly type: "keyword";
    /** Regex pattern to match against message content. */
    pattern: string;
}
/** Union of all trigger types. */
export type AutomationTrigger = ScheduleTrigger | WebhookTrigger | EventTrigger | KeywordTrigger;
/** Send a message to a channel. */
export interface SendMessageAction {
    readonly type: "sendMessage";
    /** Target channel. */
    channel: ChannelType;
    /** User ID to send to. */
    userId: string;
    /** Message content (supports {{variable}} interpolation). */
    content: string;
}
/** Run a registered tool. */
export interface RunToolAction {
    readonly type: "runTool";
    /** Tool name to execute. */
    toolName: string;
    /** Tool input parameters. */
    input: Record<string, unknown>;
}
/** Call an external HTTP API. */
export interface CallAPIAction {
    readonly type: "callAPI";
    /** Full URL to call. */
    url: string;
    /** HTTP method (default: "GET"). */
    method?: string;
    /** Request headers. */
    headers?: Record<string, string>;
    /** Request body (for POST/PUT). */
    body?: unknown;
}
/** Send a notification (e.g. push notification, email). */
export interface NotifyAction {
    readonly type: "notify";
    /** Notification title. */
    title: string;
    /** Notification body. */
    message: string;
    /** Notification channel (e.g. "email", "push", "slack"). */
    via: string;
    /** Recipient identifier. */
    recipient: string;
}
/** Union of all action types. */
export type AutomationAction = SendMessageAction | RunToolAction | CallAPIAction | NotifyAction;
/** A registered automation with a trigger and a sequence of actions. */
export interface Automation {
    /** Unique automation identifier. */
    id: string;
    /** Human-readable name. */
    name: string;
    /** Description of what this automation does. */
    description: string;
    /** Whether this automation is currently enabled. */
    enabled: boolean;
    /** The trigger that activates this automation. */
    trigger: AutomationTrigger;
    /** Ordered list of actions to execute when triggered. */
    actions: AutomationAction[];
    /** Timestamp of last execution. */
    lastRunAt?: Date;
    /** Number of times this automation has executed. */
    runCount: number;
}
/** An event that can trigger automations. */
export interface AutomationEvent {
    /** Event type (matches EventTrigger.eventType or "webhook:path" or "keyword:text"). */
    type: string;
    /** Payload data available to actions via interpolation. */
    data: Record<string, unknown>;
    /** Timestamp of the event. */
    timestamp: Date;
}
/** Result of executing an automation. */
export interface AutomationResult {
    /** The automation that was executed. */
    automationId: string;
    /** Whether execution succeeded. */
    success: boolean;
    /** Results from each action. */
    actionResults: ActionResult[];
    /** Total execution time in milliseconds. */
    durationMs: number;
}
/** Result of a single action execution. */
export interface ActionResult {
    /** The action type that was executed. */
    actionType: string;
    /** Whether the action succeeded. */
    success: boolean;
    /** Output data from the action. */
    output?: unknown;
    /** Error message if the action failed. */
    error?: string;
}
/** Callback interface for executing individual actions. */
export interface ActionExecutor {
    sendMessage(channel: ChannelType, userId: string, content: string): Promise<void>;
    runTool(toolName: string, input: Record<string, unknown>): Promise<unknown>;
    callAPI(url: string, method: string, headers?: Record<string, string>, body?: unknown): Promise<unknown>;
    notify(title: string, message: string, via: string, recipient: string): Promise<void>;
}
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
export declare class AutomationEngine {
    private readonly log;
    private readonly automations;
    private readonly executor;
    private readonly cronTimers;
    /**
     * Create a new AutomationEngine.
     *
     * @param executor - Implementation of the action executor interface.
     */
    constructor(executor: ActionExecutor);
    /**
     * Register a new automation.
     *
     * @param trigger - The trigger condition for this automation.
     * @param actions - The ordered list of actions to execute.
     * @param options - Additional automation metadata.
     * @returns The created Automation object.
     */
    registerAutomation(trigger: AutomationTrigger, actions: AutomationAction[], options?: {
        name: string;
        description: string;
    }): Automation;
    /**
     * Execute all automations that match the given event.
     *
     * @param event - The event to match against registered triggers.
     * @returns Array of execution results for all matched automations.
     */
    executeAutomation(event: AutomationEvent): Promise<AutomationResult[]>;
    /**
     * List all registered automations.
     *
     * @returns Array of all automation definitions.
     */
    listAutomations(): Automation[];
    /**
     * Remove an automation by ID.
     *
     * @param id - The automation ID to remove.
     * @returns True if the automation was removed.
     */
    removeAutomation(id: string): boolean;
    /**
     * Shut down all automation schedules.
     */
    shutdown(): void;
    /** Find automations whose trigger matches the given event. */
    private findMatchingAutomations;
    /** Run a single automation and return the result. */
    private runAutomation;
    /** Execute a single action. */
    private executeAction;
    /** Interpolate {{variable}} placeholders in a string. */
    private interpolate;
    /** Start a simple interval-based cron schedule for an automation. */
    private startCronSchedule;
    /**
     * Simplified cron-to-interval parser.
     * Recognises common patterns; a production system would use node-cron.
     */
    private parseCronToInterval;
    /** Generate a short summary of a trigger for logging. */
    private triggerSummary;
}
/** Data sources for the daily briefing. */
export interface BriefingDataSources {
    getWeather(location: string): Promise<string>;
    getCalendarEvents(userId: string): Promise<string[]>;
    getUnreadEmails(userId: string): Promise<{
        subject: string;
        from: string;
    }[]>;
    getNewsHeadlines(topics: string[]): Promise<string[]>;
}
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
export declare class DailyBriefing {
    private readonly log;
    private readonly sources;
    /**
     * Create a new DailyBriefing composer.
     *
     * @param sources - Data source implementations for weather, calendar, etc.
     */
    constructor(sources: BriefingDataSources);
    /**
     * Compose a full daily briefing for a user.
     *
     * @param userId - The user to compose the briefing for.
     * @param options - Options such as location and news topics.
     * @returns A formatted briefing string.
     */
    compose(userId: string, options?: {
        location?: string;
        newsTopics?: string[];
    }): Promise<string>;
}
/** Configuration for a monitored endpoint. */
export interface MonitorTarget {
    /** Display name for this target. */
    name: string;
    /** URL to check. */
    url: string;
    /** Expected HTTP status code (default: 200). */
    expectedStatus?: number;
    /** Check interval in milliseconds (default: 60000). */
    intervalMs?: number;
    /** Timeout for each check in milliseconds (default: 10000). */
    timeoutMs?: number;
}
/** Result of a health check. */
export interface MonitorCheckResult {
    /** Target that was checked. */
    target: MonitorTarget;
    /** Whether the check passed. */
    healthy: boolean;
    /** HTTP status code received. */
    statusCode?: number;
    /** Response time in milliseconds. */
    responseTimeMs: number;
    /** Error message if the check failed. */
    error?: string;
    /** Timestamp of the check. */
    checkedAt: Date;
}
/** Callback invoked when a monitored service goes down or comes back up. */
export type MonitorAlertCallback = (target: MonitorTarget, result: MonitorCheckResult, previouslyHealthy: boolean) => Promise<void>;
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
export declare class MonitoringAgent {
    private readonly log;
    private readonly targets;
    private readonly timers;
    private readonly healthState;
    private readonly alertCallback;
    private readonly results;
    /**
     * Create a new MonitoringAgent.
     *
     * @param alertCallback - Called when a target's health status changes.
     */
    constructor(alertCallback: MonitorAlertCallback);
    /**
     * Add a target to monitor.
     *
     * @param target - The target URL and configuration.
     */
    addTarget(target: MonitorTarget): void;
    /**
     * Start monitoring all registered targets.
     */
    start(): void;
    /**
     * Stop monitoring all targets.
     */
    stop(): void;
    /**
     * Get the most recent check results.
     *
     * @param limit - Maximum number of results to return (default: 100).
     */
    getResults(limit?: number): MonitorCheckResult[];
    /** Check a single target. */
    private checkTarget;
}
//# sourceMappingURL=engine.d.ts.map