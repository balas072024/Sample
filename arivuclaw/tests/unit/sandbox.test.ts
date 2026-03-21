/**
 * SCENARIO 9: Sandbox executor — tool execution with safety checks
 */

import { SandboxExecutor } from "../../src/security/sandbox";
import type { SecurityPolicy, ToolCall, ToolDefinition } from "../../src/core/types";

const policy: SecurityPolicy = {
  maxTokensPerTurn: 8192,
  maxToolCallsPerTurn: 20,
  allowedDomains: [],
  blockedDomains: [],
  allowedPaths: [],
  blockedPaths: [],
  sandboxEnabled: true,
  requireApprovalFor: [],
  rateLimits: [],
};

describe("Scenario 9: Sandbox Executor", () => {
  const executor = new SandboxExecutor(policy);
  const context = { sessionId: "test-session", userId: "test-user", workDir: process.cwd() };

  it("executes a bash tool call", async () => {
    const call: ToolCall = { id: "call-1", name: "bash", input: { command: "echo test123" } };
    const tool: ToolDefinition = {
      name: "bash",
      description: "Execute bash",
      inputSchema: {} as any,
      permissions: ["code.execute"],
    };
    const result = await executor.execute(call, tool, context);
    expect(result.toolCallId).toBe("call-1");
    expect(result.output).toContain("test123");
    expect(result.error).toBeUndefined();
  });

  it("executes read_file tool", async () => {
    const call: ToolCall = { id: "call-2", name: "read_file", input: { path: "package.json" } };
    const tool: ToolDefinition = {
      name: "read_file",
      description: "Read file",
      inputSchema: {} as any,
      permissions: ["filesystem.read"],
    };
    const result = await executor.execute(call, tool, context);
    expect(result.output).toContain("arivuclaw");
  });

  it("times out long-running commands", async () => {
    const call: ToolCall = { id: "call-3", name: "bash", input: { command: "sleep 60" } };
    const tool: ToolDefinition = {
      name: "bash",
      description: "Execute bash",
      inputSchema: {} as any,
      permissions: ["code.execute"],
    };
    const result = await executor.execute(call, tool, context);
    // Should timeout or error
    expect(result.error).toBeDefined();
  }, 35000);

  it("handles unknown tools gracefully", async () => {
    const call: ToolCall = { id: "call-4", name: "unknown_tool", input: {} };
    const tool: ToolDefinition = {
      name: "unknown_tool",
      description: "Unknown",
      inputSchema: {} as any,
      permissions: [],
    };
    const result = await executor.execute(call, tool, context);
    expect(result.toolCallId).toBe("call-4");
    // Should return some output or handle gracefully
    expect(typeof result.output).toBe("string");
  });

  it("validates tool inputs", async () => {
    const call: ToolCall = { id: "call-5", name: "bash", input: { command: "echo works" } };
    const tool: ToolDefinition = {
      name: "bash",
      description: "Execute bash",
      inputSchema: {} as any,
      permissions: ["code.execute"],
    };
    const result = await executor.execute(call, tool, context);
    expect(result.output).toContain("works");
  });
});
