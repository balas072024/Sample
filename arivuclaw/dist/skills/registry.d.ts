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
import type { SkillManifest, ToolDefinition } from "../core/types";
export declare class SkillRegistry {
    private skillDirectories;
    private skills;
    private toolIndex;
    private dependencyGraph;
    private watchers;
    constructor(skillDirectories: string[]);
    loadAll(): Promise<void>;
    loadFromDirectory(baseDir: string): Promise<void>;
    private loadSkill;
    private parseSkillMd;
    private parseManifest;
    private parseDependencies;
    private parseInterfaces;
    private parsePermissions;
    private parseToolDefs;
    private parseTriggers;
    private resolveDependencies;
    private findInterfaceProvider;
    private hasCycles;
    /**
     * Get skills in dependency order (topological sort)
     */
    getLoadOrder(): string[];
    matchTriggers(content: string): string[];
    private matchesTrigger;
    getManifest(name: string): SkillManifest | undefined;
    getInstructions(name: string): string | undefined;
    getTool(name: string): ToolDefinition | undefined;
    getToolDefinitions(skillNames: string[]): ToolDefinition[];
    getAllSkills(): {
        name: string;
        manifest: SkillManifest;
        loaded: boolean;
    }[];
    enableHotReload(): void;
    disableHotReload(): void;
    private binaryExists;
}
//# sourceMappingURL=registry.d.ts.map