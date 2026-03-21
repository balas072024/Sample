#!/usr/bin/env node

/**
 * ArivuClaw CLI — Main entry point.
 *
 * Usage:
 *   arivuclaw                  — Start ArivuClaw with all configured channels
 *   arivuclaw chat             — Start CLI chat mode
 *   arivuclaw onboard          — Interactive setup wizard
 *   arivuclaw skills list      — List available skills
 *   arivuclaw skills install   — Install a skill from ClawHub
 *   arivuclaw status           — Show system status
 *   arivuclaw config           — Edit configuration
 */

import { Gateway } from "../core/gateway.js";
import { AgentRuntime } from "../core/agent-runtime.js";
import { SkillRegistry } from "../skills/registry.js";
import { VectorMemoryStore } from "../memory/vector-store.js";
import { AnthropicProvider } from "../plugins/providers/anthropic.js";
import { OpenAIProvider } from "../plugins/providers/openai.js";
import { OllamaProvider } from "../plugins/providers/ollama.js";
import { CLIChannel } from "../channels/cli.js";
import { WhatsAppChannel } from "../channels/whatsapp.js";
import { TelegramChannel } from "../channels/telegram.js";
import { DiscordChannel } from "../channels/discord.js";
import { SlackChannel } from "../channels/slack.js";
import { WebChannel } from "../channels/web.js";
import { loadConfig } from "./config.js";
import { Logger } from "../utils/logger.js";
import type { ArivuClawConfig, LLMProvider } from "../core/types.js";

const log = Logger.create("cli");

