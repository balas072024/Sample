"use strict";
/**
 * ArivuClaw MCP Server — Model Context Protocol implementation.
 *
 * MCP is THE standard for 2026 AI agent tool integration.
 * This enables ArivuClaw to:
 * 1. Expose its tools as an MCP server (other agents can use ArivuClaw's tools)
 * 2. Connect to external MCP servers (use 13,000+ ClawHub/community tools)
 * 3. Bridge between MCP and ArivuClaw's native skill system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPBridge = exports.MCPClient = exports.MCPServer = void 0;
const eventemitter3_1 = require("eventemitter3");
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
const log = logger_1.Logger.create("mcp");
// ─── MCP Server (expose ArivuClaw tools to other agents) ──────────
class MCPServer extends eventemitter3_1.EventEmitter {
    tools = new Map();
    resources = new Map();
    prompts = new Map();
    toolHandlers = new Map();
    serverInfo;
    constructor(name = "arivuclaw", version = "1.0.0") {
        super();
        this.serverInfo = {
            name,
            version,
            capabilities: { tools: true, resources: true, prompts: true, logging: true },
        };
    }
    registerTool(tool, handler) {
        this.tools.set(tool.name, tool);
        this.toolHandlers.set(tool.name, handler);
        log.info(`MCP tool registered: ${tool.name}`);
    }
    registerResource(resource) {
        this.resources.set(resource.uri, resource);
    }
    registerPrompt(prompt) {
        this.prompts.set(prompt.name, prompt);
    }
    async handleRequest(request) {
        try {
            switch (request.method) {
                case "initialize":
                    return this.respond(request.id, {
                        protocolVersion: "2024-11-05",
                        serverInfo: this.serverInfo,
                        capabilities: this.serverInfo.capabilities,
                    });
                case "tools/list":
                    return this.respond(request.id, {
                        tools: Array.from(this.tools.values()),
                    });
                case "tools/call": {
                    const params = request.params;
                    const handler = this.toolHandlers.get(params.name);
                    if (!handler) {
                        return this.error(request.id, -32601, `Tool not found: ${params.name}`);
                    }
                    const result = await handler(params.arguments);
                    return this.respond(request.id, { content: [{ type: "text", text: result }] });
                }
                case "resources/list":
                    return this.respond(request.id, {
                        resources: Array.from(this.resources.values()),
                    });
                case "resources/read": {
                    const uri = request.params.uri;
                    const resource = this.resources.get(uri);
                    if (!resource)
                        return this.error(request.id, -32602, `Resource not found: ${uri}`);
                    this.emit("resource.read", uri);
                    return this.respond(request.id, { contents: [{ uri, text: `Resource: ${resource.name}` }] });
                }
                case "prompts/list":
                    return this.respond(request.id, {
                        prompts: Array.from(this.prompts.values()),
                    });
                case "ping":
                    return this.respond(request.id, {});
                default:
                    return this.error(request.id, -32601, `Method not found: ${request.method}`);
            }
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return this.error(request.id, -32603, msg);
        }
    }
    getTools() {
        return Array.from(this.tools.values());
    }
    respond(id, result) {
        return { jsonrpc: "2.0", id, result };
    }
    error(id, code, message) {
        return { jsonrpc: "2.0", id, error: { code, message } };
    }
}
exports.MCPServer = MCPServer;
// ─── MCP Client (connect to external MCP servers) ─────────────────
class MCPClient {
    serverUrl;
    tools = [];
    connected = false;
    constructor(serverUrl) {
        this.serverUrl = serverUrl;
    }
    async connect() {
        const response = await this.send("initialize", {
            protocolVersion: "2024-11-05",
            clientInfo: { name: "arivuclaw", version: "1.0.0" },
            capabilities: {},
        });
        this.connected = true;
        return response.result;
    }
    async listTools() {
        const response = await this.send("tools/list", {});
        this.tools = response.result.tools;
        return this.tools;
    }
    async callTool(name, args) {
        const response = await this.send("tools/call", { name, arguments: args });
        const result = response.result;
        return result.content.map((c) => c.text).join("\n");
    }
    async listResources() {
        const response = await this.send("resources/list", {});
        return response.result.resources;
    }
    async readResource(uri) {
        const response = await this.send("resources/read", { uri });
        const result = response.result;
        return result.contents.map((c) => c.text).join("\n");
    }
    isConnected() {
        return this.connected;
    }
    getCachedTools() {
        return this.tools;
    }
    async send(method, params) {
        const request = {
            jsonrpc: "2.0",
            id: (0, uuid_1.v4)(),
            method,
            params,
        };
        // Support both HTTP and stdio transports
        if (this.serverUrl.startsWith("http")) {
            const response = await fetch(this.serverUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(request),
            });
            return (await response.json());
        }
        // For stdio transport, this would pipe to a subprocess
        throw new Error("Stdio MCP transport not yet connected");
    }
}
exports.MCPClient = MCPClient;
// ─── MCP Bridge (convert between MCP and ArivuClaw native tools) ──
class MCPBridge {
    server;
    clients;
    constructor(server, clients = new Map()) {
        this.server = server;
        this.clients = clients;
    }
    /**
     * Register ArivuClaw native tools as MCP tools.
     */
    exposeNativeTools(tools, executor) {
        for (const tool of tools) {
            this.server.registerTool({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema }, async (input) => {
                const result = await executor({ id: (0, uuid_1.v4)(), name: tool.name, input });
                return result.output || result.error || "";
            });
        }
    }
    /**
     * Connect to an external MCP server and import its tools.
     */
    async connectServer(name, url) {
        const client = new MCPClient(url);
        await client.connect();
        const tools = await client.listTools();
        this.clients.set(name, client);
        log.info(`Connected to MCP server '${name}': ${tools.length} tools available`);
        return tools;
    }
    /**
     * Call a tool on a connected MCP server.
     */
    async callExternalTool(serverName, toolName, args) {
        const client = this.clients.get(serverName);
        if (!client)
            throw new Error(`MCP server '${serverName}' not connected`);
        return client.callTool(toolName, args);
    }
    /**
     * Get all tools from all connected MCP servers.
     */
    getAllExternalTools() {
        return Array.from(this.clients.entries()).map(([name, client]) => ({
            server: name,
            tools: client.getCachedTools(),
        }));
    }
    getConnectedServers() {
        return Array.from(this.clients.keys());
    }
}
exports.MCPBridge = MCPBridge;
//# sourceMappingURL=server.js.map