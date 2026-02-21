import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readConfig } from "../src/lib/config.js";
import { START_TAG, TARGET_FILE } from "../src/lib/constants.js";
import { init, initWithSkills } from "../src/lib/init.js";
import { scanForSkills } from "../src/lib/scanner.js";
import { createSkill, useTempDir } from "./helpers.js";

describe("init", () => {
  const { getDir } = useTempDir();

  it("creates AGENTS.md with indexed skills (--yes mode)", async () => {
    const testDir = getDir();
    await createSkill(testDir, "react-patterns", "React best practices", ["hooks.md", "state.md"]);
    await createSkill(testDir, "testing", "Testing guidelines", ["unit.md"]);

    const result = await init({ projectRoot: testDir, yes: true });

    expect(result.skillCount).toBe(2);
    expect(result.managedSize).toBeGreaterThan(0);
    expect(result.targets).toHaveLength(1);
    expect(result.targets[0].file).toBe(TARGET_FILE);
    expect(result.targets[0].path).toBe(join(testDir, TARGET_FILE));
    expect(result.targets[0].totalSize).toBeGreaterThan(0);

    const content = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(content).toContain(START_TAG);
    expect(content).toContain("[react-patterns]");
    expect(content).toContain("[testing]");
    expect(content).toContain("desc:React best practices");
    expect(content).toContain("desc:Testing guidelines");
  });

  it("filters to selected skills only", async () => {
    const testDir = getDir();
    await createSkill(testDir, "skill-a", "First", ["guide.md"]);
    await createSkill(testDir, "skill-b", "Second", ["guide.md"]);

    const result = await init({
      projectRoot: testDir,
      selectedSkills: ["skill-a"],
    });

    expect(result.skillCount).toBe(1);

    const content = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(content).toContain("[skill-a]");
    expect(content).not.toContain("[skill-b]");
  });

  it("returns zero skills when none found", async () => {
    const testDir = getDir();
    const result = await init({ projectRoot: testDir, yes: true });

    expect(result.skillCount).toBe(0);

    const content = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(content).toContain("[Skills Index]");
  });

  it("preserves existing AGENTS.md content", async () => {
    const testDir = getDir();
    await writeFile(join(testDir, TARGET_FILE), "# My Project Config\n\nCustom content.\n");
    await createSkill(testDir, "my-skill", "A skill", ["docs.md"]);

    await init({ projectRoot: testDir, yes: true });

    const content = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(content).toContain("# My Project Config");
    expect(content).toContain("Custom content.");
    expect(content).toContain("[my-skill]");
  });

  it("writes to custom target file when specified", async () => {
    const testDir = getDir();
    await createSkill(testDir, "my-skill", "A skill", ["guide.md"]);

    const skills = await scanForSkills(testDir);
    const result = await initWithSkills(testDir, skills, ["CLAUDE.md"]);

    expect(result.targets.map((t) => t.path)).toEqual([join(testDir, "CLAUDE.md")]);

    const content = await readFile(join(testDir, "CLAUDE.md"), "utf-8");
    expect(content).toContain(START_TAG);
    expect(content).toContain("[my-skill]");

    const config = await readConfig(testDir);
    expect(config.targets).toEqual(["CLAUDE.md"]);
  });

  it("writes to multiple targets simultaneously", async () => {
    const testDir = getDir();
    await createSkill(testDir, "my-skill", "A skill", ["guide.md"]);

    const skills = await scanForSkills(testDir);
    const result = await initWithSkills(testDir, skills, ["AGENTS.md", "CLAUDE.md"]);

    expect(result.targets.map((t) => t.path)).toEqual([
      join(testDir, "AGENTS.md"),
      join(testDir, "CLAUDE.md"),
    ]);

    for (const target of ["AGENTS.md", "CLAUDE.md"]) {
      const content = await readFile(join(testDir, target), "utf-8");
      expect(content).toContain(START_TAG);
      expect(content).toContain("[my-skill]");
    }

    const config = await readConfig(testDir);
    expect(config.targets).toEqual(["AGENTS.md", "CLAUDE.md"]);
  });
});
