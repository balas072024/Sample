#!/usr/bin/env node

/**
 * Arivumaiyam AI CLI — Main entry point.
 *
 * Usage:
 *   arivuclaw                  — Start Arivumaiyam AI with all configured channels
 *   arivuclaw chat             — Start CLI chat mode
 *   arivuclaw onboard          — Interactive setup wizard
 *   arivuclaw skills list      — List available skills
 *   arivuclaw skills install   — Install a skill from ClawHub
 *   arivuclaw status           — Show system status
 *   arivuclaw config           — Edit configuration
 */

import { Gateway } from "../core/gateway";
import { AgentRuntime } from "../core/agent-runtime";
import { SkillRegistry } from "../skills/registry";
import { VectorMemoryStore } from "../memory/vector-store";
import { AnthropicProvider } from "../plugins/providers/anthropic";
import { OpenAIProvider } from "../plugins/providers/openai";
import { OllamaProvider } from "../plugins/providers/ollama";
import { MiniMaxProvider } from "../plugins/providers/minimax";
import { DeepSeekProvider } from "../plugins/providers/deepseek";
import { GroqProvider } from "../plugins/providers/groq";
import { NeuralBrainProvider } from "../plugins/providers/neural-brain";
import { CLIChannel } from "../channels/cli";
import { WhatsAppChannel } from "../channels/whatsapp";
import { TelegramChannel } from "../channels/telegram";
import { DiscordChannel } from "../channels/discord";
import { SlackChannel } from "../channels/slack";
import { WebChannel } from "../channels/web";
import { SystemTools } from "../tools/system-tools";
import { loadConfig } from "./config";
import { Logger } from "../utils/logger";
import type { ArivumaiyamConfig, LLMProvider } from "../core/types";

const log = Logger.create("cli");

