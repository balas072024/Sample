/**
 * Arivumaiyam AI Configuration Loader
 */

import * as fs from "fs";
import * as path from "path";
import type { ArivumaiyamConfig } from "../core/types.js";
import { getSecurityPolicyForMode } from "../security/unrestricted.js";

const DEFAULT_CONFIG: ArivumaiyamConfig = {
  mode: "unrestricted",  // Default to unrestricted for local laptop use
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
    minimax: {
      apiKey: process.env.MINIMAX_API_KEY || "",
      defaultModel: "MiniMax-Text-01",
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || "",
      defaultModel: "deepseek-chat",
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY || "",
      defaultModel: "llama-3.3-70b-versatile",
    },
    "neural-brain": {
      defaultModel: "neural-brain-hybrid",
      options: {
        neuralMode: "hybrid",
        plasticityRate: 0.1,
        associativeMemorySize: 100,
        backboneProvider: "anthropic",
      },
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
    maxTokensPerTurn: 100_000,
    maxToolCallsPerTurn: 200,
    allowedDomains: [],
    blockedDomains: [],
    allowedPaths: [],
    blockedPaths: [],
    sandboxEnabled: false,
    requireApprovalFor: [],
    rateLimits: [],
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

export function loadConfig(): ArivumaiyamConfig {
  // Try loading from multiple locations (precedence: local > user > default)
  const configPaths = [
    path.resolve("arivuclaw.config.json"),
    path.resolve(".arivuclaw/config.json"),
    path.join(process.env.HOME || "~", ".arivuclaw", "config.json"),
  ];

  let config = DEFAULT_CONFIG;

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const raw = fs.readFileSync(configPath, "utf-8");
        const userConfig = JSON.parse(raw) as Partial<ArivumaiyamConfig>;
        config = deepMerge(DEFAULT_CONFIG as unknown as Record<string, unknown>, userConfig as unknown as Record<string, unknown>) as unknown as ArivumaiyamConfig;
        break;
      } catch (error) {
        console.warn(`Failed to load config from ${configPath}: ${error}`);
      }
    }
  }

  // Apply environment overrides
  config = applyEnvOverrides(config);

  // Apply mode-based security policy
  config.security = getSecurityPolicyForMode(config.mode, config.security);

  return config;
}

function applyEnvOverrides(config: ArivumaiyamConfig): ArivumaiyamConfig {
  if (process.env.ARIVUCLAW_MODE) {
    config.mode = process.env.ARIVUCLAW_MODE as ArivumaiyamConfig["mode"];
  }
  if (process.env.ARIVUCLAW_PROVIDER) {
    config.defaultProvider = process.env.ARIVUCLAW_PROVIDER as ArivumaiyamConfig["defaultProvider"];
  }
  if (process.env.ARIVUCLAW_MODEL) {
    config.defaultModel = process.env.ARIVUCLAW_MODEL;
  }
  if (process.env.ARIVUCLAW_LOG_LEVEL) {
    config.logging.level = process.env.ARIVUCLAW_LOG_LEVEL as ArivumaiyamConfig["logging"]["level"];
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
