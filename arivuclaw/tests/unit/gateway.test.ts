/**
 * SCENARIO 2: Gateway — Message routing and session management
 */

import { Gateway } from "../../src/core/gateway";
import type {
  ArivumaiyamConfig,
  ChannelAdapter,
  ChannelConfig,
  ChannelStatus,
  ChannelType,
  IncomingMessage,
  MemoryStore,
  MemoryEntry,
  UserFact,
  Attachment,
} from "../../src/core/types";

// Mock memory store
const mockMemoryStore: MemoryStore = {
  type: "mock",
  initialize: jest.fn().mockResolvedValue(undefined),
  shutdown: jest.fn().mockResolvedValue(undefined),
  store: jest.fn().mockResolvedValue(undefined),
  search: jest.fn().mockResolvedValue([]),
  getRecent: jest.fn().mockResolvedValue([]),
  delete: jest.fn().mockResolvedValue(undefined),
  storeFact: jest.fn().mockResolvedValue(undefined),
  getFacts: jest.fn().mockResolvedValue([]),
};

// Mock channel adapter
class MockChannel implements ChannelAdapter {
  readonly type: ChannelType = "cli";
  readonly name = "Mock CLI";
  private handler?: (msg: IncomingMessage) => Promise<void>;
  public sentMessages: { userId: string; content: string }[] = [];

  async initialize(config: ChannelConfig): Promise<void> {}
  async shutdown(): Promise<void> {}
  async sendMessage(userId: string, content: string): Promise<void> {
    this.sentMessages.push({ userId, content });
  }
  onMessage(handler: (msg: IncomingMessage) => Promise<void>): void {
    this.handler = handler;
  }
  getStatus(): ChannelStatus {
    return { type: "cli", connected: true };
  }
  async simulateMessage(msg: IncomingMessage): Promise<void> {
    if (this.handler) await this.handler(msg);
  }
}

const minimalConfig: ArivumaiyamConfig = {
  mode: "unrestricted",
  gateway: { host: "0.0.0.0", port: 3000, corsOrigins: [] },
  providers: {},
  defaultProvider: "anthropic",
  defaultModel: "test",
  channels: [{ type: "cli", enabled: true, credentials: {} }],
  memory: { type: "local", embeddingProvider: "anthropic", embeddingModel: "test" },
  security: {
    maxTokensPerTurn: 8192,
    maxToolCallsPerTurn: 20,
    allowedDomains: [],
    blockedDomains: [],
    allowedPaths: [],
    blockedPaths: [],
    sandboxEnabled: false,
    requireApprovalFor: [],
    rateLimits: [],
  },
  skills: { directories: [], autoload: false, hotReload: false },
  logging: { level: "error" },
};

describe("Scenario 2: Gateway", () => {
  let gateway: Gateway;

  beforeEach(() => {
    gateway = new Gateway(minimalConfig, mockMemoryStore);
  });

  afterEach(async () => {
    await gateway.shutdown();
  });

  it("registers a channel adapter", async () => {
    const channel = new MockChannel();
    await gateway.registerChannel(channel);
    expect(gateway.getActiveChannels()).toContain("cli");
  });

  it("returns channel by type", async () => {
    const channel = new MockChannel();
    await gateway.registerChannel(channel);
    expect(gateway.getChannel("cli")).toBe(channel);
  });

  it("returns undefined for unregistered channel", () => {
    expect(gateway.getChannel("telegram")).toBeUndefined();
  });

  it("prevents duplicate channel registration", async () => {
    const ch1 = new MockChannel();
    const ch2 = new MockChannel();
    await gateway.registerChannel(ch1);
    await expect(gateway.registerChannel(ch2)).rejects.toThrow("already registered");
  });

  it("unregisters a channel", async () => {
    const channel = new MockChannel();
    await gateway.registerChannel(channel);
    await gateway.unregisterChannel("cli");
    expect(gateway.getActiveChannels()).not.toContain("cli");
  });

  it("starts and reports health", async () => {
    await gateway.start();
    const health = gateway.getHealth();
    expect(health.running).toBe(true);
    expect(health.activeSessions).toBe(0);
  });

  it("shuts down gracefully", async () => {
    const channel = new MockChannel();
    await gateway.registerChannel(channel);
    await gateway.start();
    await gateway.shutdown();
    expect(gateway.getHealth().running).toBe(false);
  });

  it("links user across channels", async () => {
    const channel = new MockChannel();
    await gateway.registerChannel(channel);
    // This tests internal identity resolution — no assertion on private state,
    // but should not throw
    expect(() => gateway.linkUserChannel("nonexistent", "telegram", "123")).toThrow();
  });
});
