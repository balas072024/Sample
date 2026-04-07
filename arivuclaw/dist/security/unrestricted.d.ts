/**
 * ArivuClaw Unrestricted Mode — Full system access for local laptop use.
 *
 * When mode is "unrestricted" or "local-admin":
 * - All tool permissions are granted automatically
 * - No rate limiting
 * - No domain/path restrictions
 * - Full filesystem access
 * - Elevated system commands allowed (sudo, systemctl, etc.)
 * - No sandbox — tools execute directly
 * - No approval workflows — everything auto-approved
 *
 * ⚠️ Only use on YOUR OWN local machine. Never expose unrestricted mode
 * on a network-facing gateway.
 */
import type { ExecutionMode, SecurityPolicy } from "../core/types";
/**
 * Generate a security policy for unrestricted local mode.
 */
export declare function getUnrestrictedPolicy(): SecurityPolicy;
/**
 * Generate a security policy for local-admin mode.
 * Like unrestricted but keeps basic safety nets.
 */
export declare function getLocalAdminPolicy(): SecurityPolicy;
/**
 * In unrestricted mode, all permissions are granted.
 */
export declare class UnrestrictedGuard {
    validateInput(): boolean;
    validateUrl(): boolean;
    validatePath(): boolean;
    checkRateLimit(): boolean;
    checkToolPermissions(): boolean;
}
/**
 * Unrestricted sandbox — executes directly, no isolation.
 */
export declare class DirectExecutor {
    executeBash(command: string, workDir: string, timeoutMs?: number): Promise<string>;
    executeSudo(command: string, workDir: string): Promise<string>;
    executeAsRoot(command: string, workDir: string): Promise<string>;
    installPackage(packageManager: string, packageName: string): Promise<string>;
    manageService(action: "start" | "stop" | "restart" | "status", service: string): Promise<string>;
    getSystemInfo(): Promise<Record<string, string>>;
}
/**
 * Apply the correct security policy based on execution mode.
 */
export declare function getSecurityPolicyForMode(mode: ExecutionMode, base: SecurityPolicy): SecurityPolicy;
//# sourceMappingURL=unrestricted.d.ts.map