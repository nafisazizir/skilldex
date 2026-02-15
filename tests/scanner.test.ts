import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SKILL_META_FILE, SKILLS_DIR_SEGMENTS } from "../src/lib/constants.js";
import { scanForSkills } from "../src/lib/scanner.js";
import { useTempDir } from "./helpers.js";

describe("scanForSkills", () => {
  const { getDir } = useTempDir();

  it("discovers skills in .agents/skills/ directory", async () => {
    const testDir = getDir();
    const skillDir = join(testDir, ...SKILLS_DIR_SEGMENTS, "react-patterns");
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, SKILL_META_FILE),
      `---
description: React best practices
---
# React Patterns`,
    );
    await writeFile(join(skillDir, "hooks.md"), "# Hooks guide");

    const skills = await scanForSkills(testDir);
    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe("react-patterns");
    expect(skills[0].description).toBe("React best practices");
    expect(skills[0].files).toHaveLength(1);
    expect(skills[0].files[0].relativePath).toBe("hooks.md");
    expect(skills[0].files[0].name).toBe("hooks");
  });

  it("discovers skills with nested subdirectories", async () => {
    const testDir = getDir();
    const skillDir = join(testDir, ...SKILLS_DIR_SEGMENTS, "ts-patterns");
    const subDir = join(skillDir, "patterns");
    await mkdir(subDir, { recursive: true });
    await writeFile(join(skillDir, SKILL_META_FILE), "---\ndescription: TS tips\n---");
    await writeFile(join(skillDir, "basics.md"), "# Basics");
    await writeFile(join(subDir, "generics.md"), "# Generics");

    const skills = await scanForSkills(testDir);
    expect(skills).toHaveLength(1);
    expect(skills[0].files).toHaveLength(2);

    const paths = skills[0].files.map((f) => f.relativePath).sort();
    expect(paths).toEqual(["basics.md", "patterns/generics.md"]);
  });

  it("handles missing .agents/skills/ directory gracefully", async () => {
    const skills = await scanForSkills(getDir());
    expect(skills).toEqual([]);
  });

  it("skips non-directory entries in skills folder", async () => {
    const testDir = getDir();
    const skillsDir = join(testDir, ...SKILLS_DIR_SEGMENTS);
    await mkdir(skillsDir, { recursive: true });
    await writeFile(join(skillsDir, "not-a-skill.md"), "# Not a skill");

    const skills = await scanForSkills(testDir);
    expect(skills).toEqual([]);
  });

  it("handles skill without SKILL.md (empty description)", async () => {
    const testDir = getDir();
    const skillDir = join(testDir, ...SKILLS_DIR_SEGMENTS, "bare-skill");
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, "guide.md"), "# Guide");

    const skills = await scanForSkills(testDir);
    expect(skills).toHaveLength(1);
    expect(skills[0].description).toBe("");
    expect(skills[0].files).toHaveLength(1);
  });

  it("excludes SKILL.md from file list", async () => {
    const testDir = getDir();
    const skillDir = join(testDir, ...SKILLS_DIR_SEGMENTS, "my-skill");
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, SKILL_META_FILE), "---\ndescription: Test\n---");
    await writeFile(join(skillDir, "guide.md"), "# Guide");

    const skills = await scanForSkills(testDir);
    expect(skills[0].files).toHaveLength(1);
    expect(skills[0].files[0].name).toBe("guide");
  });
});
