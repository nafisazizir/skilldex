import { mkdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SKILL_META_FILE, SKILLS_DIR_SEGMENTS } from "../src/lib/constants.js";
import { scanForSkills } from "../src/lib/scanner.js";
import { createSkill, useTempDir } from "./helpers.js";

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

  it("discovers skills in agent-specific directories", async () => {
    const testDir = getDir();
    await createSkill(
      testDir,
      "cursor-skill",
      "A Cursor skill",
      ["guide.md"],
      [".cursor", "skills"],
    );

    const skills = await scanForSkills(testDir);
    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe("cursor-skill");
    expect(skills[0].description).toBe("A Cursor skill");
    expect(skills[0].path).toBe(join(testDir, ".cursor", "skills", "cursor-skill"));
  });

  it("skips symlinked skill directories", async () => {
    const testDir = getDir();
    await createSkill(testDir, "my-skill", "Original", ["guide.md"]);

    // Create a symlink in .cursor/skills/ pointing to the real skill
    const cursorSkillsDir = join(testDir, ".cursor", "skills");
    await mkdir(cursorSkillsDir, { recursive: true });
    await symlink(
      join(testDir, ...SKILLS_DIR_SEGMENTS, "my-skill"),
      join(cursorSkillsDir, "my-skill"),
    );

    const skills = await scanForSkills(testDir);
    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe("my-skill");
    // Should be the real path from .agents/skills, not the symlink
    expect(skills[0].path).toBe(join(testDir, ...SKILLS_DIR_SEGMENTS, "my-skill"));
  });

  it("returns both skills when same name exists in different directories", async () => {
    const testDir = getDir();
    // Create same-named skill in both .agents/skills and .cursor/skills
    await createSkill(testDir, "shared-skill", "Universal version", ["universal.md"]);
    await createSkill(
      testDir,
      "shared-skill",
      "Cursor version",
      ["cursor.md"],
      [".cursor", "skills"],
    );

    const skills = await scanForSkills(testDir);
    expect(skills).toHaveLength(2);

    const descriptions = skills.map((s) => s.description).sort();
    expect(descriptions).toEqual(["Cursor version", "Universal version"]);

    const paths = skills.map((s) => s.path).sort();
    expect(paths).toEqual([
      join(testDir, ...SKILLS_DIR_SEGMENTS, "shared-skill"),
      join(testDir, ".cursor", "skills", "shared-skill"),
    ]);
  });

  it("discovers skills across multiple agent directories", async () => {
    const testDir = getDir();
    await createSkill(testDir, "universal-skill", "Universal", ["guide.md"]);
    await createSkill(testDir, "cursor-skill", "Cursor only", ["cursor.md"], [".cursor", "skills"]);
    await createSkill(testDir, "claude-skill", "Claude only", ["claude.md"], [".claude", "skills"]);

    const skills = await scanForSkills(testDir);
    expect(skills).toHaveLength(3);

    const names = skills.map((s) => s.name).sort();
    expect(names).toEqual(["claude-skill", "cursor-skill", "universal-skill"]);
  });

  it("handles all agent directories missing gracefully", async () => {
    const testDir = getDir();
    // Empty project — no agent directories at all
    const skills = await scanForSkills(testDir);
    expect(skills).toEqual([]);
  });
});
