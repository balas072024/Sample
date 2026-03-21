/**
 * ArivuClaw Sandbox Executor — Isolated tool execution.
 *
 * Improvements over OpenClaw:
 * - Tools execute in isolated contexts with declared permissions only
 * - Timeout enforcement prevents runaway operations
 * - Memory limits prevent resource exhaustion
 * - File system access scoped to allowed paths
 * - Network access controlled per-tool
 */
import type { SecurityPolicy, ToolCall, ToolDefinition, ToolResult } from "../core/types";
interface ExecutionContext {
    sessionId: string;
    userId: string;
    workDir: string;
}
export declare class SandboxExecutor {
    private policy;
    constructor(policy: SecurityPolicy);
    execute(call: ToolCall, tool: ToolDefinition, context: ExecutionContext): Promise<ToolResult>;
    private executeInSandbox;
    private dispatchTool;
    private executeBash;
    private executeReadFile;
    private executeWriteFile;
    private executeHttpRequest;
    private executeSearchWeb;
    private isPermissionGranted;
    private validateInput;
    private timeout;
}
export {};
//# sourceMappingURL=sandbox.d.ts.map