const BANNER = `
   _         _             ____  _
  / \\   _ __(_)_   ___   _/ ___|| | __ ___      __
 / _ \\ | '__| \\ \\ / / | | \\___ \\| |/ _\` \\ \\ /\\ / /
/ ___ \\| |  | |\\ V /| |_| |___) | | (_| |\\ V  V /
/_/   \\_\\_|  |_| \\_/  \\__,_|____/|_|\\__,_| \\_/\\_/

  🦀 Arivumaiyam AI v1.0.0 — Your Intelligent AI Assistant
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
    case "setup":
    case "init": {
      const { runOnboardWizard } = require("./onboard");
      await runOnboardWizard();
      break;
    }
    case "config": {
      const { runConfigCommand } = require("./onboard");
      await runConfigCommand(args.slice(1));
      break;
    }
    case "skills":
      await handleSkills(args.slice(1));
      break;
    case "status":
      showStatus();
      break;
    case "version":
      console.log("Arivumaiyam AI v1.0.0");
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

  // Load .env file if present
  try { require("dotenv").config(); } catch { /* dotenv optional */ }

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

  // Start Web UI Dashboard on a separate port from the Web channel
  const dashPort = Number(config.gateway.dashboardPort) || 7890;
  try {
    const http = require("http");
    const { generateDashboardHTML } = require("../ui/dashboard");

    const dashServer = http.createServer((req: any, res: any) => {
      const url = req.url || "/";

      if (url === "/" || url === "/dashboard") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(generateDashboardHTML());
        return;
      }

      if (url === "/api/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(gateway.getHealth()));
        return;
      }

      if (url === "/api/skills") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(skillRegistry.getAllSkills().map((s: any) => ({
          name: s.name || s.manifest?.name || "unknown",
          version: s.manifest?.version || "1.0.0",
          description: s.manifest?.description || "",
          tools: s.manifest?.tools?.length || 0,
          loaded: s.loaded,
        }))));
        return;
      }

      if (url === "/api/channels") {
        res.writeHead(200, { "Content-Type": "application/json" });
        const health = gateway.getHealth();
        res.end(JSON.stringify(health.channels));
        return;
      }

      if (url === "/api/sessions") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify([]));
        return;
      }

      if (url === "/api/memory/stats") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          totalEntries: memoryStore.size?.() ?? 0,
          totalFacts: 0,
          vectorDimensions: 0,
          storageSizeBytes: 0,
        }));
        return;
      }

      if (url === "/api/providers") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify([{
          type: config.defaultProvider,
          name: config.defaultProvider,
          model: config.defaultModel,
        }]));
        return;
      }

      if (url === "/api/config") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ provider: config.defaultProvider, model: config.defaultModel, mode: config.mode }));
        return;
      }

      if (url === "/api/restart" && req.method === "POST") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "restarting" }));
        gateway.restart().catch((err: any) => log.error(`Restart failed: ${err}`));
        return;
      }

      res.writeHead(404);
      res.end("Not found");
    });

    dashServer.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        log.warn(`Dashboard port ${dashPort} already in use — trying ${dashPort + 1}`);
        dashServer.listen(dashPort + 1, () => {
          console.log(`\n  🌐 Dashboard: http://localhost:${dashPort + 1}`);
          console.log(`  📡 API:       http://localhost:${dashPort + 1}/api/health\n`);
        });
      } else {
        log.warn(`Dashboard failed to start: ${err.message}`);
      }
    });

    dashServer.listen(dashPort, () => {
      console.log(`\n  🌐 Dashboard: http://localhost:${dashPort}`);
      console.log(`  📡 API:       http://localhost:${dashPort}/api/health\n`);
    });
  } catch (err) {
    log.warn(`Dashboard failed to start: ${err}`);
  }

  // Wire up additional modules
  try {
    // MCP Server — expose skills as MCP tools
    const { MCPServer, MCPBridge } = require("../mcp/server");
    const mcpServer = new MCPServer("arivumaiyam", "1.0.0");
    const mcpBridge = new MCPBridge(mcpServer);
    log.info(`MCP Server ready (${mcpServer.getTools().length} tools exposed)`);

    // Telemetry & Health
    const { HealthDashboard } = require("../observability/health-dashboard");
    const healthDash = new HealthDashboard();
    log.info("Health dashboard initialized");

    // i18n
    const { I18n } = require("../i18n/locales");
    const i18n = new I18n();
    log.info(`i18n initialized (${i18n.getSupportedLocales().length} locales)`);

    // Guardrails (auto-approve all in unrestricted)
    const { GuardrailManager } = require("../core/guardrails");
    const guardrails = new GuardrailManager(config.mode === "unrestricted");
    log.info(`Guardrails: auto-approve=${guardrails.isAutoApproveAll()}`);

    // Backup Manager
    const { BackupManager } = require("../backup/manager");
    const backupMgr = new BackupManager();
    log.info("Backup manager ready");

    // Model Tiering
    const { ModelTierManager } = require("../core/model-tiering");
    const tierMgr = new ModelTierManager();
    log.info("Model tiering initialized");

    console.log("  ✅ All modules wired and ready\n");
  } catch (err) {
    log.warn(`Some optional modules failed to load: ${err}`);
  }

  // Cloudflare reverse proxy on port 5013
  // Routes subdomains to internal services
  try {
    const http = require("http");
    const PROXY_PORT = 5013;
    const ROUTES: Record<string, number> = {
      // Arivumaiyam AI services
      "chat.arivumaiyam.com": 3000,           // Web chat channel
      "dash.arivumaiyam.com": dashPort,       // Dashboard
      "api.arivumaiyam.com": dashPort,        // API endpoints
      "arivumaiyam.com": dashPort,            // Main site → dashboard
      // Other published applications (update ports as needed)
      "family.arivumaiyam.com": 5100,         // Family app
      "neuralbrain.arivumaiyam.com": 5200,    // Neural Brain
      "kaasai.arivumaiyam.com": 5300,         // KaasAI
      "valluvan.arivumaiyam.com": 5400,       // Valluvan
      "opsshiftpro.arivumaiyam.com": 5500,    // OpsShiftPro
      "opswatch.arivumaiyam.com": 5600,       // OpsWatch
    };
    // Default fallback for unknown subdomains → web chat
    const DEFAULT_TARGET = 3000;

    const proxy = http.createServer((req: any, res: any) => {
      const host = (req.headers.host || "").split(":")[0].toLowerCase();
      const targetPort = ROUTES[host] || DEFAULT_TARGET;

      const proxyReq = http.request(
        {
          hostname: "127.0.0.1",
          port: targetPort,
          path: req.url,
          method: req.method,
          headers: { ...req.headers, host: `127.0.0.1:${targetPort}` },
        },
        (proxyRes: any) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        },
      );

      proxyReq.on("error", (err: any) => {
        log.warn(`Proxy error for ${host}: ${err.message}`);
        res.writeHead(502, { "Content-Type": "text/plain" });
        res.end("Bad Gateway");
      });

      req.pipe(proxyReq, { end: true });
    });

    // Handle WebSocket upgrades (for chat.arivumaiyam.com)
    proxy.on("upgrade", (req: any, socket: any, head: any) => {
      const host = (req.headers.host || "").split(":")[0].toLowerCase();
      const targetPort = ROUTES[host] || DEFAULT_TARGET;

      const net = require("net");
      const upstream = net.connect(targetPort, "127.0.0.1", () => {
        const reqLine = `${req.method} ${req.url} HTTP/1.1\r\n`;
        const headers = Object.entries({ ...req.headers, host: `127.0.0.1:${targetPort}` })
          .map(([k, v]) => `${k}: ${v}`)
          .join("\r\n");
        upstream.write(reqLine + headers + "\r\n\r\n");
        if (head.length > 0) upstream.write(head);
        socket.pipe(upstream).pipe(socket);
      });

      upstream.on("error", () => socket.destroy());
      socket.on("error", () => upstream.destroy());
    });

    proxy.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        log.warn(`Proxy port ${PROXY_PORT} already in use — skipping`);
      } else {
        log.warn(`Proxy failed: ${err.message}`);
      }
    });

    proxy.listen(PROXY_PORT, () => {
      log.info(`Cloudflare reverse proxy listening on port ${PROXY_PORT}`);
      console.log(`\n  🌐 Cloudflare Proxy on :${PROXY_PORT} — Subdomain Routing:`);
      for (const [domain, port] of Object.entries(ROUTES)) {
        console.log(`    ${domain.padEnd(35)} → localhost:${port}`);
      }
      console.log(`    ${"(default)".padEnd(35)} → localhost:${DEFAULT_TARGET}\n`);
    });
  } catch (err) {
    log.warn(`Reverse proxy failed to start: ${err}`);
  }

  // Auto-restart gateway on channel errors
  let restartAttempts = 0;
  const MAX_RESTART_ATTEMPTS = 5;

  gateway.on("error", async (data: any) => {
    log.error(`Gateway error: ${data?.message || data}`);
    if (restartAttempts < MAX_RESTART_ATTEMPTS) {
      restartAttempts++;
      const delay = Math.min(2000 * Math.pow(2, restartAttempts - 1), 30000);
      log.info(`Auto-restarting gateway in ${delay / 1000}s (attempt ${restartAttempts}/${MAX_RESTART_ATTEMPTS})...`);
      setTimeout(async () => {
        try {
          await gateway.restart();
          restartAttempts = 0; // Reset on successful restart
          log.info("Gateway auto-restart successful");
        } catch (err) {
          log.error(`Auto-restart failed: ${err}`);
        }
      }, delay);
    } else {
      log.error(`Max restart attempts (${MAX_RESTART_ATTEMPTS}) reached. Manual intervention required.`);
    }
  });

  // Handle uncaught errors — restart instead of crashing
  process.on("uncaughtException", async (err) => {
    log.error(`Uncaught exception: ${err.message}`);
    if (restartAttempts < MAX_RESTART_ATTEMPTS) {
      restartAttempts++;
      log.info(`Attempting gateway restart after uncaught exception...`);
      try {
        await gateway.restart();
        restartAttempts = 0;
      } catch (restartErr) {
        log.error(`Restart after exception failed: ${restartErr}`);
      }
    }
  });

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

  try { require("dotenv").config(); } catch { /* dotenv optional */ }

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
  console.log("Welcome to Arivumaiyam AI setup! Let's get you configured.\n");

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

  console.log("\n🦀 Arivumaiyam AI Status\n");
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
Arivumaiyam AI — Your Intelligent AI Assistant 🦀

Usage: arivuclaw [command]

Commands:
  start       Start Arivumaiyam AI with all configured channels (default)
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

function createProvider(config: ArivumaiyamConfig): LLMProvider {
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
