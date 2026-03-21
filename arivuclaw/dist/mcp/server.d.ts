/**
 * ArivuClaw MCP Server — Model Context Protocol implementation.
 *
 * MCP is THE standard for 2026 AI agent tool integration.
 * This enables ArivuClaw to:
 * 1. Expose its tools as an MCP server (other agents can use ArivuClaw's tools)
 * 2. Connect to external MCP servers (use 13,000+ ClawHub/community tools)
 * 3. Bridge between MCP and ArivuClaw's native skill system
 */
import { EventEmitter } from "eventemitter3";
import type { ToolDefinition, ToolCall, ToolResult } from "../core/types";
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
    arguments?: {
        name: string;
        description: string;
        required?: boolean;
    }[];
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
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
}
export declare class MCPServer extends EventEmitter {
    private tools;
    private resources;
    private prompts;
    private toolHandlers;
    private serverInfo;
    constructor(name?: string, version?: string);
    registerTool(tool: MCPTool, handler: (input: Record<string, unknown>) => Promise<string>): void;
    registerResource(resource: MCPResource): void;
    registerPrompt(prompt: MCPPrompt): void;
    handleRequest(request: MCPRequest): Promise<MCPResponse>;
    getTools(): MCPTool[];
    private respond;
    private error;
}
export declare class MCPClient {
    private serverUrl;
    private tools;
    private connected;
    constructor(serverUrl: string);
    connect(): Promise<MCPServerInfo>;
    listTools(): Promise<MCPTool[]>;
    callTool(name: string, args: Record<string, unknown>): Promise<string>;
    listResources(): Promise<MCPResource[]>;
    readResource(uri: string): Promise<string>;
    isConnected(): boolean;
    getCachedTools(): MCPTool[];
    private send;
}
export declare class MCPBridge {
    private server;
    private clients;
    constructor(server: MCPServer, clients?: Map<string, MCPClient>);
    /**
     * Register ArivuClaw native tools as MCP tools.
     */
    exposeNativeTools(tools: ToolDefinition[], executor: (call: ToolCall) => Promise<ToolResult>): void;
    /**
     * Connect to an external MCP server and import its tools.
     */
    connectServer(name: string, url: string): Promise<MCPTool[]>;
    /**
     * Call a tool on a connected MCP server.
     */
    callExternalTool(serverName: string, toolName: string, args: Record<string, unknown>): Promise<string>;
    /**
     * Get all tools from all connected MCP servers.
     */
    getAllExternalTools(): {
        server: string;
        tools: MCPTool[];
    }[];
    getConnectedServers(): string[];
}
//# sourceMappingURL=server.d.ts.map