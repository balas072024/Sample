/**
 * Arivumaiyam AI Plugin SDK — Extension point system for plugins.
 *
 * Provides a unified SDK for registering plugins across 7 extension points:
 * channel, memory, tool, provider, hook, middleware, and transform.
 * Plugins are TypeScript modules loaded dynamically from a directory.
 *
 * @module plugins/sdk
 */

import type {
  ChannelAdapter,
  ChannelConfig,
  LLMProvider,
  LLMRequest,
  LLMResponse,
  MemoryStore,
  ToolDefinition,
  ToolResult,
} from "../../core/types.js";
import { Logger } from "../../utils/logger.js";

// ─── Plugin Extension Point Types ────────────────────────────────────

/** Supported extension point kinds. */
export type ExtensionPointKind =
  | "channel"
  | "memory"
  | "tool"
  | "provider"
  | "hook"
  | "middleware"
  | "transform";

/** Configuration for a channel plugin. */
export interface ChannelPluginConfig {
  readonly kind: "channel";
  /** Factory that produces a ChannelAdapter instance. */
  createAdapter(config: ChannelConfig): ChannelAdapter;
}

/** Configuration for a memory plugin. */
export interface MemoryPluginConfig {
  readonly kind: "memory";
  /** Factory that produces a MemoryStore instance. */
  createStore(options: Record<string, unknown>): MemoryStore;
}

/** Configuration for a tool plugin. */
export interface ToolPluginConfig {
  readonly kind: "tool";
  /** Tool definitions provided by this plugin. */
  tools: ToolDefinition[];
  /** Execute a tool call and return the result. */
  execute(toolName: string, input: Record<string, unknown>): Promise<ToolResult>;
}

/** Configuration for a provider plugin. */
export interface ProviderPluginConfig {
  readonly kind: "provider";
  /** Factory that produces an LLMProvider instance. */
  createProvider(options: Record<string, unknown>): LLMProvider;
}

/** Hook timing — before or after the target action. */
export type HookTiming = "before" | "after";

/** Configuration for a hook plugin. */
export interface HookPluginConfig {
  readonly kind: "hook";
  /** The event this hook listens to (e.g. "message.received", "tool.called"). */
  event: string;
  /** Whether this hook runs before or after the event handler. */
  timing: HookTiming;
  /** The hook handler. Return `false` to cancel the action (before hooks only). */
  handler(context: Record<string, unknown>): Promise<boolean | void>;
}

/** Configuration for a middleware plugin. */
export interface MiddlewarePluginConfig {
  readonly kind: "middleware";
  /** Priority (lower runs first). */
  priority: number;
  /** Process an LLM request before it is sent and optionally modify it. */
  processRequest(request: LLMRequest): Promise<LLMRequest>;
  /** Process an LLM response before it is returned and optionally modify it. */
  processResponse(response: LLMResponse): Promise<LLMResponse>;
}

/** Configuration for a transform plugin. */
export interface TransformPluginConfig {
  readonly kind: "transform";
  /** The data direction this transform applies to. */
  direction: "inbound" | "outbound" | "both";
  /** Transform content (e.g. translate, redact, format). */
  transform(content: string, metadata: Record<string, unknown>): Promise<string>;
}

/** Union of all plugin config types. */
export type PluginConfig =
  | ChannelPluginConfig
  | MemoryPluginConfig
  | ToolPluginConfig
  | ProviderPluginConfig
  | HookPluginConfig
  | MiddlewarePluginConfig
  | TransformPluginConfig;

// ─── Plugin Manifest ─────────────────────────────────────────────────

/**
 * Describes a plugin package's metadata and the extension points it provides.
 */
export interface PluginManifest {
  /** Unique plugin name (e.g. "arivuclaw-plugin-weather"). */
  name: string;
  /** Semver version string. */
  version: string;
  /** Human-readable description. */
  description: string;
  /** Author name or email. */
  author: string;
  /** Extension points this plugin registers. */
  extensionPoints: ExtensionPointKind[];
}

/** Internal record for a registered plugin. */
interface RegisteredPlugin {
  manifest: PluginManifest;
  configs: PluginConfig[];
  initialized: boolean;
}

// ─── Plugin SDK ──────────────────────────────────────────────────────

