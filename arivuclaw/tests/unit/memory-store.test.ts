import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { VectorMemoryStore } from "../../src/memory/vector-store";
import type { MemoryEntry, MemoryStoreConfig } from "../../src/core/types";

describe("VectorMemoryStore", () => {
  let tempDir: string;
  let store: VectorMemoryStore;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "arivuclaw-memory-"));
    const config: MemoryStoreConfig = {
      type: "local",
      embeddingProvider: "anthropic",
      embeddingModel: "test",
      options: { dataDir: tempDir },
    };
    store = new VectorMemoryStore(config);
    await store.initialize();
  });

  afterEach(async () => {
    await store.shutdown();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("stores and retrieves entries", async () => {
    await store.store({
      id: "entry1",
      userId: "user1",
      content: "TypeScript is a typed superset of JavaScript",
      type: "conversation",
      source: "cli",
      timestamp: new Date(),
    });

    const results = await store.search("TypeScript", "user1");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].content).toContain("TypeScript");
  });

  it("isolates entries by user", async () => {
    await store.store({
      id: "entry1",
      userId: "user1",
      content: "Secret user1 info",
      type: "conversation",
      source: "cli",
      timestamp: new Date(),
    });

    const results = await store.search("Secret", "user2");
    expect(results).toHaveLength(0);
  });

  it("retrieves recent entries", async () => {
    for (let i = 0; i < 5; i++) {
      await store.store({
        id: `entry${i}`,
        userId: "user1",
        content: `Message number ${i}`,
        type: "conversation",
        source: "cli",
        timestamp: new Date(Date.now() + i * 1000),
      });
    }

    const recent = await store.getRecent("user1", 3);
    expect(recent).toHaveLength(3);
  });

  it("extracts facts from conversations", async () => {
    await store.store({
      id: "entry-fact",
      userId: "user1",
      content: "My name is Alice and I live in San Francisco",
      type: "conversation",
      source: "cli",
      timestamp: new Date(),
    });

    const facts = await store.getFacts("user1");
    expect(facts.length).toBeGreaterThan(0);

    const nameFact = facts.find((f) => f.key === "name");
    expect(nameFact?.value).toBe("Alice");
  });

  it("stores and retrieves user facts", async () => {
    await store.storeFact({
      id: "fact1",
      userId: "user1",
      category: "preference",
      key: "language",
      value: "TypeScript",
      confidence: 0.9,
      source: "cli",
      extractedAt: new Date(),
    });

    const facts = await store.getFacts("user1", "preference");
    expect(facts).toHaveLength(1);
    expect(facts[0].value).toBe("TypeScript");
  });

  it("deletes entries", async () => {
    await store.store({
      id: "to-delete",
      userId: "user1",
      content: "Temporary entry",
      type: "conversation",
      source: "cli",
      timestamp: new Date(),
    });

    await store.delete("to-delete");

    const results = await store.search("Temporary", "user1");
    expect(results).toHaveLength(0);
  });

  it("returns memory stats", async () => {
    await store.store({
      id: "stat-entry",
      userId: "user1",
      content: "Test entry for stats",
      type: "conversation",
      source: "cli",
      timestamp: new Date(),
    });

    const stats = store.getStats();
    expect(stats.totalEntries).toBeGreaterThanOrEqual(1);
    expect(stats.totalUsers).toBeGreaterThanOrEqual(1);
  });
});
