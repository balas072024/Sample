/**
 * Arivumaiyam AI Webhook Receiver — Incoming webhook handler with HMAC verification.
 *
 * Creates Express-compatible HTTP routes for receiving webhooks from external
 * services (GitHub, Stripe, Slack, etc.). Each webhook can be optionally
 * protected with HMAC signature verification.
 *
 * Received webhooks are forwarded to the automation engine as events.
 *
 * @module webhooks/receiver
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { ChannelType } from "../core/types";
import { Logger } from "../utils/logger";

// ─── Types ───────────────────────────────────────────────────────────

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
export type AutomationForwarder = (
  eventType: string,
  data: Record<string, unknown>,
) => Promise<void>;

/** Internal record for a registered webhook. */
interface RegisteredWebhook {
  config: WebhookConfig;
  handler: WebhookHandler;
}

// ─── Webhook Parsers ─────────────────────────────────────────────────

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
export function parseGitHubWebhook(
  headers: Record<string, string>,
  body: Record<string, unknown>,
): GitHubWebhookEvent {
  const event = headers["x-github-event"] ?? "unknown";
  const repo = body["repository"] as Record<string, unknown> | undefined;
  const sender = body["sender"] as Record<string, unknown> | undefined;

  return {
    event,
    action: body["action"] as string | undefined,
    repository: (repo?.["full_name"] as string) ?? "unknown",
    sender: (sender?.["login"] as string) ?? "unknown",
    payload: body,
  };
}

/**
 * Parse a Stripe webhook payload.
 *
 * @param body - Parsed JSON body.
 * @returns Structured Stripe webhook event.
 */
export function parseStripeWebhook(
  body: Record<string, unknown>,
): StripeWebhookEvent {
  return {
    id: (body["id"] as string) ?? "",
    type: (body["type"] as string) ?? "unknown",
    data: (body["data"] as Record<string, unknown>) ?? {},
    livemode: (body["livemode"] as boolean) ?? false,
  };
}

/**
 * Parse a generic JSON webhook payload.
 *
 * @param body - Parsed JSON body.
 * @returns The body with a best-effort event type extraction.
 */
export function parseGenericWebhook(
  body: Record<string, unknown>,
): { eventType: string; data: Record<string, unknown> } {
  // Try common event type field names
  const eventType =
    (body["event"] as string) ??
    (body["type"] as string) ??
    (body["event_type"] as string) ??
    (body["action"] as string) ??
    "generic";

  return { eventType, data: body };
}

// ─── Signature Verification ──────────────────────────────────────────

/**
 * Verify an HMAC signature based on the provider scheme.
 *
 * @param scheme - The verification scheme.
 * @param secret - The shared secret.
 * @param payload - The raw request body string.
 * @param signatureHeader - The signature header value from the request.
 * @returns True if the signature is valid.
 */
async function verifySignature(
  scheme: SignatureScheme,
  secret: string,
  payload: string,
  signatureHeader: string,
): Promise<boolean> {
  const crypto = await import("node:crypto");

  switch (scheme) {
    case "github": {
      // GitHub uses HMAC-SHA256, header format: "sha256=<hex>"
      const expected = "sha256=" +
        crypto.createHmac("sha256", secret).update(payload).digest("hex");
      return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signatureHeader),
      );
    }

    case "stripe": {
      // Stripe uses HMAC-SHA256, header format: "t=<timestamp>,v1=<hex>"
      const parts = signatureHeader.split(",");
      const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
      const sig = parts.find((p) => p.startsWith("v1="))?.slice(3);

      if (!timestamp || !sig) return false;

      const signedPayload = `${timestamp}.${payload}`;
      const expected = crypto
        .createHmac("sha256", secret)
        .update(signedPayload)
        .digest("hex");

      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
    }

    case "slack": {
      // Slack uses HMAC-SHA256, header format: "v0=<hex>"
      // Requires X-Slack-Request-Timestamp header (handled by caller)
      const expected = "v0=" +
        crypto.createHmac("sha256", secret).update(payload).digest("hex");
      return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signatureHeader),
      );
    }

    case "hmac-sha256":
    default: {
      // Generic HMAC-SHA256
      const expected = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
      return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signatureHeader),
      );
    }
  }
}

/**
 * Get the appropriate signature header name for a given scheme.
 *
 * @param scheme - The signature scheme.
 * @returns The header name to look for.
 */
function getSignatureHeaderName(scheme: SignatureScheme): string {
  switch (scheme) {
    case "github":
      return "x-hub-signature-256";
    case "stripe":
      return "stripe-signature";
    case "slack":
      return "x-slack-signature";
    case "hmac-sha256":
    default:
      return "x-webhook-signature";
  }
}

// ─── Webhook Receiver ────────────────────────────────────────────────

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
export class WebhookReceiver {
  private readonly log = Logger.create("WebhookReceiver");
  private readonly webhooks = new Map<string, RegisteredWebhook>();
  private readonly port: number;
  private readonly host: string;
  private server: import("node:http").Server | null = null;
  private automationForwarder: AutomationForwarder | null = null;

  /**
   * Create a new WebhookReceiver.
   *
   * @param config - Server configuration.
   */
  constructor(config: { port?: number; host?: string } = {}) {
    this.port = config.port ?? 9000;
    this.host = config.host ?? "0.0.0.0";
  }

  /**
   * Set the automation engine forwarder for dispatching webhook events.
   *
   * @param forwarder - Callback to forward events to the automation engine.
   */
  setAutomationForwarder(forwarder: AutomationForwarder): void {
    this.automationForwarder = forwarder;
  }