/**
 * SDK used by plugin authors to register extension points.
 *
 * @example
 * ```ts
 * export default function activate(sdk: PluginSDK) {
 *   sdk.registerToolPlugin({
 *     kind: "tool",
 *     tools: [myTool],
 *     execute: async (name, input) => { ... },
 *   });
 * }
 * ```
 */
export class PluginSDK {
  private readonly log = Logger.create("PluginSDK");
  private readonly configs: PluginConfig[] = [];

  /**
   * Register a channel extension point.
   * @param config - Channel plugin configuration.
   */
  registerChannelPlugin(config: ChannelPluginConfig): void {
    this.log.debug("Registering channel plugin");
    this.configs.push(config);
  }

  /**
   * Register a memory extension point.
   * @param config - Memory plugin configuration.
   */
  registerMemoryPlugin(config: MemoryPluginConfig): void {
    this.log.debug("Registering memory plugin");
    this.configs.push(config);
  }

  /**
   * Register a tool extension point.
   * @param config - Tool plugin configuration.
   */
  registerToolPlugin(config: ToolPluginConfig): void {
    this.log.debug(`Registering tool plugin with ${config.tools.length} tools`);
    this.configs.push(config);
  }

  /**
   * Register a provider extension point.
   * @param config - Provider plugin configuration.
   */
  registerProviderPlugin(config: ProviderPluginConfig): void {
    this.log.debug("Registering provider plugin");
    this.configs.push(config);
  }

  /**
   * Register a hook extension point.
   * @param config - Hook plugin configuration.
   */
  registerHookPlugin(config: HookPluginConfig): void {
    this.log.debug(`Registering hook plugin for event: ${config.event}`);
    this.configs.push(config);
  }

  /**
   * Register a middleware extension point.
   * @param config - Middleware plugin configuration.
   */
  registerMiddlewarePlugin(config: MiddlewarePluginConfig): void {
    this.log.debug(`Registering middleware plugin with priority ${config.priority}`);
    this.configs.push(config);
  }

  /**
   * Register a transform extension point.
   * @param config - Transform plugin configuration.
   */
  registerTransformPlugin(config: TransformPluginConfig): void {
    this.log.debug(`Registering transform plugin (direction: ${config.direction})`);
    this.configs.push(config);
  }

  /**
   * Return all registered plugin configs. Used internally by the registry.
   */
  getRegisteredConfigs(): readonly PluginConfig[] {
    return this.configs;
  }
}

// ─── Plugin Registry ─────────────────────────────────────────────────

/**
 * Loads, validates, and manages the lifecycle of plugins.
 *
 * Plugins are TypeScript/JavaScript modules that export:
 * - `manifest: PluginManifest`
 * - `activate(sdk: PluginSDK): void | Promise<void>`
 * - optionally `deactivate(): void | Promise<void>`
 */
export class PluginRegistry {
  private readonly log = Logger.create("PluginRegistry");
  private readonly plugins = new Map<string, RegisteredPlugin>();
  private readonly deactivators = new Map<string, () => void | Promise<void>>();

  /**
   * Load all plugins from a directory.
   *
   * Each subdirectory (or `.ts`/`.js` file) is expected to be a plugin module
   * with a default export or named exports `manifest` and `activate`.
   *
   * @param directory - Absolute path to the plugins directory.
   */
  async loadFromDirectory(directory: string): Promise<void> {
    this.log.info(`Loading plugins from ${directory}`);

    const { readdir, stat } = await import("node:fs/promises");
    const { join } = await import("node:path");

    let entries: string[];
    try {
      entries = await readdir(directory);
    } catch {
      this.log.warn(`Plugin directory not found: ${directory}`);
      return;
    }

    for (const entry of entries) {
      const fullPath = join(directory, entry);
      const info = await stat(fullPath);

      let modulePath: string;
      if (info.isDirectory()) {
        modulePath = join(fullPath, "index.js");
      } else if (entry.endsWith(".js") || entry.endsWith(".ts")) {
        modulePath = fullPath;
      } else {
        continue;
      }

      try {
        await this.loadPlugin(modulePath);
      } catch (error) {
        this.log.error(`Failed to load plugin at ${modulePath}: ${error}`);
      }
    }

    this.log.info(`Loaded ${this.plugins.size} plugins`);
  }

