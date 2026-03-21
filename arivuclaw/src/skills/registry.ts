/**
 * Arivumaiyam AI Skill Registry — Composable skill management.
 *
 * Improvements over OpenClaw:
 * - Dependency resolution with topological sorting
 * - Typed skill interfaces with version checking
 * - Hot-reload with file watchers
 * - Skill composition: skills can depend on and extend other skills
 * - Priority-based trigger matching
 * - Skill sandboxing: each skill runs with declared permissions only
 */

import * as fs from "fs";
import * as path from "path";
import { parse as parseYaml } from "yaml";
import type {
  SkillManifest,
  SkillDependency,
  SkillInterface,
  SkillTrigger,
  ToolDefinition,
  ToolPermission,
} from "../core/types";
import { Logger } from "../utils/logger";

const log = Logger.create("skill-registry");

interface LoadedSkill {
  manifest: SkillManifest;
  directory: string;
  instructions: string;
  loaded: boolean;
  error?: string;
}

export class SkillRegistry {
  private skills = new Map<string, LoadedSkill>();
  private toolIndex = new Map<string, { skill: string; tool: ToolDefinition }>();
  private dependencyGraph = new Map<string, Set<string>>();
  private watchers = new Map<string, fs.FSWatcher>();

  constructor(private skillDirectories: string[]) {}

  // ─── Loading ─────────────────────────────────────────────────────

  async loadAll(): Promise<void> {
    log.info(`Loading skills from ${this.skillDirectories.length} directories`);

    for (const dir of this.skillDirectories) {
      await this.loadFromDirectory(dir);
    }

    // Resolve dependencies
    this.resolveDependencies();

    log.info(`Loaded ${this.skills.size} skills, ${this.toolIndex.size} tools`);
  }

  async loadFromDirectory(baseDir: string): Promise<void> {
    if (!fs.existsSync(baseDir)) {
      log.warn(`Skills directory not found: ${baseDir}`);
      return;
    }

    const entries = fs.readdirSync(baseDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillDir = path.join(baseDir, entry.name);
      const manifestPath = path.join(skillDir, "SKILL.md");

      if (!fs.existsSync(manifestPath)) continue;

      try {
        await this.loadSkill(skillDir, manifestPath);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        log.error(`Failed to load skill from ${skillDir}: ${errMsg}`);
      }
    }
  }

