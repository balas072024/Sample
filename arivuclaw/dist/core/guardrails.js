"use strict";
/**
 * ArivuClaw Guardrails — Owner-controlled approval system.
 * Gap #6: Human-in-the-loop when YOU want it, not forced.
 *
 * In unrestricted mode: ALL actions auto-approved (default).
 * Owner can optionally enable approval for specific action types.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuardrailManager = void 0;
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
const log = logger_1.Logger.create("guardrails");
class GuardrailManager {
    rules = [];
    pendingApprovals = new Map();
    autoApproveAll;
    constructor(autoApproveAll = true) {
        // Default: auto-approve everything (unrestricted mode)
        this.autoApproveAll = autoApproveAll;
    }
    addRule(condition, action, reason) {
        const id = (0, uuid_1.v4)();
        this.rules.push({ id, condition, action, reason });
        return id;
    }
    removeRule(id) {
        const idx = this.rules.findIndex((r) => r.id === id);
        if (idx >= 0) {
            this.rules.splice(idx, 1);
            return true;
        }
        return false;
    }
    checkAction(toolName, input) {
        // Unrestricted mode: always approve
        if (this.autoApproveAll)
            return "approve";
        for (const rule of this.rules) {
            if (rule.condition.toolName && rule.condition.toolName !== toolName)
                continue;
            if (rule.condition.inputPattern) {
                const inputStr = JSON.stringify(input);
                if (!inputStr.includes(rule.condition.inputPattern))
                    continue;
            }
            return rule.action;
        }
        return "approve"; // Default: approve if no rule matches
    }
    requestApproval(toolName, input, timeoutMs = 30_000) {
        const approval = {
            id: (0, uuid_1.v4)(), toolName, input, timestamp: new Date(), timeoutMs, resolved: false,
        };
        this.pendingApprovals.set(approval.id, approval);
        return approval;
    }
    resolveApproval(id, result) {
        const approval = this.pendingApprovals.get(id);
        if (!approval || approval.resolved)
            return false;
        approval.resolved = true;
        approval.result = result;
        return true;
    }
    getPendingApprovals() {
        return Array.from(this.pendingApprovals.values()).filter((a) => !a.resolved);
    }
    setAutoApproveAll(enabled) {
        this.autoApproveAll = enabled;
        log.info(`Auto-approve all: ${enabled}`);
    }
    getRules() { return [...this.rules]; }
    isAutoApproveAll() { return this.autoApproveAll; }
}
exports.GuardrailManager = GuardrailManager;
//# sourceMappingURL=guardrails.js.map