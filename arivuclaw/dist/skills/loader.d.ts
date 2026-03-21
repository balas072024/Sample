/**
 * ArivuClaw Skill Loader — Formats skills for system prompt injection.
 *
 * Uses compact XML representation (similar to OpenClaw) but adds:
 * - Interface metadata for skill composition
 * - Permission summaries so the model knows what it can do
 * - Token budget awareness
 */
import type { SkillRegistry } from "./registry";
export declare class SkillLoader {
    private registry;
    constructor(registry: SkillRegistry);
    /**
     * Format active skills into a compact system prompt section.
     * Uses XML for structured representation (LLM-friendly).
     */
    formatForPrompt(activeSkills: string[], tokenBudget?: number): string;
    /**
     * Compact format when token budget is tight.
     */
    private formatCompact;
    /**
     * Get full instructions for a skill (on-demand loading).
     * Called when the model needs detailed tool usage instructions.
     */
    getSkillInstructions(name: string): string | null;
}
//# sourceMappingURL=loader.d.ts.map