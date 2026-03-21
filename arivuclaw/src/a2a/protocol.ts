/**
 * Arivumaiyam AI Agent-to-Agent Protocol (Google ADK Compatible)
 *
 * Implements the A2A protocol for inter-agent communication, allowing
 * agents to discover each other, delegate tasks, and exchange results.
 * Compatible with the Google Agent Development Kit (ADK) A2A specification.
 *
 * @module a2a/protocol
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { ChannelType } from "../core/types.js";
import { Logger } from "../utils/logger.js";

// ─── Types ───────────────────────────────────────────────────────────

/** Describes an agent's capabilities, endpoints, and supported modalities. */
export interface AgentCard {
  /** Unique agent name. */
  name: string;
  /** Human-readable description of the agent's purpose. */
  description: string;
  /** Base URL where this agent's A2A endpoints are hosted. */
  url: string;
  /** List of skills/capabilities this agent provides. */
  skills: AgentSkill[];
  /** Supported input modalities (e.g. "text", "image", "audio"). */
  inputModes: string[];
  /** Supported output modalities. */
  outputModes: string[];
  /** Optional metadata. */
  metadata?: Record<string, unknown>;
}

/** A skill advertised by an agent. */
export interface AgentSkill {
  /** Skill identifier. */
  name: string;
  /** Description of what the skill does. */
  description: string;
  /** Tags for discovery. */
  tags?: string[];
}

/** Status of an A2A task. */
export type A2ATaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

/** An artifact produced by a task (file, image, structured data). */
export interface A2AArtifact {
  /** Artifact identifier. */
  id: string;
  /** MIME type of the artifact. */
  mimeType: string;
  /** Display name. */
  name: string;
  /** Inline data (base64 for binary, plain for text). */
  data: string;
}

/** Represents a task exchanged between agents. */
export interface A2ATask {
  /** Unique task identifier. */
  id: string;
  /** Current task status. */
  status: A2ATaskStatus;
  /** Input payload sent to the agent. */
  input: A2ATaskInput;
  /** Output payload returned by the agent. */
  output?: A2ATaskOutput;
  /** Artifacts produced during execution. */
  artifacts: A2AArtifact[];
  /** Timestamp when the task was created. */
  createdAt: string;
  /** Timestamp when the task was last updated. */
  updatedAt: string;
}

/** Input sent with a task request. */
export interface A2ATaskInput {
  /** The text message / prompt. */
  message: string;
  /** Optional structured data. */
  data?: Record<string, unknown>;
  /** Content type of the input. */
  contentType?: string;
}

/** Output returned from a completed task. */
export interface A2ATaskOutput {
  /** The text response. */
  message: string;
  /** Optional structured data. */
  data?: Record<string, unknown>;
  /** Content type of the output. */
  contentType?: string;
}

/** Handler function that processes an incoming A2A task. */
export type TaskHandler = (task: A2ATask) => Promise<A2ATask>;

// ─── A2A Server ──────────────────────────────────────────────────────

/**
 * Serves A2A protocol endpoints so other agents can discover and
 * delegate tasks to this agent.
 *
 * Endpoints:
 * - `GET  /.well-known/agent.json` — Returns the agent card.
 * - `POST /a2a/tasks`              — Create a new task.
 * - `GET  /a2a/tasks/:id`          — Get task status and result.
 *
 * @example
 * ```ts
 * const server = new A2AServer(8321);
 * server.registerAgent({ name: "weather-agent", ... });
 * server.onTask(async (task) => { ... return task; });
 * await server.start();
 * ```
 */
export class A2AServer {
  private readonly log = Logger.create("A2AServer");
  private agentCard: AgentCard | null = null;
  private taskHandler: TaskHandler | null = null;
  private readonly tasks = new Map<string, A2ATask>();
  private server: import("node:http").Server | null = null;
  private readonly port: number;

