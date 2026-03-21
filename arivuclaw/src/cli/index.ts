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
import { MiniMaxProvider } from "../plugins/providers/minimax.js";
import { DeepSeekProvider } from "../plugins/providers/deepseek.js";
import { GroqProvider } from "../plugins/providers/groq.js";
import { NeuralBrainProvider } from "../plugins/providers/neural-brain.js";
import { CLIChannel } from "../channels/cli.js";
import { WhatsAppChannel } from "../channels/whatsapp.js";
import { TelegramChannel } from "../channels/telegram.js";
import { DiscordChannel } from "../channels/discord.js";
import { SlackChannel } from "../channels/slack.js";
import { WebChannel } from "../channels/web.js";
import { SystemTools } from "../tools/system-tools.js";
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
  const sysInfo = SystemTools.getFullSystemInfo();

  console.log("\n🦀 ArivuClaw Status\n");
  console.log(`  Mode:       ${config.mode.toUpperCase()}`);
  console.log(`  Provider:   ${config.defaultProvider}`);
  console.log(`  Model:      ${config.defaultModel}`);
  console.log(`  Channels:   ${config.channels.filter((c) => c.enabled).map((c) => c.type).join(", ")}`);
  console.log(`  Skill dirs: ${config.skills.directories.join(", ")}`);
  console.log(`  Sandbox:    ${config.security.sandboxEnabled ? "ON" : "OFF"}`);
  console.log(`  Rate limit: ${config.security.rateLimits.length > 0 ? "ON" : "OFF (unrestricted)"}`);
  console.log("\n  System:");
  console.log(`    Host:     ${sysInfo.hostname}`);
  console.log(`    OS:       ${sysInfo.platform} ${sysInfo.arch}`);
  console.log(`    CPU:      ${sysInfo.cpus} cores — ${sysInfo.cpuModel}`);
  console.log(`    Memory:   ${sysInfo.freeMemory} free / ${sysInfo.totalMemory} total`);
  console.log(`    User:     ${sysInfo.user}`);
  console.log(`    Node:     ${sysInfo.node || "N/A"}`);
  console.log(`    Docker:   ${SystemTools.dockerAvailable() ? "available" : "not installed"}`);

  // List available providers
  console.log("\n  Available Providers:");
  const providers = [
    { name: "anthropic", env: "ANTHROPIC_API_KEY" },
    { name: "openai", env: "OPENAI_API_KEY" },
    { name: "minimax", env: "MINIMAX_API_KEY" },
    { name: "deepseek", env: "DEEPSEEK_API_KEY" },
    { name: "groq", env: "GROQ_API_KEY" },
    { name: "google", env: "GOOGLE_API_KEY" },
    { name: "ollama", env: null },
    { name: "neural-brain", env: null },
  ];
  for (const p of providers) {
    const active = p.name === config.defaultProvider ? " (active)" : "";
    const configured = p.env ? (process.env[p.env] ? "✓ configured" : "✗ no key") : "✓ local";
    console.log(`    ${p.name}: ${configured}${active}`);
  }
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
    case "minimax":
      return new MiniMaxProvider({
        apiKey: providerConfig?.apiKey || process.env.MINIMAX_API_KEY || "",
        groupId: (providerConfig?.options as Record<string, string>)?.groupId,
        baseUrl: providerConfig?.baseUrl,
      });
    case "deepseek":
      return new DeepSeekProvider({
        apiKey: providerConfig?.apiKey || process.env.DEEPSEEK_API_KEY || "",
        baseUrl: providerConfig?.baseUrl,
      });
    case "groq":
      return new GroqProvider({
        apiKey: providerConfig?.apiKey || process.env.GROQ_API_KEY || "",
        baseUrl: providerConfig?.baseUrl,
      });
    case "custom": {
      // Neural Brain mode
      const opts = (providerConfig?.options || {}) as Record<string, unknown>;
      const backboneProviderName = (opts.backboneProvider as string) || "anthropic";

      // Create the backbone provider
      const backboneConfig = config.providers[backboneProviderName];
      let backbone: LLMProvider;
      switch (backboneProviderName) {
        case "openai":
          backbone = new OpenAIProvider({ apiKey: backboneConfig?.apiKey || process.env.OPENAI_API_KEY || "" });
          break;
        case "ollama":
          backbone = new OllamaProvider({ baseUrl: backboneConfig?.baseUrl });
          break;
        default:
          backbone = new AnthropicProvider({ apiKey: backboneConfig?.apiKey || process.env.ANTHROPIC_API_KEY || "" });
      }

      return new NeuralBrainProvider(
        {
          apiKey: providerConfig?.apiKey,
          baseUrl: providerConfig?.baseUrl,
          neuralMode: (opts.neuralMode as "simulate" | "cortical-api" | "hybrid") || "hybrid",
          plasticityRate: (opts.plasticityRate as number) || 0.1,
          associativeMemorySize: (opts.associativeMemorySize as number) || 100,
          backboneProvider: backboneProviderName,
        },
        backbone,
      );
    }
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
