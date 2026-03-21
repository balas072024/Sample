/**
 * Arivumaiyam AI Onboarding Wizard — Interactive first-time setup.
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { Logger } from "../utils/logger.js";

const log = Logger.create("onboard");

interface OnboardAnswers {
  provider: string;
  apiKey: string;
  channels: string[];
  sandboxEnabled: boolean;
}

export async function runOnboardWizard(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (question: string): Promise<string> =>
    new Promise((resolve) => rl.question(question, resolve));

  console.log(`
╔═══════════════════════════════════════════════════════╗
║           🦀 Arivumaiyam AI Setup Wizard                  ║
║   Let's configure your intelligent AI assistant!     ║
╚═══════════════════════════════════════════════════════╝
`);

  try {
    // Step 1: Choose provider
    console.log("Step 1: Choose your AI provider\n");
    console.log("  1. Anthropic (Claude) — recommended");
    console.log("  2. OpenAI (GPT)");
    console.log("  3. Ollama (Local models)");
    console.log("  4. Google (Gemini)");
    const providerChoice = await ask("\nYour choice [1]: ");
    const providers = ["anthropic", "openai", "ollama", "google"];
    const provider = providers[Number(providerChoice || "1") - 1] || "anthropic";

    // Step 2: API key
    let apiKey = "";
    if (provider !== "ollama") {
      console.log(`\nStep 2: Enter your ${provider} API key`);
      apiKey = await ask("API key: ");
    }

    // Step 3: Channels
    console.log("\nStep 3: Which channels do you want to enable?");
    console.log("  1. CLI only (default)");
    console.log("  2. CLI + Web UI");
    console.log("  3. CLI + WhatsApp");
    console.log("  4. CLI + Telegram");
    console.log("  5. All channels");
    const channelChoice = await ask("\nYour choice [1]: ");

    const channelMap: Record<string, string[]> = {
      "1": ["cli"],
      "2": ["cli", "web"],
      "3": ["cli", "whatsapp"],
      "4": ["cli", "telegram"],
      "5": ["cli", "web", "whatsapp", "telegram", "discord", "slack"],
    };
    const channels = channelMap[channelChoice || "1"] || ["cli"];

    // Step 4: Security
    console.log("\nStep 4: Enable sandbox mode? (recommended)");
    const sandboxChoice = await ask("Enable sandbox [Y/n]: ");
    const sandboxEnabled = sandboxChoice.toLowerCase() !== "n";

    // Generate config
    const config = generateConfig({
      provider,
      apiKey,
      channels,
      sandboxEnabled,
    });

    // Save config
    const configDir = path.resolve(".arivuclaw");
    fs.mkdirSync(configDir, { recursive: true });

    const configPath = path.join(configDir, "config.json");
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log(`\n✅ Configuration saved to ${configPath}`);
    console.log("\n🚀 Start Arivumaiyam AI with:");
    console.log("   arivuclaw        — Start all channels");
    console.log("   arivuclaw chat   — CLI chat mode\n");
  } finally {
    rl.close();
  }
}

function generateConfig(answers: OnboardAnswers): Record<string, unknown> {
  const envKey = `\${${answers.provider.toUpperCase()}_API_KEY}`;

  return {
    defaultProvider: answers.provider,
    defaultModel: getDefaultModel(answers.provider),
    providers: {
      [answers.provider]: {
        apiKey: answers.apiKey || envKey,
        defaultModel: getDefaultModel(answers.provider),
      },
    },
    channels: answers.channels.map((ch) => ({
      type: ch,
      enabled: true,
      credentials: {},
    })),
    security: {
      sandboxEnabled: answers.sandboxEnabled,
      maxTokensPerTurn: 8192,
      maxToolCallsPerTurn: 20,
      rateLimits: [
        { scope: "user", maxRequests: 30, windowMs: 60000 },
      ],
    },
    skills: {
      directories: ["./skills"],
      autoload: true,
      hotReload: true,
    },
    logging: {
      level: "info",
    },
  };
}

function getDefaultModel(provider: string): string {
  switch (provider) {
    case "anthropic":
      return "claude-sonnet-4-6";
    case "openai":
      return "gpt-4o";
    case "ollama":
      return "llama3.1";
    case "google":
      return "gemini-2.0-flash";
    default:
      return "";
  }
}

// Run if called directly
if (require.main === module) {
  runOnboardWizard().catch(console.error);
}
