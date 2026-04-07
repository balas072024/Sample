/**
 * ArivuClaw Plugin SDK — Extension point system for plugins.
 *
 * Provides a unified SDK for registering plugins across 7 extension points:
 * channel, memory, tool, provider, hook, middleware, and transform.
 * Plugins are TypeScript modules loaded dynamically from a directory.
 *
 * @module plugins/sdk
 */
import type { ChannelAdapter, ChannelConfig, LLMProvider, LLMRequest, LLMResponse, MemoryStore, ToolDefinition, ToolResult } from "../../core/types";
/** Supported extension point kinds. */
export type ExtensionPointKind = "channel" | "memory" | "tool" | "provider" | "hook" | "middleware" | "transform";
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
export type PluginConfig = ChannelPluginConfig | MemoryPluginConfig | ToolPluginConfig | ProviderPluginConfig | HookPluginConfig | MiddlewarePluginConfig | TransformPluginConfig;
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
export declare class PluginSDK {
    private readonly log;
    private readonly configs;
    /**
     * Register a channel extension point.
     * @param config - Channel plugin configuration.
     */
    registerChannelPlugin(config: ChannelPluginConfig): void;
    /**
     * Register a memory extension point.
     * @param config - Memory plugin configuration.
     */
    registerMemoryPlugin(config: MemoryPluginConfig): void;
    /**
     * Register a tool extension point.
     * @param config - Tool plugin configuration.
     */
    registerToolPlugin(config: ToolPluginConfig): void;
    /**
     * Register a provider extension point.
     * @param config - Provider plugin configuration.
     */
    registerProviderPlugin(config: ProviderPluginConfig): void;
    /**
     * Register a hook extension point.
     * @param config - Hook plugin configuration.
     */
    registerHookPlugin(config: HookPluginConfig): void;
    /**
     * Register a middleware extension point.
     * @param config - Middleware plugin configuration.
     */
    registerMiddlewarePlugin(config: MiddlewarePluginConfig): void;
    /**
     * Register a transform extension point.
     * @param config - Transform plugin configuration.
     */
    registerTransformPlugin(config: TransformPluginConfig): void;
    /**
     * Return all registered plugin configs. Used internally by the registry.
     */
    getRegisteredConfigs(): readonly PluginConfig[];
}
/**
 * Loads, validates, and manages the lifecycle of plugins.
 *
 * Plugins are TypeScript/JavaScript modules that export:
 * - `manifest: PluginManifest`
 * - `activate(sdk: PluginSDK): void | Promise<void>`
 * - optionally `deactivate(): void | Promise<void>`
 */
export declare class PluginRegistry {
    private readonly log;
    private readonly plugins;
    private readonly deactivators;
    /**
     * Load all plugins from a directory.
     *
     * Each subdirectory (or `.ts`/`.js` file) is expected to be a plugin module
     * with a default export or named exports `manifest` and `activate`.
     *
     * @param directory - Absolute path to the plugins directory.
     */
    loadFromDirectory(directory: string): Promise<void>;
    /**
     * Load and activate a single plugin module.
     *
     * @param modulePath - Absolute path to the plugin module.
     */
    loadPlugin(modulePath: string): Promise<void>;
    /**
     * Validate a plugin manifest for required fields.
     *
     * @param manifest - The manifest to validate.
     * @throws Error if the manifest is invalid.
     */
    private validateManifest;
    /**
     * Shut down all loaded plugins, calling their deactivate hooks.
     */
    shutdown(): Promise<void>;
    /**
     * Get all registered plugin configs of a specific extension point kind.
     *
     * @param kind - The extension point kind to filter by.
     * @returns Array of matching plugin configs.
     */
    getPluginsByKind<K extends ExtensionPointKind>(kind: K): Extract<PluginConfig, {
        kind: K;
    }>[];
    /**
     * Get all loaded plugin manifests.
     */
    listPlugins(): PluginManifest[];
    /**
     * Check whether a plugin is loaded.
     *
     * @param name - Plugin name.
     */
    hasPlugin(name: string): boolean;
    /**
     * Get the total number of loaded plugins.
     */
    get size(): number;
}
//# sourceMappingURL=index.d.ts.map