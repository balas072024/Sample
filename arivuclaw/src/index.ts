/**
 * ArivuClaw — Your Intelligent AI Assistant
 * Secure. Composable. Multi-platform.
 *
 * @module arivuclaw
 */

// Core
export { Gateway } from "./core/gateway.js";
export { AgentRuntime } from "./core/agent-runtime.js";
export type * from "./core/types.js";

// Skills
export { SkillRegistry } from "./skills/registry.js";
export { SkillLoader } from "./skills/loader.js";

// Memory
export { VectorMemoryStore } from "./memory/vector-store.js";

// Security
export { SecurityGuard } from "./security/guard.js";
export { SandboxExecutor } from "./security/sandbox.js";

// Channels
export {
  BaseChannel,
  WhatsAppChannel,
  TelegramChannel,
  DiscordChannel,
  SlackChannel,
  WebChannel,
  CLIChannel,
} from "./channels/index.js";

// Providers
export { AnthropicProvider } from "./plugins/providers/anthropic.js";
export { OpenAIProvider } from "./plugins/providers/openai.js";
export { OllamaProvider } from "./plugins/providers/ollama.js";

// Utils
export { Logger } from "./utils/logger.js";
