/**
 * Arivumaiyam AI Guardrails — Owner-controlled approval system.
 * Gap #6: Human-in-the-loop when YOU want it, not forced.
 *
 * In unrestricted mode: ALL actions auto-approved (default).
 * Owner can optionally enable approval for specific action types.
 */

import { v4 as uuid } from "uuid";
import { Logger } from "../utils/logger";

const log = Logger.create("guardrails");

export type GuardrailAction = "approve" | "deny" | "ask";

export interface GuardrailRule {
  id: string;
  condition: { toolName?: string; inputPattern?: string; category?: string };
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

export class GuardrailManager {
  private rules: GuardrailRule[] = [];
  private pendingApprovals = new Map<string, PendingApproval>();
  private autoApproveAll: boolean;

  constructor(autoApproveAll: boolean = true) {
    // Default: auto-approve everything (unrestricted mode)
    this.autoApproveAll = autoApproveAll;
  }

  addRule(condition: GuardrailRule["condition"], action: GuardrailAction, reason?: string): string {
    const id = uuid();
    this.rules.push({ id, condition, action, reason });
    return id;
  }

  removeRule(id: string): boolean {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx >= 0) { this.rules.splice(idx, 1); return true; }
    return false;
  }

  checkAction(toolName: string, input: Record<string, unknown>): GuardrailAction {
    // Unrestricted mode: always approve
    if (this.autoApproveAll) return "approve";

    for (const rule of this.rules) {
      if (rule.condition.toolName && rule.condition.toolName !== toolName) continue;
      if (rule.condition.inputPattern) {
        const inputStr = JSON.stringify(input);
        if (!inputStr.includes(rule.condition.inputPattern)) continue;
      }
      return rule.action;
    }

    return "approve"; // Default: approve if no rule matches
  }

  requestApproval(toolName: string, input: Record<string, unknown>, timeoutMs: number = 30_000): PendingApproval {
    const approval: PendingApproval = {
      id: uuid(), toolName, input, timestamp: new Date(), timeoutMs, resolved: false,
    };
    this.pendingApprovals.set(approval.id, approval);
    return approval;
  }

  resolveApproval(id: string, result: "approved" | "denied"): boolean {
    const approval = this.pendingApprovals.get(id);
    if (!approval || approval.resolved) return false;
    approval.resolved = true;
    approval.result = result;
    return true;
  }

  getPendingApprovals(): PendingApproval[] {
    return Array.from(this.pendingApprovals.values()).filter((a) => !a.resolved);
  }

  setAutoApproveAll(enabled: boolean): void {
    this.autoApproveAll = enabled;
    log.info(`Auto-approve all: ${enabled}`);
  }

  getRules(): GuardrailRule[] { return [...this.rules]; }
  isAutoApproveAll(): boolean { return this.autoApproveAll; }
}
