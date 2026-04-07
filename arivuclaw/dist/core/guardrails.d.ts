/**
 * ArivuClaw Guardrails — Owner-controlled approval system.
 * Gap #6: Human-in-the-loop when YOU want it, not forced.
 *
 * In unrestricted mode: ALL actions auto-approved (default).
 * Owner can optionally enable approval for specific action types.
 */
export type GuardrailAction = "approve" | "deny" | "ask";
export interface GuardrailRule {
    id: string;
    condition: {
        toolName?: string;
        inputPattern?: string;
        category?: string;
    };
    action: GuardrailAction;
    reason?: string;
}
export interface PendingApproval {
    id: string;
    toolName: string;
    input: Record<string, unknown>;
    timestamp: Date;
    timeoutMs: number;
    resolved: boolean;
    result?: "approved" | "denied";
}
export declare class GuardrailManager {
    private rules;
    private pendingApprovals;
    private autoApproveAll;
    constructor(autoApproveAll?: boolean);
    addRule(condition: GuardrailRule["condition"], action: GuardrailAction, reason?: string): string;
    removeRule(id: string): boolean;
    checkAction(toolName: string, input: Record<string, unknown>): GuardrailAction;
    requestApproval(toolName: string, input: Record<string, unknown>, timeoutMs?: number): PendingApproval;
    resolveApproval(id: string, result: "approved" | "denied"): boolean;
    getPendingApprovals(): PendingApproval[];
    setAutoApproveAll(enabled: boolean): void;
    getRules(): GuardrailRule[];
    isAutoApproveAll(): boolean;
}
//# sourceMappingURL=guardrails.d.ts.map