  /**
   * Load and activate a single plugin module.
   *
   * @param modulePath - Absolute path to the plugin module.
   */
  async loadPlugin(modulePath: string): Promise<void> {
    this.log.debug(`Loading plugin from ${modulePath}`);

    // Dynamic import of the plugin module
    const mod = await import(modulePath);

    const manifest: PluginManifest | undefined = mod.manifest ?? mod.default?.manifest;
    const activate: ((sdk: PluginSDK) => void | Promise<void>) | undefined =
      mod.activate ?? mod.default?.activate;
    const deactivate: (() => void | Promise<void>) | undefined =
      mod.deactivate ?? mod.default?.deactivate;

    if (!manifest) {
      throw new Error(`Plugin at ${modulePath} does not export a manifest`);
    }

    this.validateManifest(manifest);

    if (this.plugins.has(manifest.name)) {
      throw new Error(`Plugin "${manifest.name}" is already registered`);
    }

    // Create an SDK instance for this plugin and let it register its extensions
    const sdk = new PluginSDK();
    if (activate) {
      await activate(sdk);
    }

    const configs = [...sdk.getRegisteredConfigs()];

    this.plugins.set(manifest.name, {
      manifest,
      configs,
      initialized: true,
    });

    if (deactivate) {
      this.deactivators.set(manifest.name, deactivate);
    }

    this.log.info(
      `Plugin "${manifest.name}" v${manifest.version} loaded (${configs.length} extension(s))`,
    );
  }

  /**
   * Validate a plugin manifest for required fields.
   *
   * @param manifest - The manifest to validate.
   * @throws Error if the manifest is invalid.
   */
  private validateManifest(manifest: PluginManifest): void {
    if (!manifest.name || typeof manifest.name !== "string") {
      throw new Error("Plugin manifest must have a non-empty 'name' string");
    }
    if (!manifest.version || typeof manifest.version !== "string") {
      throw new Error("Plugin manifest must have a non-empty 'version' string");
    }
    if (!manifest.description || typeof manifest.description !== "string") {
      throw new Error("Plugin manifest must have a non-empty 'description' string");
    }
    if (!manifest.author || typeof manifest.author !== "string") {
      throw new Error("Plugin manifest must have a non-empty 'author' string");
    }
    if (!Array.isArray(manifest.extensionPoints) || manifest.extensionPoints.length === 0) {
      throw new Error("Plugin manifest must declare at least one extensionPoint");
    }

    const validKinds: ExtensionPointKind[] = [
      "channel",
      "memory",
      "tool",
      "provider",
      "hook",
      "middleware",
      "transform",
    ];
    for (const ep of manifest.extensionPoints) {
      if (!validKinds.includes(ep)) {
        throw new Error(`Invalid extension point kind: "${ep}"`);
      }
    }
  }

  /**
   * Shut down all loaded plugins, calling their deactivate hooks.
   */
  async shutdown(): Promise<void> {
    this.log.info("Shutting down all plugins...");

    for (const [name, deactivate] of this.deactivators) {
      try {
        await deactivate();
        this.log.debug(`Plugin "${name}" deactivated`);
      } catch (error) {
        this.log.error(`Error deactivating plugin "${name}": ${error}`);
      }
    }

    this.plugins.clear();
    this.deactivators.clear();
    this.log.info("All plugins shut down");
  }

  /**
   * Get all registered plugin configs of a specific extension point kind.
   *
   * @param kind - The extension point kind to filter by.
   * @returns Array of matching plugin configs.
   */
  getPluginsByKind<K extends ExtensionPointKind>(
    kind: K,
  ): Extract<PluginConfig, { kind: K }>[] {
    const results: Extract<PluginConfig, { kind: K }>[] = [];
    for (const plugin of this.plugins.values()) {
      for (const config of plugin.configs) {
        if (config.kind === kind) {
          results.push(config as Extract<PluginConfig, { kind: K }>);
        }
      }
    }
    return results;
  }

  /**
   * Get all loaded plugin manifests.
   */
  listPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values()).map((p) => p.manifest);
  }

  /**
   * Check whether a plugin is loaded.
   *
   * @param name - Plugin name.
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get the total number of loaded plugins.
   */
  get size(): number {
    return this.plugins.size;
  }
}
