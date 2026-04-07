/**
 * ArivuClaw Security Guard — Input validation, rate limiting, and permission checks.
 *
 * Improvements over OpenClaw:
 * - All gateway URLs validated (prevents CVE-2026-25253 style token theft)
 * - Per-user, per-channel, and global rate limiting
 * - Granular permission model with role-based access
 * - Prompt injection detection heuristics
 * - Path traversal prevention
 */
import type { IncomingMessage, ChannelType, ToolPermission, UserRole, SecurityPolicy } from "../core/types";
export declare class SecurityGuard {
    private policy;
    private rateLimitBuckets;
    constructor(policy: SecurityPolicy);
    validateInput(msg: IncomingMessage): boolean;
    /**
     * Validate URLs to prevent open redirect / token theft attacks.
     * This is a direct fix for the CVE-2026-25253 class of vulnerability.
     */
    validateUrl(url: string, allowedDomains?: string[]): boolean;
    /**
     * Validate file paths to prevent path traversal attacks.
     */
    validatePath(requestedPath: string): boolean;
    checkRateLimit(userId: string, channelType: ChannelType): boolean;
    private getRateLimitKey;
    checkToolPermissions(required: ToolPermission[], userRoles: UserRole[]): boolean;
    private detectPromptInjection;
    cleanupExpiredBuckets(): void;
}
//# sourceMappingURL=guard.d.ts.map