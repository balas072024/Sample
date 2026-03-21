/**
 * SCENARIO 6: Skill Loader — prompt formatting and token budget
 */

import { SkillLoader } from "../../src/skills/loader";
import { SkillRegistry } from "../../src/skills/registry";
import * as path from "path";

describe("Scenario 6: Skill Loader", () => {
  let registry: SkillRegistry;
  let loader: SkillLoader;

  beforeAll(async () => {
    const skillsDir = path.resolve(__dirname, "../../skills");
    registry = new SkillRegistry([skillsDir]);
    await registry.loadAll();
    loader = new SkillLoader(registry);
  });

  it("formats skills for system prompt as XML", () => {
    const skills = registry.getAllSkills().slice(0, 3).map((s) => s.name);
    const output = loader.formatForPrompt(skills);
    expect(output).toContain("<available_skills>");
    expect(output).toContain("</available_skills>");
  });

  it("returns empty string for no skills", () => {
    const output = loader.formatForPrompt([]);
    expect(output).toBe("");
  });

  it("falls back to compact format under token budget", () => {
    const allSkills = registry.getAllSkills().map((s) => s.name);
    const output = loader.formatForPrompt(allSkills, 100); // very small budget
    expect(output).toContain("Available skills:");
    expect(output).not.toContain("<available_skills>");
  });

  it("returns skill instructions on demand", () => {
    const skills = registry.getAllSkills();
    if (skills.length > 0) {
      const instructions = loader.getSkillInstructions(skills[0].name);
      expect(instructions).not.toBeNull();
      expect(typeof instructions).toBe("string");
    }
  });

  it("returns null for non-existent skill instructions", () => {
    const instructions = loader.getSkillInstructions("nonexistent-skill");
    expect(instructions).toBeNull();
  });
});
