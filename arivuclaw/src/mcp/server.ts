/**
 * Arivumaiyam AI MCP Server — Model Context Protocol implementation.
 *
 * MCP is THE standard for 2026 AI agent tool integration.
 * This enables Arivumaiyam AI to:
 * 1. Expose its tools as an MCP server (other agents can use Arivumaiyam AI's tools)
 * 2. Connect to external MCP servers (use 13,000+ ClawHub/community tools)
 * 3. Bridge between MCP and Arivumaiyam AI's native skill system
 */

import { EventEmitter } from "eventemitter3";
import { v4 as uuid } from "uuid";
import type { ToolDefinition, ToolCall, ToolResult } from "../core/types.js";
import { Logger } from "../utils/logger.js";

const log = Logger.create("mcp");

// ─── MCP Protocol Types ────────────────────────────────────────────

export interface MCPServerInfo {
  name: string;
  version: string;
  capabilities: MCPCapabilities;
}

export interface MCPCapabilities {
  tools?: boolean;
  resources?: boolean;
  prompts?: boolean;
  logging?: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPResource {
  uri: string;
  name: string;
  mimeType?: string;
  description?: string;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: { name: string; description: string; required?: boolean }[];
}

export interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

// ─── MCP Server (expose Arivumaiyam AI tools to other agents) ──────────

export class MCPServer extends EventEmitter {
  private tools = new Map<string, MCPTool>();
  private resources = new Map<string, MCPResource>();
  private prompts = new Map<string, MCPPrompt>();
  private toolHandlers = new Map<string, (input: Record<string, unknown>) => Promise<string>>();
  private serverInfo: MCPServerInfo;

  constructor(name: string = "arivuclaw", version: string = "1.0.0") {
    super();
    this.serverInfo = {
      name,
      version,
      capabilities: { tools: true, resources: true, prompts: true, logging: true },
    };
  }

  registerTool(tool: MCPTool, handler: (input: Record<string, unknown>) => Promise<string>): void {
    this.tools.set(tool.name, tool);
    this.toolHandlers.set(tool.name, handler);
    log.info(`MCP tool registered: ${tool.name}`);
  }

  registerResource(resource: MCPResource): void {
    this.resources.set(resource.uri, resource);
  }

  registerPrompt(prompt: MCPPrompt): void {
    this.prompts.set(prompt.name, prompt);
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
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
          const params = request.params as { name: string; arguments: Record<string, unknown> };
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
          const uri = (request.params as { uri: string }).uri;
          const resource = this.resources.get(uri);
          if (!resource) return this.error(request.id, -32602, `Resource not found: ${uri}`);
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return this.error(request.id, -32603, msg);
    }
  }

  getTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  private respond(id: string | number, result: unknown): MCPResponse {
    return { jsonrpc: "2.0", id, result };
  }

  private error(id: string | number, code: number, message: string): MCPResponse {
    return { jsonrpc: "2.0", id, error: { code, message } };
  }
}

// ─── MCP Client (connect to external MCP servers) ─────────────────

export class MCPClient {
  private serverUrl: string;
  private tools: MCPTool[] = [];
  private connected = false;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  async connect(): Promise<MCPServerInfo> {
    const response = await this.send("initialize", {
      protocolVersion: "2024-11-05",
      clientInfo: { name: "arivuclaw", version: "1.0.0" },
      capabilities: {},
    });
    this.connected = true;
    return response.result as MCPServerInfo;
  }

  async listTools(): Promise<MCPTool[]> {
    const response = await this.send("tools/list", {});
    this.tools = (response.result as { tools: MCPTool[] }).tools;
    return this.tools;
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<string> {
    const response = await this.send("tools/call", { name, arguments: args });
    const result = response.result as { content: { type: string; text: string }[] };
    return result.content.map((c) => c.text).join("\n");
  }

  async listResources(): Promise<MCPResource[]> {
    const response = await this.send("resources/list", {});
    return (response.result as { resources: MCPResource[] }).resources;
  }

  async readResource(uri: string): Promise<string> {
    const response = await this.send("resources/read", { uri });
    const result = response.result as { contents: { text: string }[] };
    return result.contents.map((c) => c.text).join("\n");
  }

  isConnected(): boolean {
    return this.connected;
  }

  getCachedTools(): MCPTool[] {
    return this.tools;
  }

  private async send(method: string, params: Record<string, unknown>): Promise<MCPResponse> {
    const request: MCPRequest = {
      jsonrpc: "2.0",
      id: uuid(),
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
      return (await response.json()) as MCPResponse;
    }

    // For stdio transport, this would pipe to a subprocess
    throw new Error("Stdio MCP transport not yet connected");
  }
}

// ─── MCP Bridge (convert between MCP and Arivumaiyam AI native tools) ──

export class MCPBridge {
  constructor(
    private server: MCPServer,
    private clients: Map<string, MCPClient> = new Map(),
  ) {}

  /**
   * Register Arivumaiyam AI native tools as MCP tools.
   */
  exposeNativeTools(tools: ToolDefinition[], executor: (call: ToolCall) => Promise<ToolResult>): void {
    for (const tool of tools) {
      this.server.registerTool(
        { name: tool.name, description: tool.description, inputSchema: tool.inputSchema as unknown as Record<string, unknown> },
        async (input) => {
          const result = await executor({ id: uuid(), name: tool.name, input });
          return result.output || result.error || "";
        },
      );
    }
  }

  /**
   * Connect to an external MCP server and import its tools.
   */
  async connectServer(name: string, url: string): Promise<MCPTool[]> {
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
  async callExternalTool(serverName: string, toolName: string, args: Record<string, unknown>): Promise<string> {
    const client = this.clients.get(serverName);
    if (!client) throw new Error(`MCP server '${serverName}' not connected`);
    return client.callTool(toolName, args);
  }

  /**
   * Get all tools from all connected MCP servers.
   */
  getAllExternalTools(): { server: string; tools: MCPTool[] }[] {
    return Array.from(this.clients.entries()).map(([name, client]) => ({
      server: name,
      tools: client.getCachedTools(),
    }));
  }

  getConnectedServers(): string[] {
    return Array.from(this.clients.keys());
  }
}