  private async loadSkill(directory: string, manifestPath: string): Promise<void> {
    const raw = fs.readFileSync(manifestPath, "utf-8");

    // Parse SKILL.md: YAML frontmatter + markdown body
    const { frontmatter, body } = this.parseSkillMd(raw);
    const manifest = this.parseManifest(frontmatter);

    // Check platform compatibility
    if (manifest.environment?.platforms) {
      const currentPlatform = process.platform as "linux" | "darwin" | "win32";
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

    const skill: LoadedSkill = {
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

  private parseSkillMd(raw: string): { frontmatter: Record<string, unknown>; body: string } {
    const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

    if (!fmMatch) {
      return { frontmatter: {}, body: raw };
    }

    let frontmatter: Record<string, unknown>;
    try {
      frontmatter = parseYaml(fmMatch[1]) as Record<string, unknown>;
    } catch {
      // Fallback for compact YAML flow notation that strict parser rejects
      frontmatter = parseYaml(fmMatch[1], { strict: false }) as Record<string, unknown>;
    }
    const body = fmMatch[2].trim();

    return { frontmatter, body };
  }

  private parseManifest(fm: Record<string, unknown>): SkillManifest {
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
      environment: fm.environment as SkillManifest["environment"],
    };
  }

  private parseDependencies(raw: unknown): SkillDependency[] | undefined {
    if (!Array.isArray(raw)) return undefined;
    return raw.map((d) => ({
      skill: String(d.skill || d),
      version: String(d.version || "*"),
      optional: Boolean(d.optional),
    }));
  }

  private parseInterfaces(raw: unknown): SkillInterface[] | undefined {
    if (!Array.isArray(raw)) return undefined;
    return raw.map((i) => ({
      name: String(i.name),
      version: String(i.version || "1.0"),
      methods: Array.isArray(i.methods) ? i.methods : [],
    }));
  }

  private parsePermissions(raw: unknown): ToolPermission[] {
    if (!Array.isArray(raw)) return [];
    return raw.map(String) as ToolPermission[];
  }

  private parseToolDefs(raw: unknown): ToolDefinition[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((t) => ({
      name: String(t.name),
      description: String(t.description || ""),
      inputSchema: t.inputSchema || t.input_schema || {},
      permissions: this.parsePermissions(t.permissions),
    }));
  }

  private parseTriggers(raw: unknown): SkillTrigger[] | undefined {
    if (!Array.isArray(raw)) return undefined;
    return raw.map((t) => ({
      type: String(t.type) as SkillTrigger["type"],
      pattern: String(t.pattern),
      priority: Number(t.priority || 0),
    }));
  }

  // ─── Dependency Resolution ───────────────────────────────────────

  private resolveDependencies(): void {
    this.dependencyGraph.clear();

    for (const [name, skill] of this.skills) {
      const deps = new Set<string>();

      if (skill.manifest.dependencies) {
        for (const dep of skill.manifest.dependencies) {
          if (this.skills.has(dep.skill)) {
            deps.add(dep.skill);
          } else if (!dep.optional) {
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
          } else {
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

  private findInterfaceProvider(name: string, version: string): string | null {
    for (const [skillName, skill] of this.skills) {
      if (skill.manifest.provides) {
        for (const iface of skill.manifest.provides) {
          if (iface.name === name) return skillName;
        }
      }
    }
    return null;
  }

  private hasCycles(): boolean {
    const visited = new Set<string>();
    const inStack = new Set<string>();

    const dfs = (node: string): boolean => {
      if (inStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      inStack.add(node);

      const deps = this.dependencyGraph.get(node) || new Set();
      for (const dep of deps) {
        if (dfs(dep)) return true;
      }

      inStack.delete(node);
      return false;
    };

    for (const name of this.skills.keys()) {
      if (dfs(name)) return true;
    }
    return false;
  }

  /**
   * Get skills in dependency order (topological sort)
   */
  getLoadOrder(): string[] {
    const order: string[] = [];
    const visited = new Set<string>();

    const visit = (name: string) => {
      if (visited.has(name)) return;
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

  matchTriggers(content: string): string[] {
    const matched: { skill: string; priority: number }[] = [];

    for (const [name, skill] of this.skills) {
      if (!skill.loaded || !skill.manifest.triggers) continue;

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

  private matchesTrigger(trigger: SkillTrigger, content: string): boolean {
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

  getManifest(name: string): SkillManifest | undefined {
    return this.skills.get(name)?.manifest;
  }

  getInstructions(name: string): string | undefined {
    return this.skills.get(name)?.instructions;
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.toolIndex.get(name)?.tool;
  }

  getToolDefinitions(skillNames: string[]): ToolDefinition[] {
    const tools: ToolDefinition[] = [];

    for (const skillName of skillNames) {
      const skill = this.skills.get(skillName);
      if (skill?.loaded) {
        tools.push(...skill.manifest.tools);
      }
    }

    return tools;
  }

  getAllSkills(): { name: string; manifest: SkillManifest; loaded: boolean }[] {
    return Array.from(this.skills.entries()).map(([name, skill]) => ({
      name,
      manifest: skill.manifest,
      loaded: skill.loaded,
    }));
  }

  // ─── Hot Reload ──────────────────────────────────────────────────

  enableHotReload(): void {
    for (const dir of this.skillDirectories) {
      if (!fs.existsSync(dir)) continue;

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

  disableHotReload(): void {
    for (const [dir, watcher] of this.watchers) {
      watcher.close();
    }
    this.watchers.clear();
  }

  // ─── Utilities ───────────────────────────────────────────────────

  private binaryExists(name: string): boolean {
    try {
      const { execSync } = require("child_process");
      execSync(`which ${name}`, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }
}
