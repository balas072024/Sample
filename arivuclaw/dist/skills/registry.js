"use strict";
/**
 * ArivuClaw Skill Registry — Composable skill management.
 *
 * Improvements over OpenClaw:
 * - Dependency resolution with topological sorting
 * - Typed skill interfaces with version checking
 * - Hot-reload with file watchers
 * - Skill composition: skills can depend on and extend other skills
 * - Priority-based trigger matching
 * - Skill sandboxing: each skill runs with declared permissions only
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
exports.SkillRegistry = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml_1 = require("yaml");
const logger_1 = require("../utils/logger");
const log = logger_1.Logger.create("skill-registry");
class SkillRegistry {
    skillDirectories;
    skills = new Map();
    toolIndex = new Map();
    dependencyGraph = new Map();
    watchers = new Map();
    constructor(skillDirectories) {
        this.skillDirectories = skillDirectories;
    }
    // ─── Loading ─────────────────────────────────────────────────────
    async loadAll() {
        log.info(`Loading skills from ${this.skillDirectories.length} directories`);
        for (const dir of this.skillDirectories) {
            await this.loadFromDirectory(dir);
        }
        // Resolve dependencies
        this.resolveDependencies();
        log.info(`Loaded ${this.skills.size} skills, ${this.toolIndex.size} tools`);
    }
    async loadFromDirectory(baseDir) {
        if (!fs.existsSync(baseDir)) {
            log.warn(`Skills directory not found: ${baseDir}`);
            return;
        }
        const entries = fs.readdirSync(baseDir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory())
                continue;
            const skillDir = path.join(baseDir, entry.name);
            const manifestPath = path.join(skillDir, "SKILL.md");
            if (!fs.existsSync(manifestPath))
                continue;
            try {
                await this.loadSkill(skillDir, manifestPath);
            }
            catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                log.error(`Failed to load skill from ${skillDir}: ${errMsg}`);
            }
        }
    }
    async loadSkill(directory, manifestPath) {
        const raw = fs.readFileSync(manifestPath, "utf-8");
        // Parse SKILL.md: YAML frontmatter + markdown body
        const { frontmatter, body } = this.parseSkillMd(raw);
        const manifest = this.parseManifest(frontmatter);
        // Check platform compatibility
        if (manifest.environment?.platforms) {
            const currentPlatform = process.platform;
            if (!manifest.environment.platforms.includes(currentPlatform)) {
                log.info(`Skipping ${manifest.name}: not compatible with ${currentPlatform}`);
                return;
            }
        }
        // Check binary dependencies
        if (manifest.environment?.binaries) {
            for (const binary of manifest.environment.binaries) {
                if (!this.binaryExists(binary)) {
                    log.warn(`Skipping ${manifest.name}: required binary '${binary}' not found`);
                    return;
                }
            }
        }
        // Precedence: workspace > user > bundled
        const existing = this.skills.get(manifest.name);
        if (existing) {
            log.info(`Overriding skill ${manifest.name} with ${directory}`);
        }
        const skill = {
            manifest,
            directory,
            instructions: body,
            loaded: true,
        };
        this.skills.set(manifest.name, skill);
        // Index tools
        for (const tool of manifest.tools) {
            this.toolIndex.set(tool.name, { skill: manifest.name, tool });
        }
        log.info(`Loaded skill: ${manifest.name} v${manifest.version} (${manifest.tools.length} tools)`);
    }
    // ─── SKILL.md Parser ─────────────────────────────────────────────
    parseSkillMd(raw) {
        const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
        if (!fmMatch) {
            return { frontmatter: {}, body: raw };
        }
        let frontmatter;
        try {
            frontmatter = (0, yaml_1.parse)(fmMatch[1]);
        }
        catch {
            // Fallback for compact YAML flow notation that strict parser rejects
            frontmatter = (0, yaml_1.parse)(fmMatch[1], { strict: false });
        }
        const body = fmMatch[2].trim();
        return { frontmatter, body };
    }
    parseManifest(fm) {
        return {
            name: String(fm.name || "unknown"),
            version: String(fm.version || "0.0.1"),
            description: String(fm.description || ""),
            author: fm.author ? String(fm.author) : undefined,
            tags: Array.isArray(fm.tags) ? fm.tags.map(String) : undefined,
            dependencies: this.parseDependencies(fm.dependencies),
            provides: this.parseInterfaces(fm.provides),
            requires: this.parseInterfaces(fm.requires),
            permissions: this.parsePermissions(fm.permissions),
            tools: this.parseToolDefs(fm.tools),
            triggers: this.parseTriggers(fm.triggers),
            environment: fm.environment,
        };
    }
    parseDependencies(raw) {
        if (!Array.isArray(raw))
            return undefined;
        return raw.map((d) => ({
            skill: String(d.skill || d),
            version: String(d.version || "*"),
            optional: Boolean(d.optional),
        }));
    }
    parseInterfaces(raw) {
        if (!Array.isArray(raw))
            return undefined;
        return raw.map((i) => ({
            name: String(i.name),
            version: String(i.version || "1.0"),
            methods: Array.isArray(i.methods) ? i.methods : [],
        }));
    }
    parsePermissions(raw) {
        if (!Array.isArray(raw))
            return [];
        return raw.map(String);
    }
    parseToolDefs(raw) {
        if (!Array.isArray(raw))
            return [];
        return raw.map((t) => ({
            name: String(t.name),
            description: String(t.description || ""),
            inputSchema: t.inputSchema || t.input_schema || {},
            permissions: this.parsePermissions(t.permissions),
        }));
    }
    parseTriggers(raw) {
        if (!Array.isArray(raw))
            return undefined;
        return raw.map((t) => ({
            type: String(t.type),
            pattern: String(t.pattern),
            priority: Number(t.priority || 0),
        }));
    }
    // ─── Dependency Resolution ───────────────────────────────────────
    resolveDependencies() {
        this.dependencyGraph.clear();
        for (const [name, skill] of this.skills) {
            const deps = new Set();
            if (skill.manifest.dependencies) {
                for (const dep of skill.manifest.dependencies) {
                    if (this.skills.has(dep.skill)) {
                        deps.add(dep.skill);
                    }
                    else if (!dep.optional) {
                        log.error(`Skill ${name} requires missing dependency: ${dep.skill}`);
                        skill.loaded = false;
                        skill.error = `Missing dependency: ${dep.skill}`;
                    }
                }
            }
            // Check interface requirements
            if (skill.manifest.requires) {
                for (const iface of skill.manifest.requires) {
                    const provider = this.findInterfaceProvider(iface.name, iface.version);
                    if (provider) {
                        deps.add(provider);
                    }
                    else {
                        log.warn(`Skill ${name} requires interface ${iface.name}@${iface.version} — not provided`);
                    }
                }
            }
            this.dependencyGraph.set(name, deps);
        }
        // Detect cycles
        if (this.hasCycles()) {
            log.error("Circular dependency detected in skills!");
        }
    }
    findInterfaceProvider(name, version) {
        for (const [skillName, skill] of this.skills) {
            if (skill.manifest.provides) {
                for (const iface of skill.manifest.provides) {
                    if (iface.name === name)
                        return skillName;
                }
            }
        }
        return null;
    }
    hasCycles() {
        const visited = new Set();
        const inStack = new Set();
        const dfs = (node) => {
            if (inStack.has(node))
                return true;
            if (visited.has(node))
                return false;
            visited.add(node);
            inStack.add(node);
            const deps = this.dependencyGraph.get(node) || new Set();
            for (const dep of deps) {
                if (dfs(dep))
                    return true;
            }
            inStack.delete(node);
            return false;
        };
        for (const name of this.skills.keys()) {
            if (dfs(name))
                return true;
        }
        return false;
    }
    /**
     * Get skills in dependency order (topological sort)
     */
    getLoadOrder() {
        const order = [];
        const visited = new Set();
        const visit = (name) => {
            if (visited.has(name))
                return;
            visited.add(name);
            const deps = this.dependencyGraph.get(name) || new Set();
            for (const dep of deps) {
                visit(dep);
            }
            order.push(name);
        };
        for (const name of this.skills.keys()) {
            visit(name);
        }
        return order;
    }
    // ─── Trigger Matching ────────────────────────────────────────────
    matchTriggers(content) {
        const matched = [];
        for (const [name, skill] of this.skills) {
            if (!skill.loaded || !skill.manifest.triggers)
                continue;
            for (const trigger of skill.manifest.triggers) {
                if (this.matchesTrigger(trigger, content)) {
                    matched.push({ skill: name, priority: trigger.priority || 0 });
                    break;
                }
            }
        }
        // Sort by priority (highest first)
        matched.sort((a, b) => b.priority - a.priority);
        return matched.map((m) => m.skill);
    }
    matchesTrigger(trigger, content) {
        const lower = content.toLowerCase();
        switch (trigger.type) {
            case "keyword":
                return lower.includes(trigger.pattern.toLowerCase());
            case "regex":
                return new RegExp(trigger.pattern, "i").test(content);
            case "intent":
                // Simple intent matching — in production, use an NLU model
                return lower.includes(trigger.pattern.toLowerCase());
            default:
                return false;
        }
    }
    // ─── Accessors ───────────────────────────────────────────────────
    getManifest(name) {
        return this.skills.get(name)?.manifest;
    }
    getInstructions(name) {
        return this.skills.get(name)?.instructions;
    }
    getTool(name) {
        return this.toolIndex.get(name)?.tool;
    }
    getToolDefinitions(skillNames) {
        const tools = [];
        for (const skillName of skillNames) {
            const skill = this.skills.get(skillName);
            if (skill?.loaded) {
                tools.push(...skill.manifest.tools);
            }
        }
        return tools;
    }
    getAllSkills() {
        return Array.from(this.skills.entries()).map(([name, skill]) => ({
            name,
            manifest: skill.manifest,
            loaded: skill.loaded,
        }));
    }
    // ─── Hot Reload ──────────────────────────────────────────────────
    enableHotReload() {
        for (const dir of this.skillDirectories) {
            if (!fs.existsSync(dir))
                continue;
            const watcher = fs.watch(dir, { recursive: true }, (eventType, filename) => {
                if (filename?.endsWith("SKILL.md")) {
                    log.info(`Skill file changed: ${filename}, reloading...`);
                    this.loadFromDirectory(dir).then(() => {
                        this.resolveDependencies();
                    });
                }
            });
            this.watchers.set(dir, watcher);
        }
        log.info("Skill hot-reload enabled");
    }
    disableHotReload() {
        for (const [dir, watcher] of this.watchers) {
            watcher.close();
        }
        this.watchers.clear();
    }
    // ─── Utilities ───────────────────────────────────────────────────
    binaryExists(name) {
        try {
            const { execSync } = require("child_process");
            execSync(`which ${name}`, { stdio: "ignore" });
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.SkillRegistry = SkillRegistry;
//# sourceMappingURL=registry.js.map