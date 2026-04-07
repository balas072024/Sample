/**
 * ArivuClaw Agent-to-Agent Protocol (Google ADK Compatible)
 *
 * Implements the A2A protocol for inter-agent communication, allowing
 * agents to discover each other, delegate tasks, and exchange results.
 * Compatible with the Google Agent Development Kit (ADK) A2A specification.
 *
 * @module a2a/protocol
 */
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
export type A2ATaskStatus = "pending" | "in_progress" | "completed" | "failed" | "cancelled";
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
export declare class A2AServer {
    private readonly log;
    private agentCard;
    private taskHandler;
    private readonly tasks;
    private server;
    private readonly port;
    /**
     * Create a new A2A protocol server.
     *
     * @param port - Port to listen on.
     */
    constructor(port?: number);
    /**
     * Register the agent card describing this agent's capabilities.
     *
     * @param card - The agent card to advertise.
     */
    registerAgent(card: AgentCard): void;
    /**
     * Set the handler that processes incoming task requests.
     *
     * @param handler - Async function that receives a task and returns the updated task.
     */
    onTask(handler: TaskHandler): void;
    /**
     * Handle an incoming task creation request.
     *
     * @param input - The task input payload.
     * @returns The created A2ATask.
     */
    handleTaskRequest(input: A2ATaskInput): Promise<A2ATask>;
    /**
     * Get the current status of a task.
     *
     * @param taskId - The task ID to look up.
     * @returns The task if found, or undefined.
     */
    handleTaskStatus(taskId: string): A2ATask | undefined;
    /**
     * Start the A2A HTTP server.
     */
    start(): Promise<void>;
    /**
     * Stop the A2A HTTP server.
     */
    stop(): Promise<void>;
    /** Route incoming requests to the appropriate handler. */
    private route;
    /** Process a task asynchronously using the registered handler. */
    private processTask;
    /** Read the full request body. */
    private readBody;
    /** Send a JSON response. */
    private sendJson;
}
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
export declare class A2AClient {
    private readonly log;
    /** Cache of discovered agent cards keyed by base URL. */
    private readonly discoveredAgents;
    /**
     * Discover an agent by fetching its agent card from the well-known URL.
     *
     * @param baseUrl - The base URL of the remote agent (e.g. "http://agent:8321").
     * @returns The remote agent's AgentCard.
     */
    discoverAgent(baseUrl: string): Promise<AgentCard>;
    /**
     * Send a task to a remote agent.
     *
     * @param agentUrl - The base URL of the target agent.
     * @param input - The task input payload.
     * @returns The created A2ATask (status will be "pending" or "in_progress").
     */
    sendTask(agentUrl: string, input: A2ATaskInput): Promise<A2ATask>;
    /**
     * Poll the status of a previously submitted task.
     *
     * @param agentUrl - The base URL of the target agent.
     * @param taskId - The task ID to check.
     * @returns The current A2ATask state.
     */
    getTaskStatus(agentUrl: string, taskId: string): Promise<A2ATask>;
    /**
     * Wait for a task to reach a terminal state by polling.
     *
     * @param agentUrl - The base URL of the target agent.
     * @param taskId - The task ID to wait on.
     * @param pollIntervalMs - Milliseconds between polls (default: 1000).
     * @param timeoutMs - Maximum wait time in milliseconds (default: 60000).
     * @returns The completed or failed A2ATask.
     */
    waitForTask(agentUrl: string, taskId: string, pollIntervalMs?: number, timeoutMs?: number): Promise<A2ATask>;
    /**
     * Get all discovered agent cards.
     */
    getDiscoveredAgents(): AgentCard[];
}
//# sourceMappingURL=protocol.d.ts.map