  /**
   * Create a new A2A protocol server.
   *
   * @param port - Port to listen on.
   */
  constructor(port: number = 8321) {
    this.port = port;
  }

  /**
   * Register the agent card describing this agent's capabilities.
   *
   * @param card - The agent card to advertise.
   */
  registerAgent(card: AgentCard): void {
    this.agentCard = card;
    this.log.info(`Registered agent card: ${card.name} at ${card.url}`);
  }

  /**
   * Set the handler that processes incoming task requests.
   *
   * @param handler - Async function that receives a task and returns the updated task.
   */
  onTask(handler: TaskHandler): void {
    this.taskHandler = handler;
  }

  /**
   * Handle an incoming task creation request.
   *
   * @param input - The task input payload.
   * @returns The created A2ATask.
   */
  async handleTaskRequest(input: A2ATaskInput): Promise<A2ATask> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const task: A2ATask = {
      id,
      status: "pending",
      input,
      artifacts: [],
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(id, task);
    this.log.info(`Task created: ${id}`);

    // Process asynchronously
    void this.processTask(task);

    return task;
  }

  /**
   * Get the current status of a task.
   *
   * @param taskId - The task ID to look up.
   * @returns The task if found, or undefined.
   */
  handleTaskStatus(taskId: string): A2ATask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Start the A2A HTTP server.
   */
  async start(): Promise<void> {
    const http = await import("node:http");

    this.server = http.createServer((req, res) => {
      void this.route(req, res);
    });

    return new Promise<void>((resolve) => {
      this.server!.listen(this.port, () => {
        this.log.info(`A2A server listening on port ${this.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the A2A HTTP server.
   */
  async stop(): Promise<void> {
    if (!this.server) return;
    return new Promise<void>((resolve, reject) => {
      this.server!.close((err) => {
        if (err) reject(err);
        else {
          this.log.info("A2A server stopped");
          this.server = null;
          resolve();
        }
      });
    });
  }

  /** Route incoming requests to the appropriate handler. */
  private async route(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const method = req.method ?? "GET";
    const url = req.url ?? "/";

    // Agent card discovery
    if (method === "GET" && url === "/.well-known/agent.json") {
      if (!this.agentCard) {
        this.sendJson(res, 404, { error: "No agent card registered" });
        return;
      }
      this.sendJson(res, 200, this.agentCard);
      return;
    }

    // Create task
    if (method === "POST" && url === "/a2a/tasks") {
      const body = await this.readBody(req);
      try {
        const input = JSON.parse(body) as A2ATaskInput;
        const task = await this.handleTaskRequest(input);
        this.sendJson(res, 201, task);
      } catch (error) {
        this.sendJson(res, 400, { error: "Invalid task payload" });
      }
      return;
    }

    // Get task status
    if (method === "GET" && url.startsWith("/a2a/tasks/")) {
      const taskId = url.replace("/a2a/tasks/", "").split("?")[0];
      const task = this.handleTaskStatus(taskId);
      if (task) {
        this.sendJson(res, 200, task);
      } else {
        this.sendJson(res, 404, { error: "Task not found" });
      }
      return;
    }

    this.sendJson(res, 404, { error: "Not found" });
  }

  /** Process a task asynchronously using the registered handler. */
  private async processTask(task: A2ATask): Promise<void> {
    if (!this.taskHandler) {
      task.status = "failed";
      task.updatedAt = new Date().toISOString();
      this.log.warn(`No task handler registered, task ${task.id} failed`);
      return;
    }

    task.status = "in_progress";
    task.updatedAt = new Date().toISOString();

    try {
      const result = await this.taskHandler(task);
      result.status = "completed";
      result.updatedAt = new Date().toISOString();
      this.tasks.set(result.id, result);
      this.log.info(`Task ${task.id} completed`);
    } catch (error) {
      task.status = "failed";
      task.updatedAt = new Date().toISOString();
      this.log.error(`Task ${task.id} failed: ${error}`);
    }
  }

  /** Read the full request body. */
  private readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve) => {
      let body = "";
      req.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on("end", () => resolve(body));
    });
  }

  /** Send a JSON response. */
  private sendJson(res: ServerResponse, status: number, data: unknown): void {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }
}

// ─── A2A Client ──────────────────────────────────────────────────────

/**
 * Client for discovering remote agents and delegating tasks via the A2A protocol.
 *
 * @example
 * ```ts
 * const client = new A2AClient();
 * const card = await client.discoverAgent("http://weather-agent:8321");
 * const task = await client.sendTask(card.url, { message: "Weather in Tokyo?" });
 * const result = await client.getTaskStatus(card.url, task.id);
 * ```
 */
export class A2AClient {
  private readonly log = Logger.create("A2AClient");

  /** Cache of discovered agent cards keyed by base URL. */
  private readonly discoveredAgents = new Map<string, AgentCard>();

  /**
   * Discover an agent by fetching its agent card from the well-known URL.
   *
   * @param baseUrl - The base URL of the remote agent (e.g. "http://agent:8321").
   * @returns The remote agent's AgentCard.
   */
  async discoverAgent(baseUrl: string): Promise<AgentCard> {
    const url = `${baseUrl.replace(/\/$/, "")}/.well-known/agent.json`;
    this.log.info(`Discovering agent at ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to discover agent at ${url}: ${response.status} ${response.statusText}`,
      );
    }

    const card = (await response.json()) as AgentCard;
    this.discoveredAgents.set(baseUrl, card);
    this.log.info(`Discovered agent: ${card.name} (${card.skills.length} skills)`);
    return card;
  }

  /**
   * Send a task to a remote agent.
   *
   * @param agentUrl - The base URL of the target agent.
   * @param input - The task input payload.
   * @returns The created A2ATask (status will be "pending" or "in_progress").
   */
  async sendTask(agentUrl: string, input: A2ATaskInput): Promise<A2ATask> {
    const url = `${agentUrl.replace(/\/$/, "")}/a2a/tasks`;
    this.log.info(`Sending task to ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to send task to ${url}: ${response.status} ${response.statusText}`,
      );
    }

    const task = (await response.json()) as A2ATask;
    this.log.info(`Task sent: ${task.id} (status: ${task.status})`);
    return task;
  }

  /**
   * Poll the status of a previously submitted task.
   *
   * @param agentUrl - The base URL of the target agent.
   * @param taskId - The task ID to check.
   * @returns The current A2ATask state.
   */
  async getTaskStatus(agentUrl: string, taskId: string): Promise<A2ATask> {
    const url = `${agentUrl.replace(/\/$/, "")}/a2a/tasks/${taskId}`;
    this.log.debug(`Fetching task status: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to get task status from ${url}: ${response.status} ${response.statusText}`,
      );
    }

    const task = (await response.json()) as A2ATask;
    return task;
  }

  /**
   * Wait for a task to reach a terminal state by polling.
   *
   * @param agentUrl - The base URL of the target agent.
   * @param taskId - The task ID to wait on.
   * @param pollIntervalMs - Milliseconds between polls (default: 1000).
   * @param timeoutMs - Maximum wait time in milliseconds (default: 60000).
   * @returns The completed or failed A2ATask.
   */
  async waitForTask(
    agentUrl: string,
    taskId: string,
    pollIntervalMs: number = 1000,
    timeoutMs: number = 60_000,
  ): Promise<A2ATask> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const task = await this.getTaskStatus(agentUrl, taskId);

      if (task.status === "completed" || task.status === "failed" || task.status === "cancelled") {
        return task;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Task ${taskId} timed out after ${timeoutMs}ms`);
  }

  /**
   * Get all discovered agent cards.
   */
  getDiscoveredAgents(): AgentCard[] {
    return Array.from(this.discoveredAgents.values());
  }
}
