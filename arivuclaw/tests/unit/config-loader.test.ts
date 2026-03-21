/**
 * SCENARIO 7: Config loader — defaults, env overrides, mode selection
 */

import { loadConfig } from "../../src/cli/config";

describe("Scenario 7: Config Loader", () => {
  it("loads default config", () => {
    const config = loadConfig();
    expect(config).toBeDefined();
    expect(config.defaultProvider).toBeDefined();
    expect(config.defaultModel).toBeDefined();
    expect(config.channels).toBeDefined();
    expect(Array.isArray(config.channels)).toBe(true);
  });

  it("has unrestricted as default mode", () => {
    const config = loadConfig();
    expect(config.mode).toBe("unrestricted");
  });

  it("has all 8+ providers configured", () => {
    const config = loadConfig();
    const providerNames = Object.keys(config.providers);
    expect(providerNames.length).toBeGreaterThanOrEqual(8);
    expect(providerNames).toContain("anthropic");
    expect(providerNames).toContain("openai");
    expect(providerNames).toContain("ollama");
    expect(providerNames).toContain("minimax");
    expect(providerNames).toContain("deepseek");
    expect(providerNames).toContain("groq");
    expect(providerNames).toContain("neural-brain");
  });

  it("has security policy matching unrestricted mode", () => {
    const config = loadConfig();
    expect(config.security.sandboxEnabled).toBe(false);
    expect(config.security.blockedPaths).toEqual([]);
    expect(config.security.requireApprovalFor).toEqual([]);
  });

  it("has channels configured", () => {
    const config = loadConfig();
    expect(config.channels.length).toBeGreaterThan(0);
    const types = config.channels.map((c) => c.type);
    expect(types).toContain("cli");
  });

  it("has skill directories", () => {
    const config = loadConfig();
    expect(config.skills.directories.length).toBeGreaterThan(0);
  });

  it("has logging config", () => {
    const config = loadConfig();
    expect(["debug", "info", "warn", "error"]).toContain(config.logging.level);
  });
});
