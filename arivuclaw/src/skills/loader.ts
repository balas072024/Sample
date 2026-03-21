/**
 * ArivuClaw Skill Loader — Formats skills for system prompt injection.
 *
 * Uses compact XML representation (similar to OpenClaw) but adds:
 * - Interface metadata for skill composition
 * - Permission summaries so the model knows what it can do
 * - Token budget awareness
 */

import type { SkillManifest, ToolDefinition } from "../core/types.js";
import type { SkillRegistry } from "./registry.js";

export class SkillLoader {
  constructor(private registry: SkillRegistry) {}

  /**
   * Format active skills into a compact system prompt section.
   * Uses XML for structured representation (LLM-friendly).
   */
  formatForPrompt(activeSkills: string[], tokenBudget: number = 2000): string {
    if (activeSkills.length === 0) return "";

    const parts: string[] = ["<available_skills>"];

    for (const name of activeSkills) {
      const manifest = this.registry.getManifest(name);
      if (!manifest) continue;

      parts.push(`  <skill name="${escapeXml(name)}" version="${manifest.version}">`);
      parts.push(`    <description>${escapeXml(manifest.description)}</description>`);

      if (manifest.tools.length > 0) {
        parts.push("    <tools>");
        for (const tool of manifest.tools) {
          parts.push(`      <tool name="${escapeXml(tool.name)}">`);
          parts.push(`        <description>${escapeXml(tool.description)}</description>`);
          parts.push(`        <permissions>${tool.permissions.join(", ")}</permissions>`);
          parts.push("      </tool>");
        }
        parts.push("    </tools>");
      }

      if (manifest.provides && manifest.provides.length > 0) {
        parts.push("    <provides>");
        for (const iface of manifest.provides) {
          parts.push(`      <interface name="${escapeXml(iface.name)}" version="${iface.version}" />`);
        }
        parts.push("    </provides>");
      }

      parts.push("  </skill>");
    }

    parts.push("</available_skills>");

    const result = parts.join("\n");

    // Simple token budget check (rough: 4 chars per token)
    const estimatedTokens = Math.ceil(result.length / 4);
    if (estimatedTokens > tokenBudget) {
      return this.formatCompact(activeSkills);
    }

    return result;
  }

  /**
   * Compact format when token budget is tight.
   */
  private formatCompact(activeSkills: string[]): string {
    const lines: string[] = ["Available skills:"];

    for (const name of activeSkills) {
      const manifest = this.registry.getManifest(name);
      if (!manifest) continue;

      const toolNames = manifest.tools.map((t) => t.name).join(", ");
      lines.push(`- ${name}: ${manifest.description} [tools: ${toolNames}]`);
    }

    return lines.join("\n");
  }

  /**
   * Get full instructions for a skill (on-demand loading).
   * Called when the model needs detailed tool usage instructions.
   */
  getSkillInstructions(name: string): string | null {
    return this.registry.getInstructions(name) || null;
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
