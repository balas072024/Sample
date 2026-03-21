import { SecurityGuard } from "../../src/security/guard";
import type { SecurityPolicy, IncomingMessage } from "../../src/core/types";

const defaultPolicy: SecurityPolicy = {
  maxTokensPerTurn: 8192,
  maxToolCallsPerTurn: 20,
  allowedDomains: [],
  blockedDomains: ["evil.com", "malware.org"],
  allowedPaths: [],
  blockedPaths: ["/etc", "/root"],
  sandboxEnabled: true,
  requireApprovalFor: ["system.process"],
  rateLimits: [
    { scope: "user", maxRequests: 5, windowMs: 1000 },
    { scope: "global", maxRequests: 10, windowMs: 1000 },
  ],
};

describe("SecurityGuard", () => {
  let guard: SecurityGuard;

  beforeEach(() => {
    guard = new SecurityGuard(defaultPolicy);
  });

  describe("validateInput", () => {
    it("rejects empty messages", () => {
      const msg: IncomingMessage = {
        channelType: "cli",
        channelUserId: "user1",
        channelMessageId: "msg1",
        content: "",
        timestamp: new Date(),
      };
      expect(guard.validateInput(msg)).toBe(false);
    });

    it("accepts messages of any length (owner mode)", () => {
      const msg: IncomingMessage = {
        channelType: "cli",
        channelUserId: "user1",
        channelMessageId: "msg1",
        content: "x".repeat(60_000),
        timestamp: new Date(),
      };
      expect(guard.validateInput(msg)).toBe(true);
    });

    it("accepts valid messages", () => {
      const msg: IncomingMessage = {
        channelType: "cli",
        channelUserId: "user1",
        channelMessageId: "msg1",
        content: "Hello, how are you?",
        timestamp: new Date(),
      };
      expect(guard.validateInput(msg)).toBe(true);
    });
  });

  describe("validateUrl", () => {
    it("allows all domains (owner has full network access)", () => {
      expect(guard.validateUrl("https://evil.com/steal-tokens")).toBe(true);
      expect(guard.validateUrl("https://sub.malware.org/exploit")).toBe(true);
    });

    it("allows valid URLs", () => {
      expect(guard.validateUrl("https://example.com/page")).toBe(true);
      expect(guard.validateUrl("https://api.github.com/repos")).toBe(true);
    });

    it("allows all protocols (owner mode)", () => {
      expect(guard.validateUrl("ftp://files.example.com")).toBe(true);
    });

    it("rejects unparseable strings", () => {
      expect(guard.validateUrl("not-a-url")).toBe(false);
    });
  });

  describe("validatePath", () => {
    it("allows all paths (owner has full system access)", () => {
      expect(guard.validatePath("/etc/shadow")).toBe(true);
      expect(guard.validatePath("/root/.ssh/id_rsa")).toBe(true);
    });

    it("allows normal paths", () => {
      expect(guard.validatePath("/home/user/project/file.ts")).toBe(true);
      expect(guard.validatePath("/tmp/test.txt")).toBe(true);
    });
  });

  describe("checkRateLimit", () => {
    it("allows requests within the limit", () => {
      for (let i = 0; i < 5; i++) {
        expect(guard.checkRateLimit("user1", "cli")).toBe(true);
      }
    });

    it("blocks requests exceeding the limit", () => {
      for (let i = 0; i < 5; i++) {
        guard.checkRateLimit("user1", "cli");
      }
      expect(guard.checkRateLimit("user1", "cli")).toBe(false);
    });

    it("isolates rate limits per user", () => {
      for (let i = 0; i < 5; i++) {
        guard.checkRateLimit("user1", "cli");
      }
      // user2 should still be allowed
      expect(guard.checkRateLimit("user2", "cli")).toBe(true);
    });
  });

  describe("checkToolPermissions", () => {
    it("allows owner to use any tool", () => {
      expect(guard.checkToolPermissions(["system.process"], ["owner"])).toBe(true);
    });

    it("allows admin access to standard tools", () => {
      expect(guard.checkToolPermissions(["filesystem.read"], ["admin"])).toBe(true);
    });

    it("allows all roles full access (owner mode)", () => {
      expect(guard.checkToolPermissions(["system.process"], ["guest"])).toBe(true);
      expect(guard.checkToolPermissions(["memory.read"], ["guest"])).toBe(true);
      expect(guard.checkToolPermissions(["unrestricted"], ["user"])).toBe(true);
    });
  });
});
