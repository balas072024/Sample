/**
 * ArivuClaw Webhook Receiver — Incoming webhook handler with HMAC verification.
 *
 * Creates Express-compatible HTTP routes for receiving webhooks from external
 * services (GitHub, Stripe, Slack, etc.). Each webhook can be optionally
 * protected with HMAC signature verification.
 *
 * Received webhooks are forwarded to the automation engine as events.
 *
 * @module webhooks/receiver
 */
/** Signature verification scheme. */
export type SignatureScheme = "github" | "stripe" | "slack" | "hmac-sha256";
/** Configuration for a registered webhook. */
export interface WebhookConfig {
    /** URL path for this webhook (e.g. "/webhooks/github"). */
    path: string;
    /** Optional HMAC secret for signature verification. */
    secret?: string;
    /** Signature verification scheme (default: "hmac-sha256"). */
    signatureScheme?: SignatureScheme;
    /** Human-readable description. */
    description?: string;
    /** Whether this webhook is enabled (default: true). */
    enabled: boolean;
}
/** Parsed webhook event passed to handlers and the automation engine. */
export interface WebhookEvent {
    /** The webhook path that received this event. */
    path: string;
    /** Parsed JSON body. */
    body: Record<string, unknown>;
    /** HTTP headers. */
    headers: Record<string, string>;
    /** Whether the signature was verified. */
    signatureVerified: boolean;
    /** Timestamp when the event was received. */
    receivedAt: Date;
    /** Parsed event type (if determinable). */
    eventType?: string;
}
/** Handler function for incoming webhook events. */
export type WebhookHandler = (event: WebhookEvent) => Promise<void>;
/** Callback to forward webhook events to the automation engine. */
export type AutomationForwarder = (eventType: string, data: Record<string, unknown>) => Promise<void>;
/** Parsed GitHub webhook event. */
export interface GitHubWebhookEvent {
    /** GitHub event type (e.g. "push", "pull_request", "issues"). */
    event: string;
    /** Action within the event (e.g. "opened", "closed"). */
    action?: string;
    /** Repository full name. */
    repository: string;
    /** Sender username. */
    sender: string;
    /** Full payload. */
    payload: Record<string, unknown>;
}
/** Parsed Stripe webhook event. */
export interface StripeWebhookEvent {
    /** Stripe event ID. */
    id: string;
    /** Event type (e.g. "payment_intent.succeeded", "customer.subscription.updated"). */
    type: string;
    /** Event data object. */
    data: Record<string, unknown>;
    /** Whether this is a live-mode event. */
    livemode: boolean;
}
/**
 * Parse a GitHub webhook payload.
 *
 * @param headers - HTTP headers from the request.
 * @param body - Parsed JSON body.
 * @returns Structured GitHub webhook event.
 */
export declare function parseGitHubWebhook(headers: Record<string, string>, body: Record<string, unknown>): GitHubWebhookEvent;
/**
 * Parse a Stripe webhook payload.
 *
 * @param body - Parsed JSON body.
 * @returns Structured Stripe webhook event.
 */
export declare function parseStripeWebhook(body: Record<string, unknown>): StripeWebhookEvent;
/**
 * Parse a generic JSON webhook payload.
 *
 * @param body - Parsed JSON body.
 * @returns The body with a best-effort event type extraction.
 */
export declare function parseGenericWebhook(body: Record<string, unknown>): {
    eventType: string;
    data: Record<string, unknown>;
};
/**
 * HTTP server that receives and processes incoming webhooks.
 *
 * Supports HMAC signature verification for GitHub, Stripe, Slack, and
 * generic HMAC-SHA256. Each webhook forwards events to the automation
 * engine for triggering workflows.
 *
 * @example
 * ```ts
 * const receiver = new WebhookReceiver({ port: 9000 });
 *
 * receiver.registerWebhook(
 *   "/webhooks/github",
 *   async (event) => { console.log("GitHub event:", event.eventType); },
 *   "my-github-secret",
 * );
 *
 * await receiver.start();
 * ```
 */
export declare class WebhookReceiver {
    private readonly log;
    private readonly webhooks;
    private readonly port;
    private readonly host;
    private server;
    private automationForwarder;
    /**
     * Create a new WebhookReceiver.
     *
     * @param config - Server configuration.
     */
    constructor(config?: {
        port?: number;
        host?: string;
    });
    /**
     * Set the automation engine forwarder for dispatching webhook events.
     *
     * @param forwarder - Callback to forward events to the automation engine.
     */
    setAutomationForwarder(forwarder: AutomationForwarder): void;
    /**
     * Register a new webhook endpoint.
     *
     * @param path - URL path for the webhook (e.g. "/webhooks/github").
     * @param handler - Async function to handle incoming events.
     * @param secret - Optional HMAC secret for signature verification.
     * @param options - Additional configuration options.
     */
    registerWebhook(path: string, handler: WebhookHandler, secret?: string, options?: {
        signatureScheme?: SignatureScheme;
        description?: string;
    }): void;
    /**
     * List all registered webhooks.
     *
     * @returns Array of webhook configurations.
     */
    listWebhooks(): WebhookConfig[];
    /**
     * Remove a registered webhook.
     *
     * @param path - The webhook path to remove.
     * @returns True if the webhook was removed.
     */
    removeWebhook(path: string): boolean;
    /**
     * Start the webhook receiver HTTP server.
     */
    start(): Promise<void>;
    /**
     * Stop the webhook receiver HTTP server.
     */
    stop(): Promise<void>;
    /** Handle an incoming HTTP request. */
    private handleRequest;
    /** Read the full request body as a string. */
    private readBody;
}
//# sourceMappingURL=receiver.d.ts.map