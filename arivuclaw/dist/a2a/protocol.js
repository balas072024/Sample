"use strict";
/**
 * ArivuClaw Agent-to-Agent Protocol (Google ADK Compatible)
 *
 * Implements the A2A protocol for inter-agent communication, allowing
 * agents to discover each other, delegate tasks, and exchange results.
 * Compatible with the Google Agent Development Kit (ADK) A2A specification.
 *
 * @module a2a/protocol
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
exports.A2AClient = exports.A2AServer = void 0;
const logger_1 = require("../utils/logger");
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
class A2AServer {
    log = logger_1.Logger.create("A2AServer");
    agentCard = null;
    taskHandler = null;
    tasks = new Map();
    server = null;
    port;
    /**
     * Create a new A2A protocol server.
     *
     * @param port - Port to listen on.
     */
    constructor(port = 8321) {
        this.port = port;
    }
    /**
     * Register the agent card describing this agent's capabilities.
     *
     * @param card - The agent card to advertise.
     */
    registerAgent(card) {
        this.agentCard = card;
        this.log.info(`Registered agent card: ${card.name} at ${card.url}`);
    }
    /**
     * Set the handler that processes incoming task requests.
     *
     * @param handler - Async function that receives a task and returns the updated task.
     */
    onTask(handler) {
        this.taskHandler = handler;
    }
    /**
     * Handle an incoming task creation request.
     *
     * @param input - The task input payload.
     * @returns The created A2ATask.
     */
    async handleTaskRequest(input) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const task = {
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
    handleTaskStatus(taskId) {
        return this.tasks.get(taskId);
    }
    /**
     * Start the A2A HTTP server.
     */
    async start() {
        const http = await Promise.resolve().then(() => __importStar(require("node:http")));
        this.server = http.createServer((req, res) => {
            void this.route(req, res);
        });
        return new Promise((resolve) => {
            this.server.listen(this.port, () => {
                this.log.info(`A2A server listening on port ${this.port}`);
                resolve();
            });
        });
    }
    /**
     * Stop the A2A HTTP server.
     */
    async stop() {
        if (!this.server)
            return;
        return new Promise((resolve, reject) => {
            this.server.close((err) => {
                if (err)
                    reject(err);
                else {
                    this.log.info("A2A server stopped");
                    this.server = null;
                    resolve();
                }
            });
        });
    }
    /** Route incoming requests to the appropriate handler. */
    async route(req, res) {
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
                const input = JSON.parse(body);
                const task = await this.handleTaskRequest(input);
                this.sendJson(res, 201, task);
            }
            catch (error) {
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
            }
            else {
                this.sendJson(res, 404, { error: "Task not found" });
            }
            return;
        }
        this.sendJson(res, 404, { error: "Not found" });
    }
    /** Process a task asynchronously using the registered handler. */
    async processTask(task) {
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
        }
        catch (error) {
            task.status = "failed";
            task.updatedAt = new Date().toISOString();
            this.log.error(`Task ${task.id} failed: ${error}`);
        }
    }
    /** Read the full request body. */
    readBody(req) {
        return new Promise((resolve) => {
            let body = "";
            req.on("data", (chunk) => {
                body += chunk.toString();
            });
            req.on("end", () => resolve(body));
        });
    }
    /** Send a JSON response. */
    sendJson(res, status, data) {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
    }
}
exports.A2AServer = A2AServer;
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
class A2AClient {
    log = logger_1.Logger.create("A2AClient");
    /** Cache of discovered agent cards keyed by base URL. */
    discoveredAgents = new Map();
    /**
     * Discover an agent by fetching its agent card from the well-known URL.
     *
     * @param baseUrl - The base URL of the remote agent (e.g. "http://agent:8321").
     * @returns The remote agent's AgentCard.
     */
    async discoverAgent(baseUrl) {
        const url = `${baseUrl.replace(/\/$/, "")}/.well-known/agent.json`;
        this.log.info(`Discovering agent at ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to discover agent at ${url}: ${response.status} ${response.statusText}`);
        }
        const card = (await response.json());
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
    async sendTask(agentUrl, input) {
        const url = `${agentUrl.replace(/\/$/, "")}/a2a/tasks`;
        this.log.info(`Sending task to ${url}`);
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        });
        if (!response.ok) {
            throw new Error(`Failed to send task to ${url}: ${response.status} ${response.statusText}`);
        }
        const task = (await response.json());
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
    async getTaskStatus(agentUrl, taskId) {
        const url = `${agentUrl.replace(/\/$/, "")}/a2a/tasks/${taskId}`;
        this.log.debug(`Fetching task status: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to get task status from ${url}: ${response.status} ${response.statusText}`);
        }
        const task = (await response.json());
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
    async waitForTask(agentUrl, taskId, pollIntervalMs = 1000, timeoutMs = 60_000) {
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
    getDiscoveredAgents() {
        return Array.from(this.discoveredAgents.values());
    }
}
exports.A2AClient = A2AClient;
//# sourceMappingURL=protocol.js.map