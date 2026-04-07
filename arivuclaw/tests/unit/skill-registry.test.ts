import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { SkillRegistry } from "../../src/skills/registry";

describe("SkillRegistry", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "arivuclaw-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function createSkill(name: string, manifest: Record<string, unknown>, body: string = ""): void {
    const skillDir = path.join(tempDir, name);
    fs.mkdirSync(skillDir, { recursive: true });

    const yaml = Object.entries(manifest)
      .map(([k, v]) => {
        if (Array.isArray(v)) {
          return `${k}:\n${v.map((i) => `  - ${typeof i === "object" ? JSON.stringify(i) : i}`).join("\n")}`;
        }
        return `${k}: ${JSON.stringify(v)}`;
      })
      .join("\n");

    fs.writeFileSync(
      path.join(skillDir, "SKILL.md"),
      `---\n${yaml}\n---\n${body}`,
    );
  }

  it("loads skills from a directory", async () => {
    createSkill("test-skill", {
      name: "test-skill",
      version: "1.0.0",
      description: "A test skill",
      permissions: ["filesystem.read"],
      tools: [],
    });

    const registry = new SkillRegistry([tempDir]);
    await registry.loadAll();

    const skills = registry.getAllSkills();
    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe("test-skill");
    expect(skills[0].manifest.description).toBe("A test skill");
  });

  it("returns undefined for non-existent skills", async () => {
    const registry = new SkillRegistry([tempDir]);
    await registry.loadAll();

    expect(registry.getManifest("nonexistent")).toBeUndefined();
    expect(registry.getTool("nonexistent")).toBeUndefined();
  });

  it("returns empty list for empty directory", async () => {
    const registry = new SkillRegistry([tempDir]);
    await registry.loadAll();

    expect(registry.getAllSkills()).toHaveLength(0);
  });

  it("skips directories without SKILL.md", async () => {
    const dir = path.join(tempDir, "not-a-skill");
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, "README.md"), "Not a skill");

    const registry = new SkillRegistry([tempDir]);
    await registry.loadAll();

    expect(registry.getAllSkills()).toHaveLength(0);
  });

  it("resolves load order with dependencies", async () => {
    createSkill("base", {
      name: "base",
      version: "1.0.0",
      description: "Base skill",
      permissions: [],
      tools: [],
    });

    createSkill("dependent", {
      name: "dependent",
      version: "1.0.0",
      description: "Depends on base",
      dependencies: [{ skill: "base", version: "1.0.0" }],
      permissions: [],
      tools: [],
    });

    const registry = new SkillRegistry([tempDir]);
    await registry.loadAll();

    const order = registry.getLoadOrder();
    expect(order.indexOf("base")).toBeLessThan(order.indexOf("dependent"));
  });

  it("matches keyword triggers", async () => {
    createSkill("web-skill", {
      name: "web-skill",
      version: "1.0.0",
      description: "Web skill",
      permissions: [],
      tools: [],
      triggers: [{ type: "keyword", pattern: "search", priority: 5 }],
    });

    const registry = new SkillRegistry([tempDir]);
    await registry.loadAll();

    const matched = registry.matchTriggers("can you search for cats?");
    expect(matched).toContain("web-skill");

    const notMatched = registry.matchTriggers("what is the weather?");
    expect(notMatched).not.toContain("web-skill");
  });
});
