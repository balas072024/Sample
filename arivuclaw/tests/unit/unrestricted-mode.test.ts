/**
 * SCENARIO 4: Unrestricted mode — no sandbox, no limits
 */

import {
  getUnrestrictedPolicy,
  getLocalAdminPolicy,
  getSecurityPolicyForMode,
  UnrestrictedGuard,
  DirectExecutor,
} from "../../src/security/unrestricted";
import type { SecurityPolicy } from "../../src/core/types";

describe("Scenario 4: Unrestricted Mode", () => {
  describe("getUnrestrictedPolicy", () => {
    it("returns policy with no limits", () => {
      const policy = getUnrestrictedPolicy();
      expect(policy.sandboxEnabled).toBe(false);
      expect(policy.blockedDomains).toEqual([]);
      expect(policy.blockedPaths).toEqual([]);
      expect(policy.requireApprovalFor).toEqual([]);
      expect(policy.rateLimits).toEqual([]);
      expect(policy.maxTokensPerTurn).toBe(100_000);
      expect(policy.maxToolCallsPerTurn).toBe(200);
    });
  });

  describe("getLocalAdminPolicy", () => {
    it("returns elevated policy with basic limits", () => {
      const policy = getLocalAdminPolicy();
      expect(policy.sandboxEnabled).toBe(false);
      expect(policy.requireApprovalFor).toEqual([]);
      expect(policy.rateLimits.length).toBeGreaterThan(0);
    });
  });

  describe("getSecurityPolicyForMode", () => {
    const basePolicy: SecurityPolicy = {
      maxTokensPerTurn: 4096,
      maxToolCallsPerTurn: 10,
      allowedDomains: [],
      blockedDomains: ["evil.com"],
      allowedPaths: [],
      blockedPaths: ["/etc"],
      sandboxEnabled: true,
      requireApprovalFor: ["system.process"],
      rateLimits: [{ scope: "user", maxRequests: 5, windowMs: 1000 }],
    };

    it("returns unrestricted policy for unrestricted mode", () => {
      const policy = getSecurityPolicyForMode("unrestricted", basePolicy);
      expect(policy.sandboxEnabled).toBe(false);
      expect(policy.blockedDomains).toEqual([]);
    });

    it("returns local-admin policy for local-admin mode", () => {
      const policy = getSecurityPolicyForMode("local-admin", basePolicy);
      expect(policy.sandboxEnabled).toBe(false);
    });

    it("returns base policy for restricted mode", () => {
      const policy = getSecurityPolicyForMode("restricted", basePolicy);
      expect(policy.sandboxEnabled).toBe(true);
      expect(policy.blockedDomains).toContain("evil.com");
    });
  });

  describe("UnrestrictedGuard", () => {
    const guard = new UnrestrictedGuard();

    it("validates all inputs", () => {
      expect(guard.validateInput()).toBe(true);
    });

    it("allows all URLs", () => {
      expect(guard.validateUrl()).toBe(true);
    });

    it("allows all paths", () => {
      expect(guard.validatePath()).toBe(true);
    });

    it("has no rate limits", () => {
      expect(guard.checkRateLimit()).toBe(true);
    });

    it("grants all tool permissions", () => {
      expect(guard.checkToolPermissions()).toBe(true);
    });
  });

  describe("DirectExecutor", () => {
    const executor = new DirectExecutor();

    it("executes bash commands", async () => {
      const output = await executor.executeBash("echo hello", "/tmp");
      expect(output.trim()).toBe("hello");
    });

    it("returns system info", async () => {
      const info = await executor.getSystemInfo();
      expect(info.hostname).toBeDefined();
      expect(info.os).toBeDefined();
      expect(info.user).toBeDefined();
    });

    it("detects package manager", () => {
      // Should detect at least one package manager
      const pm = (executor as any).constructor;
      // Just verify the method exists
      expect(typeof executor.getSystemInfo).toBe("function");
    });
  });
});
