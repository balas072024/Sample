# MCP Integration Guide

## What is MCP?

The **Model Context Protocol (MCP)** is the 2026 open standard for AI agent tool integration, adopted by Anthropic, OpenAI, Google DeepMind, and the Linux Foundation. It enables interoperability between AI agents and tool servers.

Arivumaiyam AI supports MCP natively as both a **server** (expose tools to other agents) and a **client** (use tools from external MCP servers).

## Arivumaiyam AI as MCP Server

Expose Arivumaiyam AI's 112 skills as MCP tools for other agents to use:

```typescript
import { MCPServer, MCPBridge } from "arivuclaw";

const server = new MCPServer("arivuclaw", "1.0.0");

// Register a custom tool
server.registerTool(
  {
    name: "analyze_network",
    description: "Analyze network traffic on the local subnet",
    inputSchema: {
      type: "object",
      properties: { subnet: { type: "string" } },
      required: ["subnet"],
    },
  },
  async (input) => {
    // Your tool logic here
    return `Network analysis for ${input.subnet}: ...`;
  },
);

// Handle MCP requests (from HTTP, stdio, or WebSocket transport)
const response = await server.handleRequest({
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: { name: "analyze_network", arguments: { subnet: "192.168.1.0/24" } },
});
```

## Arivumaiyam AI as MCP Client

Connect to external MCP servers (ClawHub, community tools, custom servers):

```typescript
import { MCPClient } from "arivuclaw";

const client = new MCPClient("http://localhost:8080/mcp");
await client.connect();

// List available tools
const tools = await client.listTools();

// Call a tool
const result = await client.callTool("github_create_pr", {
  repo: "my-org/my-repo",
  title: "Fix bug",
  body: "Fixes #123",
});
```

## MCP Bridge

The bridge connects Arivumaiyam AI's native skill system with the MCP ecosystem:

```typescript
import { MCPServer, MCPBridge } from "arivuclaw";

const server = new MCPServer();
const bridge = new MCPBridge(server);

// Expose all native Arivumaiyam AI tools as MCP
bridge.exposeNativeTools(nativeTools, toolExecutor);

// Connect to external MCP servers
await bridge.connectServer("github", "http://localhost:3001/mcp");
await bridge.connectServer("slack", "http://localhost:3002/mcp");

// Call tools across servers
const result = await bridge.callExternalTool("github", "create_issue", { title: "Bug" });
```

## Supported MCP Methods

| Method | Description |
|--------|-------------|
| `initialize` | Handshake and capability exchange |
| `tools/list` | List available tools |
| `tools/call` | Execute a tool |
| `resources/list` | List available resources |
| `resources/read` | Read a resource |
| `prompts/list` | List available prompts |
| `ping` | Health check |

## Connecting to ClawHub

Arivumaiyam AI can connect to OpenClaw's ClawHub ecosystem (13,000+ MCP skills):

```json
{
  "mcp": {
    "servers": [
      { "name": "clawhub-github", "url": "npx @clawhub/github-mcp" },
      { "name": "clawhub-slack", "url": "npx @clawhub/slack-mcp" }
    ]
  }
}
```
