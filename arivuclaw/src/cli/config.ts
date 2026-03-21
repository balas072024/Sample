/**
 * ArivuClaw Configuration Loader
 */

import * as fs from "fs";
import * as path from "path";
import type { ArivuClawConfig } from "../core/types.js";

const DEFAULT_CONFIG: ArivuClawConfig = {
  gateway: {
    host: "0.0.0.0",
    port: 3000,
    corsOrigins: ["http://localhost:3000"],
  },
  providers: {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || "",
      defaultModel: "claude-sonnet-4-6",
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || "",
      defaultModel: "gpt-4o",
    },
    google: {
      apiKey: process.env.GOOGLE_API_KEY || "",
      defaultModel: "gemini-2.0-flash",
    },
    ollama: {
      baseUrl: "http://localhost:11434",
      defaultModel: "llama3.1",
    },
    custom: {
      defaultModel: "",
    },
  },
  defaultProvider: "anthropic",
  defaultModel: "claude-sonnet-4-6",
  channels: [
    {
      type: "cli",
      enabled: true,
      credentials: {},
    },
    {
      type: "web",
      enabled: false,
      credentials: { port: "3000" },
    },
    {
      type: "whatsapp",
      enabled: false,
      credentials: {},
    },
    {
      type: "telegram",
      enabled: false,
      credentials: { botToken: process.env.TELEGRAM_BOT_TOKEN || "" },
    },
    {
      type: "discord",
      enabled: false,
      credentials: { botToken: process.env.DISCORD_BOT_TOKEN || "" },
    },
    {
      type: "slack",
      enabled: false,
      credentials: {
        botToken: process.env.SLACK_BOT_TOKEN || "",
        appToken: process.env.SLACK_APP_TOKEN || "",
        signingSecret: process.env.SLACK_SIGNING_SECRET || "",
      },
    },
  ],
  memory: {
    type: "hnswlib",
    embeddingProvider: "anthropic",
    embeddingModel: "voyage-3",
    options: {
      dataDir: ".arivuclaw/memory",
    },
  },
  security: {
    maxTokensPerTurn: 8192,
    maxToolCallsPerTurn: 20,
    allowedDomains: [],
    blockedDomains: [],
    allowedPaths: [],
    blockedPaths: ["/etc", "/root", "/var/log"],
    sandboxEnabled: true,
    requireApprovalFor: ["system.process", "system.env", "filesystem.write"],
    rateLimits: [
      { scope: "user", maxRequests: 30, windowMs: 60_000 },
      { scope: "global", maxRequests: 100, windowMs: 60_000 },
    ],
  },
  skills: {
    directories: [
      "./skills",
      path.join(process.env.HOME || "~", ".arivuclaw", "skills"),
    ],
    autoload: true,
    hotReload: true,
  },
  logging: {
    level: "info",
  },
};

export function loadConfig(): ArivuClawConfig {
  // Try loading from multiple locations (precedence: local > user > default)
  const configPaths = [
    path.resolve("arivuclaw.config.json"),
    path.resolve(".arivuclaw/config.json"),
    path.join(process.env.HOME || "~", ".arivuclaw", "config.json"),
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const raw = fs.readFileSync(configPath, "utf-8");
        const userConfig = JSON.parse(raw) as Partial<ArivuClawConfig>;
        return deepMerge(DEFAULT_CONFIG, userConfig) as ArivuClawConfig;
      } catch (error) {
        console.warn(`Failed to load config from ${configPath}: ${error}`);
      }
    }
  }

  // Load from environment variables
  return applyEnvOverrides(DEFAULT_CONFIG);
}

function applyEnvOverrides(config: ArivuClawConfig): ArivuClawConfig {
  if (process.env.ARIVUCLAW_PROVIDER) {
    config.defaultProvider = process.env.ARIVUCLAW_PROVIDER as ArivuClawConfig["defaultProvider"];
  }
  if (process.env.ARIVUCLAW_MODEL) {
    config.defaultModel = process.env.ARIVUCLAW_MODEL;
  }
  if (process.env.ARIVUCLAW_LOG_LEVEL) {
    config.logging.level = process.env.ARIVUCLAW_LOG_LEVEL as ArivuClawConfig["logging"]["level"];
  }
  if (process.env.ARIVUCLAW_SANDBOX === "false") {
    config.security.sandboxEnabled = false;
  }
  return config;
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object"
    ) {
      result[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>,
      );
    } else {
      result[key] = source[key];
    }
  }

  return result;
}
