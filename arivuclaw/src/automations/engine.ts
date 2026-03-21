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

import type { ChannelType } from "../core/types.js";
import { Logger } from "../utils/logger.js";

// ─── Trigger Types ───────────────────────────────────────────────────

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
export type AutomationTrigger =
  | ScheduleTrigger
  | WebhookTrigger
  | EventTrigger
  | KeywordTrigger;

// ─── Action Types ────────────────────────────────────────────────────

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
export type AutomationAction =
  | SendMessageAction
  | RunToolAction
  | CallAPIAction
  | NotifyAction;

// ─── Automation Definition ───────────────────────────────────────────

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

// ─── Action Executor ─────────────────────────────────────────────────

/** Callback interface for executing individual actions. */
export interface ActionExecutor {
  sendMessage(channel: ChannelType, userId: string, content: string): Promise<void>;
  runTool(toolName: string, input: Record<string, unknown>): Promise<unknown>;
  callAPI(url: string, method: string, headers?: Record<string, string>, body?: unknown): Promise<unknown>;
  notify(title: string, message: string, via: string, recipient: string): Promise<void>;
}

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
export class AutomationEngine {
  private readonly log = Logger.create("AutomationEngine");
  private readonly automations = new Map<string, Automation>();
  private readonly executor: ActionExecutor;
  private readonly cronTimers = new Map<string, ReturnType<typeof setInterval>>();

