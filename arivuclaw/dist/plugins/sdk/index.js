"use strict";
/**
 * ArivuClaw Plugin SDK — Extension point system for plugins.
 *
 * Provides a unified SDK for registering plugins across 7 extension points:
 * channel, memory, tool, provider, hook, middleware, and transform.
 * Plugins are TypeScript modules loaded dynamically from a directory.
 *
 * @module plugins/sdk
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginRegistry = exports.PluginSDK = void 0;
const logger_1 = require("../../utils/logger");
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
class PluginSDK {
    log = logger_1.Logger.create("PluginSDK");
    configs = [];
    /**
     * Register a channel extension point.
     * @param config - Channel plugin configuration.
     */
    registerChannelPlugin(config) {
        this.log.debug("Registering channel plugin");
        this.configs.push(config);
    }
    /**
     * Register a memory extension point.
     * @param config - Memory plugin configuration.
     */
    registerMemoryPlugin(config) {
        this.log.debug("Registering memory plugin");
        this.configs.push(config);
    }
    /**
     * Register a tool extension point.
     * @param config - Tool plugin configuration.
     */
    registerToolPlugin(config) {
        this.log.debug(`Registering tool plugin with ${config.tools.length} tools`);
        this.configs.push(config);
    }
    /**
     * Register a provider extension point.
     * @param config - Provider plugin configuration.
     */
    registerProviderPlugin(config) {
        this.log.debug("Registering provider plugin");
        this.configs.push(config);
    }
    /**
     * Register a hook extension point.
     * @param config - Hook plugin configuration.
     */
    registerHookPlugin(config) {
        this.log.debug(`Registering hook plugin for event: ${config.event}`);
        this.configs.push(config);
    }
    /**
     * Register a middleware extension point.
     * @param config - Middleware plugin configuration.
     */
    registerMiddlewarePlugin(config) {
        this.log.debug(`Registering middleware plugin with priority ${config.priority}`);
        this.configs.push(config);
    }
    /**
     * Register a transform extension point.
     * @param config - Transform plugin configuration.
     */
    registerTransformPlugin(config) {
        this.log.debug(`Registering transform plugin (direction: ${config.direction})`);
        this.configs.push(config);
    }
    /**
     * Return all registered plugin configs. Used internally by the registry.
     */
    getRegisteredConfigs() {
        return this.configs;
    }
}
exports.PluginSDK = PluginSDK;
// ─── Plugin Registry ─────────────────────────────────────────────────
/**
 * Loads, validates, and manages the lifecycle of plugins.
 *
 * Plugins are TypeScript/JavaScript modules that export:
 * - `manifest: PluginManifest`
 * - `activate(sdk: PluginSDK): void | Promise<void>`
 * - optionally `deactivate(): void | Promise<void>`
 */
class PluginRegistry {
    log = logger_1.Logger.create("PluginRegistry");
    plugins = new Map();
    deactivators = new Map();
    /**
     * Load all plugins from a directory.
     *
     * Each subdirectory (or `.ts`/`.js` file) is expected to be a plugin module
     * with a default export or named exports `manifest` and `activate`.
     *
     * @param directory - Absolute path to the plugins directory.
     */
    async loadFromDirectory(directory) {
        this.log.info(`Loading plugins from ${directory}`);
        const { readdir, stat } = await Promise.resolve().then(() => __importStar(require("node:fs/promises")));
        const { join } = await Promise.resolve().then(() => __importStar(require("node:path")));
        let entries;
        try {
            entries = await readdir(directory);
        }
        catch {
            this.log.warn(`Plugin directory not found: ${directory}`);
            return;
        }
        for (const entry of entries) {
            const fullPath = join(directory, entry);
            const info = await stat(fullPath);
            let modulePath;
            if (info.isDirectory()) {
                modulePath = join(fullPath, "index.js");
            }
            else if (entry.endsWith(".js") || entry.endsWith(".ts")) {
                modulePath = fullPath;
            }
            else {
                continue;
            }
            try {
                await this.loadPlugin(modulePath);
            }
            catch (error) {
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
    async loadPlugin(modulePath) {
        this.log.debug(`Loading plugin from ${modulePath}`);
        // Dynamic import of the plugin module
        const mod = await Promise.resolve(`${modulePath}`).then(s => __importStar(require(s)));
        const manifest = mod.manifest ?? mod.default?.manifest;
        const activate = mod.activate ?? mod.default?.activate;
        const deactivate = mod.deactivate ?? mod.default?.deactivate;
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
        this.log.info(`Plugin "${manifest.name}" v${manifest.version} loaded (${configs.length} extension(s))`);
    }
    /**
     * Validate a plugin manifest for required fields.
     *
     * @param manifest - The manifest to validate.
     * @throws Error if the manifest is invalid.
     */
    validateManifest(manifest) {
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
        const validKinds = [
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
    async shutdown() {
        this.log.info("Shutting down all plugins...");
        for (const [name, deactivate] of this.deactivators) {
            try {
                await deactivate();
                this.log.debug(`Plugin "${name}" deactivated`);
            }
            catch (error) {
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
    getPluginsByKind(kind) {
        const results = [];
        for (const plugin of this.plugins.values()) {
            for (const config of plugin.configs) {
                if (config.kind === kind) {
                    results.push(config);
                }
            }
        }
        return results;
    }
    /**
     * Get all loaded plugin manifests.
     */
    listPlugins() {
        return Array.from(this.plugins.values()).map((p) => p.manifest);
    }
    /**
     * Check whether a plugin is loaded.
     *
     * @param name - Plugin name.
     */
    hasPlugin(name) {
        return this.plugins.has(name);
    }
    /**
     * Get the total number of loaded plugins.
     */
    get size() {
        return this.plugins.size;
    }
}
exports.PluginRegistry = PluginRegistry;
//# sourceMappingURL=index.js.map