  /**
   * Register a new webhook endpoint.
   *
   * @param path - URL path for the webhook (e.g. "/webhooks/github").
   * @param handler - Async function to handle incoming events.
   * @param secret - Optional HMAC secret for signature verification.
   * @param options - Additional configuration options.
   */
  registerWebhook(
    path: string,
    handler: WebhookHandler,
    secret?: string,
    options: {
      signatureScheme?: SignatureScheme;
      description?: string;
    } = {},
  ): void {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    const config: WebhookConfig = {
      path: normalizedPath,
      secret,
      signatureScheme: options.signatureScheme ?? (secret ? "hmac-sha256" : undefined),
      description: options.description,
      enabled: true,
    };

    this.webhooks.set(normalizedPath, { config, handler });
    this.log.info(
      `Webhook registered: ${normalizedPath}${secret ? " (signature verification enabled)" : ""}`,
    );
  }

  /**
   * List all registered webhooks.
   *
   * @returns Array of webhook configurations.
   */
  listWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values()).map((w) => w.config);
  }

  /**
   * Remove a registered webhook.
   *
   * @param path - The webhook path to remove.
   * @returns True if the webhook was removed.
   */
  removeWebhook(path: string): boolean {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const removed = this.webhooks.delete(normalizedPath);
    if (removed) {
      this.log.info(`Webhook removed: ${normalizedPath}`);
    }
    return removed;
  }

  /**
   * Start the webhook receiver HTTP server.
   */
  async start(): Promise<void> {
    const http = await import("node:http");

    this.server = http.createServer((req, res) => {
      void this.handleRequest(req, res);
    });

    return new Promise<void>((resolve) => {
      this.server!.listen(this.port, this.host, () => {
        this.log.info(
          `Webhook receiver listening on http://${this.host}:${this.port} (${this.webhooks.size} webhook(s))`,
        );
        resolve();
      });
    });
  }

  /**
   * Stop the webhook receiver HTTP server.
   */
  async stop(): Promise<void> {
    if (!this.server) return;
    return new Promise<void>((resolve, reject) => {
      this.server!.close((err) => {
        if (err) reject(err);
        else {
          this.log.info("Webhook receiver stopped");
          this.server = null;
          resolve();
        }
      });
    });
  }

  /** Handle an incoming HTTP request. */
  private async handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const method = req.method ?? "GET";
    const url = req.url ?? "/";
    const path = url.split("?")[0];

    // Health check
    if (method === "GET" && path === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", webhooks: this.webhooks.size }));
      return;
    }

    // Only accept POST for webhooks
    if (method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    // Find matching webhook
    const webhook = this.webhooks.get(path);
    if (!webhook) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Webhook not found" }));
      return;
    }

    if (!webhook.config.enabled) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Webhook disabled" }));
      return;
    }

    // Read body
    const rawBody = await this.readBody(req);

    // Extract headers as a flat record
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string") {
        headers[key] = value;
      } else if (Array.isArray(value)) {
        headers[key] = value[0];
      }
    }

    // Verify signature if a secret is configured
    let signatureVerified = false;
    if (webhook.config.secret && webhook.config.signatureScheme) {
      const sigHeaderName = getSignatureHeaderName(webhook.config.signatureScheme);
      const signatureHeader = headers[sigHeaderName];

      if (!signatureHeader) {
        this.log.warn(`Missing signature header "${sigHeaderName}" for webhook ${path}`);
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing signature" }));
        return;
      }

      // For Slack, prepend the timestamp to the payload
      let payloadToVerify = rawBody;
      if (webhook.config.signatureScheme === "slack") {
        const timestamp = headers["x-slack-request-timestamp"] ?? "";
        payloadToVerify = `v0:${timestamp}:${rawBody}`;
      }

      try {
        signatureVerified = await verifySignature(
          webhook.config.signatureScheme,
          webhook.config.secret,
          payloadToVerify,
          signatureHeader,
        );
      } catch {
        signatureVerified = false;
      }

      if (!signatureVerified) {
        this.log.warn(`Invalid signature for webhook ${path}`);
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid signature" }));
        return;
      }
    } else {
      // No secret configured — allow but note it
      signatureVerified = false;
    }

    // Parse body
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }

    // Determine event type based on known patterns
    let eventType: string | undefined;
    if (headers["x-github-event"]) {
      const ghEvent = parseGitHubWebhook(headers, body);
      eventType = `github.${ghEvent.event}${ghEvent.action ? `.${ghEvent.action}` : ""}`;
    } else if (body["type"] && typeof body["object"] === "string") {
      // Looks like a Stripe event
      const stripeEvent = parseStripeWebhook(body);
      eventType = `stripe.${stripeEvent.type}`;
    } else {
      const generic = parseGenericWebhook(body);
      eventType = generic.eventType;
    }

    // Create webhook event
    const event: WebhookEvent = {
      path,
      body,
      headers,
      signatureVerified,
      receivedAt: new Date(),
      eventType,
    };

    // Respond immediately — processing happens async
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ received: true, eventType }));

    // Process the webhook event
    try {
      await webhook.handler(event);
      this.log.info(`Webhook processed: ${path} (event: ${eventType})`);
    } catch (error) {
      this.log.error(`Webhook handler error for ${path}: ${error}`);
    }

    // Forward to automation engine
    if (this.automationForwarder && eventType) {
      try {
        await this.automationForwarder(`webhook:${path}`, {
          ...body,
          _eventType: eventType,
          _path: path,
          _signatureVerified: signatureVerified,
        });
      } catch (error) {
        this.log.error(`Failed to forward webhook to automation engine: ${error}`);
      }
    }
  }

  /** Read the full request body as a string. */
  private readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve) => {
      let body = "";
      req.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on("end", () => resolve(body));
    });
  }
}