  /**
   * Create a new AutomationEngine.
   *
   * @param executor - Implementation of the action executor interface.
   */
  constructor(executor: ActionExecutor) {
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
  registerAutomation(
    trigger: AutomationTrigger,
    actions: AutomationAction[],
    options: { name: string; description: string } = {
      name: "Unnamed Automation",
      description: "",
    },
  ): Automation {
    const id = crypto.randomUUID();

    const automation: Automation = {
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
  async executeAutomation(event: AutomationEvent): Promise<AutomationResult[]> {
    const matched = this.findMatchingAutomations(event);

    if (matched.length === 0) {
      this.log.debug(`No automations matched event: ${event.type}`);
      return [];
    }

    this.log.info(`Event "${event.type}" matched ${matched.length} automation(s)`);

    const results: AutomationResult[] = [];

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
  listAutomations(): Automation[] {
    return Array.from(this.automations.values());
  }

  /**
   * Remove an automation by ID.
   *
   * @param id - The automation ID to remove.
   * @returns True if the automation was removed.
   */
  removeAutomation(id: string): boolean {
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
  shutdown(): void {
    for (const [id, timer] of this.cronTimers) {
      clearInterval(timer);
      this.cronTimers.delete(id);
    }
    this.log.info("Automation engine shut down");
  }

  /** Find automations whose trigger matches the given event. */
  private findMatchingAutomations(event: AutomationEvent): Automation[] {
    const results: Automation[] = [];

    for (const automation of this.automations.values()) {
      if (!automation.enabled) continue;

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
          const text = (event.data["text"] as string) ?? "";
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
  private async runAutomation(
    automation: Automation,
    event: AutomationEvent,
  ): Promise<AutomationResult> {
    const startTime = Date.now();
    const actionResults: ActionResult[] = [];

    this.log.info(`Executing automation "${automation.name}" (${automation.id})`);

    for (const action of automation.actions) {
      const actionResult = await this.executeAction(action, event);
      actionResults.push(actionResult);

      if (!actionResult.success) {
        this.log.warn(
          `Action ${action.type} failed in automation "${automation.name}": ${actionResult.error}`,
        );
        break; // Stop on first failure
      }
    }

    automation.lastRunAt = new Date();
    automation.runCount++;

    const durationMs = Date.now() - startTime;
    const success = actionResults.every((r) => r.success);

    this.log.info(
      `Automation "${automation.name}" ${success ? "completed" : "failed"} in ${durationMs}ms`,
    );

    return {
      automationId: automation.id,
      success,
      actionResults,
      durationMs,
    };
  }

  /** Execute a single action. */
  private async executeAction(
    action: AutomationAction,
    event: AutomationEvent,
  ): Promise<ActionResult> {
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
          const output = await this.executor.callAPI(
            action.url,
            action.method ?? "GET",
            action.headers,
            action.body,
          );
          return { actionType: action.type, success: true, output };
        }

        case "notify": {
          const message = this.interpolate(action.message, event.data);
          await this.executor.notify(action.title, message, action.via, action.recipient);
          return { actionType: action.type, success: true };
        }

        default:
          return {
            actionType: (action as AutomationAction).type,
            success: false,
            error: "Unknown action type",
          };
      }
    } catch (error) {
      return {
        actionType: action.type,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /** Interpolate {{variable}} placeholders in a string. */
  private interpolate(template: string, data: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      return data[key] !== undefined ? String(data[key]) : `{{${key}}}`;
    });
  }

  /** Start a simple interval-based cron schedule for an automation. */
  private startCronSchedule(automation: Automation): void {
    if (automation.trigger.type !== "schedule") return;

    // Parse simple cron intervals (simplified — real impl would use a cron library)
    const intervalMs = this.parseCronToInterval(automation.trigger.cron);
    if (intervalMs <= 0) {
      this.log.warn(
        `Could not parse cron expression "${automation.trigger.cron}" for automation "${automation.name}"`,
      );
      return;
    }

    const timer = setInterval(() => {
      const event: AutomationEvent = {
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
  private parseCronToInterval(cron: string): number {
    const parts = cron.trim().split(/\s+/);
    if (parts.length < 5) return 0;

    // "* * * * *"  → every minute
    if (parts.every((p) => p === "*")) return 60_000;

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
  private triggerSummary(trigger: AutomationTrigger): string {
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

// ─── Daily Briefing ──────────────────────────────────────────────────

/** Data sources for the daily briefing. */
export interface BriefingDataSources {
  getWeather(location: string): Promise<string>;
  getCalendarEvents(userId: string): Promise<string[]>;
  getUnreadEmails(userId: string): Promise<{ subject: string; from: string }[]>;
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
export class DailyBriefing {
  private readonly log = Logger.create("DailyBriefing");
  private readonly sources: BriefingDataSources;

  /**
   * Create a new DailyBriefing composer.
   *
   * @param sources - Data source implementations for weather, calendar, etc.
   */
  constructor(sources: BriefingDataSources) {
    this.sources = sources;
  }

  /**
   * Compose a full daily briefing for a user.
   *
   * @param userId - The user to compose the briefing for.
   * @param options - Options such as location and news topics.
   * @returns A formatted briefing string.
   */
  async compose(
    userId: string,
    options: { location?: string; newsTopics?: string[] } = {},
  ): Promise<string> {
    this.log.info(`Composing daily briefing for user ${userId}`);

    const sections: string[] = [];

    // Weather
    try {
      const weather = await this.sources.getWeather(options.location ?? "New York");
      sections.push(`## Weather\n${weather}`);
    } catch (error) {
      this.log.warn(`Failed to fetch weather: ${error}`);
      sections.push("## Weather\nUnavailable");
    }

    // Calendar
    try {
      const events = await this.sources.getCalendarEvents(userId);
      if (events.length > 0) {
        sections.push(`## Calendar\n${events.map((e) => `- ${e}`).join("\n")}`);
      } else {
        sections.push("## Calendar\nNo events today.");
      }
    } catch (error) {
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
      } else {
        sections.push("## Email\nInbox zero!");
      }
    } catch (error) {
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
    } catch (error) {
      this.log.warn(`Failed to fetch news: ${error}`);
      sections.push("## News\nUnavailable");
    }

    const briefing = `# Daily Briefing\n\n${sections.join("\n\n")}`;
    this.log.info(`Briefing composed: ${briefing.length} chars`);
    return briefing;
  }
}

// ─── Monitoring Agent ────────────────────────────────────────────────

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
export type MonitorAlertCallback = (
  target: MonitorTarget,
  result: MonitorCheckResult,
  previouslyHealthy: boolean,
) => Promise<void>;

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
export class MonitoringAgent {
  private readonly log = Logger.create("MonitoringAgent");
  private readonly targets: MonitorTarget[] = [];
  private readonly timers = new Map<string, ReturnType<typeof setInterval>>();
  private readonly healthState = new Map<string, boolean>();
  private readonly alertCallback: MonitorAlertCallback;
  private readonly results: MonitorCheckResult[] = [];

  /**
   * Create a new MonitoringAgent.
   *
   * @param alertCallback - Called when a target's health status changes.
   */
  constructor(alertCallback: MonitorAlertCallback) {
    this.alertCallback = alertCallback;
  }

  /**
   * Add a target to monitor.
   *
   * @param target - The target URL and configuration.
   */
  addTarget(target: MonitorTarget): void {
    this.targets.push(target);
    this.healthState.set(target.url, true); // Assume healthy initially
    this.log.info(`Monitoring target added: ${target.name} (${target.url})`);
  }

  /**
   * Start monitoring all registered targets.
   */
  start(): void {
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
  stop(): void {
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
  getResults(limit: number = 100): MonitorCheckResult[] {
    return this.results.slice(-limit);
  }

  /** Check a single target. */
  private async checkTarget(target: MonitorTarget): Promise<void> {
    const startTime = Date.now();
    const previouslyHealthy = this.healthState.get(target.url) ?? true;

    let result: MonitorCheckResult;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        target.timeoutMs ?? 10_000,
      );

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
    } catch (error) {
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
      this.log.warn(
        `${target.name} state changed: ${previouslyHealthy ? "HEALTHY" : "DOWN"} -> ${result.healthy ? "HEALTHY" : "DOWN"}`,
      );
      await this.alertCallback(target, result, previouslyHealthy);
    }
  }
}
