/**
 * Arivumaiyam AI Onboarding Wizard — Full interactive setup.
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

interface OnboardAnswers {
  provider: string;
  apiKey: string;
  model: string;
  channels: string[];
  telegramToken: string;
  discordToken: string;
  webPort: string;
}

const PROVIDERS: { name: string; key: string; envVar: string; models: string[]; free: boolean }[] = [
  { name: "MiniMax", key: "minimax", envVar: "MINIMAX_API_KEY", models: ["MiniMax-Text-01", "abab6.5s-chat"], free: true },
  { name: "Anthropic (Claude)", key: "anthropic", envVar: "ANTHROPIC_API_KEY", models: ["claude-sonnet-4-6", "claude-opus-4-6", "claude-haiku-4-5-20251001"], free: false },
  { name: "OpenAI (GPT)", key: "openai", envVar: "OPENAI_API_KEY", models: ["gpt-4o", "gpt-4o-mini", "o3-mini"], free: false },
  { name: "DeepSeek", key: "deepseek", envVar: "DEEPSEEK_API_KEY", models: ["deepseek-chat", "deepseek-coder", "deepseek-reasoner"], free: true },
  { name: "Groq (Ultra-Fast)", key: "groq", envVar: "GROQ_API_KEY", models: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"], free: true },
  { name: "Google (Gemini)", key: "google", envVar: "GOOGLE_API_KEY", models: ["gemini-2.0-flash", "gemini-2.0-pro"], free: false },
  { name: "Ollama (Local/Free)", key: "ollama", envVar: "", models: ["llama3.1", "mistral", "phi3", "qwen2"], free: true },
];

export async function runOnboardWizard(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string): Promise<string> => new Promise((r) => rl.question(q, r));

  console.log(`
╔══════════════════════════════════════════════════════════╗
║          🦀 Arivumaiyam AI — Setup Wizard               ║
║     அறிவுமையம் — Center of Knowledge                     ║
║     Configure your AI assistant step by step             ║
╚══════════════════════════════════════════════════════════╝
`);

  try {
    // ─── Step 1: Provider ──────────────────────────────────────
    console.log("━━━ Step 1/4: Choose your AI Provider ━━━\n");
    PROVIDERS.forEach((p, i) => {
      const tag = p.free ? " [FREE]" : "";
      console.log(`  ${i + 1}. ${p.name}${tag}`);
    });
    const providerIdx = Number(await ask("\nYour choice [1]: ") || "1") - 1;
    const provider = PROVIDERS[Math.max(0, Math.min(providerIdx, PROVIDERS.length - 1))];

    // ─── Step 2: API Key ───────────────────────────────────────
    let apiKey = "";
    if (provider.key !== "ollama") {
      console.log(`\n━━━ Step 2/4: ${provider.name} API Key ━━━\n`);
      if (process.env[provider.envVar]) {
        console.log(`  Found in environment: ${provider.envVar}=***${process.env[provider.envVar]!.slice(-6)}`);
        const useEnv = await ask("  Use this key? [Y/n]: ");
        if (useEnv.toLowerCase() !== "n") {
          apiKey = process.env[provider.envVar]!;
        }
      }
      if (!apiKey) {
        apiKey = await ask(`  Enter your ${provider.name} API key: `);
      }
    } else {
      console.log("\n━━━ Step 2/4: Ollama (No key needed) ━━━\n");
      console.log("  Make sure Ollama is running: ollama serve");
      console.log("  Pull a model if you haven't: ollama pull llama3.1");
    }

    // Model selection
    console.log(`\n  Available models for ${provider.name}:`);
    provider.models.forEach((m, i) => console.log(`    ${i + 1}. ${m}`));
    const modelIdx = Number(await ask(`  Choose model [1]: `) || "1") - 1;
    const model = provider.models[Math.max(0, Math.min(modelIdx, provider.models.length - 1))];

    // ─── Step 3: Channels ──────────────────────────────────────
    console.log("\n━━━ Step 3/4: Messaging Channels ━━━\n");
    console.log("  Which channels do you want to enable?\n");
    console.log("  1. CLI only (default — just terminal chat)");
    console.log("  2. CLI + Telegram");
    console.log("  3. CLI + Discord");
    console.log("  4. CLI + Web UI (browser-based)");
    console.log("  5. CLI + Telegram + Discord");
    console.log("  6. All channels (CLI + Web + Telegram + Discord + Slack + WhatsApp)");
    const chChoice = await ask("\nYour choice [1]: ") || "1";

    const channelMap: Record<string, string[]> = {
      "1": ["cli"],
      "2": ["cli", "telegram"],
      "3": ["cli", "discord"],
      "4": ["cli", "web"],
      "5": ["cli", "telegram", "discord"],
      "6": ["cli", "web", "telegram", "discord", "slack", "whatsapp"],
    };
    const channels = channelMap[chChoice] || ["cli"];

    // Channel-specific credentials
    let telegramToken = "";
    let discordToken = "";
    let webPort = "3000";

    if (channels.includes("telegram")) {
      console.log("\n  📱 Telegram Setup:");
      console.log("  1. Open Telegram → Search @BotFather");
      console.log("  2. Send /newbot → Follow instructions");
      console.log("  3. Copy the bot token\n");
      telegramToken = process.env.TELEGRAM_BOT_TOKEN || await ask("  Telegram Bot Token: ");
    }

    if (channels.includes("discord")) {
      console.log("\n  🎮 Discord Setup:");
      console.log("  1. Go to discord.com/developers/applications");
      console.log("  2. Create New Application → Bot → Copy Token\n");
      discordToken = process.env.DISCORD_BOT_TOKEN || await ask("  Discord Bot Token: ");
    }

    if (channels.includes("web")) {
      webPort = await ask("\n  Web UI port [3000]: ") || "3000";
    }

    // ─── Step 4: Confirm ───────────────────────────────────────
    console.log("\n━━━ Step 4/4: Confirm Configuration ━━━\n");
    console.log(`  Provider:  ${provider.name}`);
    console.log(`  Model:     ${model}`);
    console.log(`  Channels:  ${channels.join(", ")}`);
    console.log(`  Mode:      unrestricted`);
    if (telegramToken) console.log(`  Telegram:  ***${telegramToken.slice(-6)}`);
    if (discordToken) console.log(`  Discord:   ***${discordToken.slice(-6)}`);

    const confirm = await ask("\n  Save this configuration? [Y/n]: ");
    if (confirm.toLowerCase() === "n") {
      console.log("\n  ❌ Setup cancelled.\n");
      return;
    }

    // ─── Save Config ───────────────────────────────────────────
    const config = {
      mode: "unrestricted",
      defaultProvider: provider.key,
      defaultModel: model,
      providers: {
        [provider.key]: {
          apiKey: apiKey || undefined,
          defaultModel: model,
          ...(provider.key === "ollama" ? { baseUrl: "http://localhost:11434" } : {}),
        },
      },
      channels: channels.map((ch) => ({
        type: ch,
        enabled: true,
        credentials: {
          ...(ch === "telegram" && telegramToken ? { botToken: telegramToken } : {}),
          ...(ch === "discord" && discordToken ? { botToken: discordToken } : {}),
          ...(ch === "web" ? { port: webPort } : {}),
        },
      })),
      security: {
        sandboxEnabled: false,
        maxTokensPerTurn: 8192,
        maxToolCallsPerTurn: 100,
        allowedDomains: [],
        blockedDomains: [],
        allowedPaths: [],
        blockedPaths: [],
        requireApprovalFor: [],
        rateLimits: [],
      },
      skills: { directories: ["./skills"], autoload: true, hotReload: true },
      logging: { level: "info" },
    };

    const configDir = path.resolve(".arivumaiyam");
    fs.mkdirSync(configDir, { recursive: true });
    const configPath = path.join(configDir, "config.json");
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Also save as .env for convenience
    const envLines = [];
    envLines.push(`ARIVUCLAW_PROVIDER=${provider.key}`);
    envLines.push(`ARIVUCLAW_MODEL=${model}`);
    if (apiKey) envLines.push(`${provider.envVar}=${apiKey}`);
    if (telegramToken) envLines.push(`TELEGRAM_BOT_TOKEN=${telegramToken}`);
    if (discordToken) envLines.push(`DISCORD_BOT_TOKEN=${discordToken}`);
    fs.writeFileSync(".env", envLines.join("\n") + "\n");

    console.log(`
╔══════════════════════════════════════════════════════════╗
║  ✅ Configuration saved!                                 ║
║                                                          ║
║  Config: ${configPath.padEnd(46)}║
║  Env:    .env                                            ║
║                                                          ║
║  🚀 Start Arivumaiyam AI:                               ║
║     npx ts-node src/cli/index.ts chat    (CLI only)      ║
║     npx ts-node src/cli/index.ts start   (all channels)  ║
╚══════════════════════════════════════════════════════════╝
`);
  } finally {
    rl.close();
  }
}

// ─── Config Command — View/Edit current config ─────────────────

export async function runConfigCommand(args: string[]): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string): Promise<string> => new Promise((r) => rl.question(q, r));

  const configPaths = [
    path.resolve(".arivumaiyam/config.json"),
    path.resolve("arivumaiyam.config.json"),
  ];

  let configPath = configPaths.find((p) => fs.existsSync(p));
  let config: Record<string, unknown> = {};

  if (configPath) {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }

  const subcommand = args[0] || "show";

  try {
    switch (subcommand) {
      case "show":
        console.log("\n🦀 Arivumaiyam AI — Current Configuration\n");
        if (!configPath) {
          console.log("  No config file found. Run: npx ts-node src/cli/index.ts onboard\n");
          return;
        }
        console.log(`  File:     ${configPath}`);
        console.log(`  Provider: ${config.defaultProvider || "not set"}`);
        console.log(`  Model:    ${config.defaultModel || "not set"}`);
        console.log(`  Mode:     ${config.mode || "unrestricted"}`);
        if (config.channels) {
          const chs = (config.channels as { type: string; enabled: boolean }[])
            .filter((c) => c.enabled)
            .map((c) => c.type);
          console.log(`  Channels: ${chs.join(", ")}`);
        }
        console.log(`\n  Full config:\n${JSON.stringify(config, null, 2)}\n`);
        break;

      case "set": {
        const key = args[1];
        const value = args[2];
        if (!key || !value) {
          console.log("  Usage: config set <key> <value>");
          console.log("  Examples:");
          console.log("    config set provider minimax");
          console.log("    config set model MiniMax-Text-01");
          console.log("    config set mode unrestricted");
          return;
        }
        if (!configPath) {
          configPath = path.resolve(".arivumaiyam/config.json");
          fs.mkdirSync(path.dirname(configPath), { recursive: true });
        }
        if (key === "provider") config.defaultProvider = value;
        else if (key === "model") config.defaultModel = value;
        else if (key === "mode") config.mode = value;
        else (config as Record<string, string>)[key] = value;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(`  ✅ Set ${key} = ${value}`);
        break;
      }

      case "add-channel": {
        const chType = args[1];
        if (!chType) {
          console.log("  Usage: config add-channel <type> [token]");
          console.log("  Types: telegram, discord, slack, whatsapp, web");
          return;
        }
        if (!configPath) {
          configPath = path.resolve(".arivumaiyam/config.json");
          fs.mkdirSync(path.dirname(configPath), { recursive: true });
        }
        const channels = (config.channels as unknown[]) || [];
        const token = args[2] || "";
        channels.push({
          type: chType,
          enabled: true,
          credentials: token ? { botToken: token } : {},
        });
        config.channels = channels;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(`  ✅ Added channel: ${chType}`);
        break;
      }

      case "edit":
        if (configPath) {
          console.log(`  Opening ${configPath} ...`);
          const { execSync } = require("child_process");
          const editor = process.env.EDITOR || (process.platform === "win32" ? "notepad" : "nano");
          try {
            execSync(`${editor} "${configPath}"`, { stdio: "inherit" });
          } catch {
            console.log(`  Could not open editor. Edit manually: ${configPath}`);
          }
        } else {
          console.log("  No config found. Run: npx ts-node src/cli/index.ts onboard");
        }
        break;

      case "reset":
        if (configPath && fs.existsSync(configPath)) {
          fs.unlinkSync(configPath);
          console.log("  ✅ Config reset. Run onboard again.");
        }
        break;

      default:
        console.log(`
  Usage: config <command>

  Commands:
    show                      Show current configuration
    set <key> <value>         Set a config value
    add-channel <type> [tok]  Add a messaging channel
    edit                      Open config in editor
    reset                     Delete config and start fresh
`);
    }
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  runOnboardWizard().catch(console.error);
}
