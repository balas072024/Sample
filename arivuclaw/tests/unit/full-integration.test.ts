/**
 * SCENARIO 10: Full Integration — End-to-end system validation
 * - Type-checks pass
 * - All modules import correctly
 * - All exports are accessible
 * - Skills + Providers + Security + Memory + Channels all work together
 */

describe("Scenario 10: Full Integration", () => {
  describe("Module Imports", () => {
    it("imports core modules", () => {
      const core = require("../../src/core/gateway");
      expect(core.Gateway).toBeDefined();

      const runtime = require("../../src/core/agent-runtime");
      expect(runtime.AgentRuntime).toBeDefined();
    });

    it("imports all providers", () => {
      const anthropic = require("../../src/plugins/providers/anthropic");
      expect(anthropic.AnthropicProvider).toBeDefined();

      const openai = require("../../src/plugins/providers/openai");
      expect(openai.OpenAIProvider).toBeDefined();

      const ollama = require("../../src/plugins/providers/ollama");
      expect(ollama.OllamaProvider).toBeDefined();

      const minimax = require("../../src/plugins/providers/minimax");
      expect(minimax.MiniMaxProvider).toBeDefined();

      const deepseek = require("../../src/plugins/providers/deepseek");
      expect(deepseek.DeepSeekProvider).toBeDefined();

      const groq = require("../../src/plugins/providers/groq");
      expect(groq.GroqProvider).toBeDefined();

      const neuralBrain = require("../../src/plugins/providers/neural-brain");
      expect(neuralBrain.NeuralBrainProvider).toBeDefined();
    });

    it("imports all channel adapters", () => {
      const channels = require("../../src/channels/index");
      expect(channels.WhatsAppChannel).toBeDefined();
      expect(channels.TelegramChannel).toBeDefined();
      expect(channels.DiscordChannel).toBeDefined();
      expect(channels.SlackChannel).toBeDefined();
      expect(channels.WebChannel).toBeDefined();
      expect(channels.CLIChannel).toBeDefined();
      expect(channels.BaseChannel).toBeDefined();
    });

    it("imports skills system", () => {
      const registry = require("../../src/skills/registry");
      expect(registry.SkillRegistry).toBeDefined();

      const loader = require("../../src/skills/loader");
      expect(loader.SkillLoader).toBeDefined();
    });

    it("imports memory store", () => {
      const memory = require("../../src/memory/vector-store");
      expect(memory.VectorMemoryStore).toBeDefined();
    });

    it("imports security modules", () => {
      const guard = require("../../src/security/guard");
      expect(guard.SecurityGuard).toBeDefined();

      const sandbox = require("../../src/security/sandbox");
      expect(sandbox.SandboxExecutor).toBeDefined();

      const unrestricted = require("../../src/security/unrestricted");
      expect(unrestricted.getUnrestrictedPolicy).toBeDefined();
      expect(unrestricted.getLocalAdminPolicy).toBeDefined();
      expect(unrestricted.getSecurityPolicyForMode).toBeDefined();
      expect(unrestricted.UnrestrictedGuard).toBeDefined();
      expect(unrestricted.DirectExecutor).toBeDefined();
    });

    it("imports system tools", () => {
      const tools = require("../../src/tools/system-tools");
      expect(tools.SystemTools).toBeDefined();
    });

    it("imports logger", () => {
      const logger = require("../../src/utils/logger");
      expect(logger.Logger).toBeDefined();
    });

    it("imports config loader", () => {
      const config = require("../../src/cli/config");
      expect(config.loadConfig).toBeDefined();
    });
  });

  describe("End-to-End: Full System Bootstrap", () => {
    it("creates and connects all core components", async () => {
      const { Gateway } = require("../../src/core/gateway");
      const { SkillRegistry } = require("../../src/skills/registry");
      const { VectorMemoryStore } = require("../../src/memory/vector-store");
      const { loadConfig } = require("../../src/cli/config");
      const path = require("path");

      const config = loadConfig();
      const memoryStore = new VectorMemoryStore(config.memory);
      const skillRegistry = new SkillRegistry([
        path.resolve(__dirname, "../../skills"),
      ]);

      // Load skills
      await skillRegistry.loadAll();
      const skills = skillRegistry.getAllSkills();
      // Some skills are filtered out if their required binaries aren't installed
      expect(skills.length).toBeGreaterThanOrEqual(80);

      // Verify skill categories exist
      const names = skills.map((s: any) => s.name);
      // General skills
      expect(names).toContain("web-browse");
      expect(names).toContain("file-ops");
      expect(names).toContain("code-exec");
      // Kali skills (only check those without binary requirements)
      expect(names).toContain("password-attacks");
      expect(names).toContain("vulnerability-scanner");
      expect(names).toContain("reverse-shell");
      // Video/Audio skills
      expect(names).toContain("sora-video");
      expect(names).toContain("fish-speech");
      expect(names).toContain("musicgen-audio");
      // SE skills
      expect(names).toContain("auto-coder");
      expect(names).toContain("recursive-agent");

      // Initialize memory
      await memoryStore.initialize();
      const stats = memoryStore.getStats();
      expect(stats.totalEntries).toBe(0);

      // Create gateway
      const gateway = new Gateway(config, memoryStore);
      expect(gateway.getHealth().running).toBe(false);

      // Start gateway
      await gateway.start();
      expect(gateway.getHealth().running).toBe(true);

      // Shutdown
      await gateway.shutdown();
      await memoryStore.shutdown();
    });
  });

  describe("Skill Trigger Matching", () => {
    it("matches skills by keyword triggers", async () => {
      const { SkillRegistry } = require("../../src/skills/registry");
      const path = require("path");

      const registry = new SkillRegistry([path.resolve(__dirname, "../../skills")]);
      await registry.loadAll();

      // Test various trigger patterns
      // Test skills that don't require specific binaries
      const dbMatch = registry.matchTriggers("run a sql database query");
      expect(dbMatch).toContain("database");

      const emailMatch = registry.matchTriggers("send an email to the team");
      expect(emailMatch.length).toBeGreaterThan(0);

      const gitMatch = registry.matchTriggers("commit and push the code using git");
      expect(gitMatch).toContain("git-ops");

      const searchMatch = registry.matchTriggers("search the web for TypeScript docs");
      expect(searchMatch.length).toBeGreaterThan(0);

      const dockerMatch = registry.matchTriggers("start a docker container");
      expect(dockerMatch).toContain("docker-ops");
    });
  });

  describe("Cross-Component: Memory + Skills", () => {
    it("stores and retrieves with vector memory", async () => {
      const { VectorMemoryStore } = require("../../src/memory/vector-store");
      const os = require("os");
      const path = require("path");
      const fs = require("fs");

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "arivu-test-"));
      const store = new VectorMemoryStore(
        { type: "local", embeddingProvider: "anthropic", embeddingModel: "test", options: { dataDir: tmpDir } },
      );
      await store.initialize();

      // Store entries
      await store.store({
        id: "test-1",
        userId: "user1",
        content: "I am working on a Python Django project",
        type: "conversation",
        source: "cli",
        timestamp: new Date(),
      });

      await store.store({
        id: "test-2",
        userId: "user1",
        content: "The database uses PostgreSQL with PostGIS",
        type: "conversation",
        source: "cli",
        timestamp: new Date(),
      });

      // Search
      const results = await store.search("database", "user1");
      expect(results.length).toBeGreaterThan(0);

      // Facts
      const facts = await store.getFacts("user1");
      // May have auto-extracted facts
      expect(Array.isArray(facts)).toBe(true);

      // Stats
      const stats = store.getStats();
      expect(stats.totalEntries).toBeGreaterThanOrEqual(2);

      await store.shutdown();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });
  });
});