const BANNER = `
   _         _             ____  _
  / \\   _ __(_)_   ___   _/ ___|| | __ ___      __
 / _ \\ | '__| \\ \\ / / | | \\___ \\| |/ _\` \\ \\ /\\ / /
/ ___ \\| |  | |\\ V /| |_| |___) | | (_| |\\ V  V /
/_/   \\_\\_|  |_| \\_/  \\__,_|____/|_|\\__,_| \\_/\\_/

  🦀 ArivuClaw v1.0.0 — Your Intelligent AI Assistant
  Secure. Composable. Multi-platform.
`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || "start";

  switch (command) {
    case "start":
      await startGateway();
      break;
    case "chat":
      await startChat();
      break;
    case "onboard":
      await runOnboard();
      break;
    case "skills":
      await handleSkills(args.slice(1));
      break;
    case "status":
      showStatus();
      break;
    case "version":
      console.log("ArivuClaw v1.0.0");
      break;
    case "help":
      showHelp();
      break;
    default:
      console.log(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

async function startGateway(): Promise<void> {
  console.log(BANNER);

  const config = loadConfig();
  Logger.setLevel(config.logging.level);

  // Initialize memory store
  const memoryStore = new VectorMemoryStore(config.memory);

  // Initialize LLM provider
  const provider = createProvider(config);

  // Initialize skill registry
  const skillRegistry = new SkillRegistry(config.skills.directories);
  await skillRegistry.loadAll();

  if (config.skills.hotReload) {
    skillRegistry.enableHotReload();
  }

  // Create gateway
  const gateway = new Gateway(config, memoryStore);

  // Create agent runtime
  const runtime = new AgentRuntime(config, provider, memoryStore, skillRegistry);
  gateway.setAgentRuntime(runtime);

  // Register configured channels
  for (const channelConfig of config.channels) {
    if (!channelConfig.enabled) continue;

    const adapter = createChannelAdapter(channelConfig.type);
    if (adapter) {
      await gateway.registerChannel(adapter);
    }
  }

  // Start gateway
  await gateway.start();

  // Graceful shutdown
  const shutdown = async () => {
    log.info("Shutting down...");
    await gateway.shutdown();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function startChat(): Promise<void> {
  console.log(BANNER);

  const config = loadConfig();
  Logger.setLevel("warn"); // Quiet mode for chat

  const memoryStore = new VectorMemoryStore(config.memory);
  const provider = createProvider(config);
  const skillRegistry = new SkillRegistry(config.skills.directories);
  await skillRegistry.loadAll();

  const gateway = new Gateway(config, memoryStore);
  const runtime = new AgentRuntime(config, provider, memoryStore, skillRegistry);
  gateway.setAgentRuntime(runtime);

  // Only CLI channel for chat mode
  const cliChannel = new CLIChannel();
  await gateway.registerChannel(cliChannel);
  await gateway.start();
}

async function runOnboard(): Promise<void> {
  console.log(BANNER);
  console.log("Welcome to ArivuClaw setup! Let's get you configured.\n");

  // In production, this would be an interactive wizard using inquirer
  console.log("Steps:");
  console.log("  1. Choose your AI provider (Anthropic/OpenAI/Ollama)");
  console.log("  2. Enter your API key");
  console.log("  3. Select messaging channels to connect");
  console.log("  4. Configure security settings");
  console.log("  5. Install starter skills");
  console.log("\nRun: arivuclaw onboard --interactive");
}

async function handleSkills(args: string[]): Promise<void> {
  const subcommand = args[0] || "list";
  const config = loadConfig();
  const registry = new SkillRegistry(config.skills.directories);
  await registry.loadAll();

  switch (subcommand) {
    case "list": {
      const skills = registry.getAllSkills();
      console.log(`\nInstalled Skills (${skills.length}):\n`);
      for (const skill of skills) {
        const status = skill.loaded ? "✓" : "✗";
        console.log(`  ${status} ${skill.name} v${skill.manifest.version}`);
        console.log(`    ${skill.manifest.description}`);
        console.log(`    Tools: ${skill.manifest.tools.map((t) => t.name).join(", ") || "none"}`);
        console.log();
      }
      break;
    }
    case "install":
      console.log("Skill installation from registry — coming soon!");
      break;
    default:
      console.log(`Unknown skills command: ${subcommand}`);
  }
}

function showStatus(): void {
  const config = loadConfig();
  console.log("\nArivuClaw Status:");
  console.log(`  Provider: ${config.defaultProvider}`);
  console.log(`  Model: ${config.defaultModel}`);
  console.log(`  Channels: ${config.channels.filter((c) => c.enabled).map((c) => c.type).join(", ")}`);
  console.log(`  Skill dirs: ${config.skills.directories.join(", ")}`);
  console.log(`  Security: sandbox=${config.security.sandboxEnabled}`);
}

function showHelp(): void {
  console.log(`
ArivuClaw — Your Intelligent AI Assistant 🦀

Usage: arivuclaw [command]

Commands:
  start       Start ArivuClaw with all configured channels (default)
  chat        Start CLI chat mode
  onboard     Interactive setup wizard
  skills      Manage skills (list, install)
  status      Show system status
  config      Edit configuration
  version     Show version
  help        Show this help

Examples:
  arivuclaw                    Start with all channels
  arivuclaw chat               CLI-only chat mode
  arivuclaw skills list        List installed skills
  arivuclaw onboard            First-time setup
`);
}

function createProvider(config: ArivuClawConfig): LLMProvider {
  const providerConfig = config.providers[config.defaultProvider];

  switch (config.defaultProvider) {
    case "anthropic":
      return new AnthropicProvider({
        apiKey: providerConfig?.apiKey || process.env.ANTHROPIC_API_KEY || "",
        baseUrl: providerConfig?.baseUrl,
      });
    case "openai":
      return new OpenAIProvider({
        apiKey: providerConfig?.apiKey || process.env.OPENAI_API_KEY || "",
        baseUrl: providerConfig?.baseUrl,
      });
    case "ollama":
      return new OllamaProvider({
        baseUrl: providerConfig?.baseUrl,
      });
    default:
      return new AnthropicProvider({
        apiKey: process.env.ANTHROPIC_API_KEY || "",
      });
  }
}

function createChannelAdapter(type: string) {
  switch (type) {
    case "cli":
      return new CLIChannel();
    case "whatsapp":
      return new WhatsAppChannel();
    case "telegram":
      return new TelegramChannel();
    case "discord":
      return new DiscordChannel();
    case "slack":
      return new SlackChannel();
    case "web":
      return new WebChannel();
    default:
      log.warn(`Unknown channel type: ${type}`);
      return null;
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
