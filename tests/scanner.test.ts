import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { scanForSkills } from "../src/lib/scanner.js";

describe("scanForSkills", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `skilldex-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("discovers skills in .agents/skills/ directory", async () => {
    const skillDir = join(testDir, ".agents", "skills", "react-patterns");
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, "SKILL.md"),
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
    const skillDir = join(testDir, ".agents", "skills", "ts-patterns");
    const subDir = join(skillDir, "patterns");
    await mkdir(subDir, { recursive: true });
    await writeFile(join(skillDir, "SKILL.md"), "---\ndescription: TS tips\n---");
    await writeFile(join(skillDir, "basics.md"), "# Basics");
    await writeFile(join(subDir, "generics.md"), "# Generics");

    const skills = await scanForSkills(testDir);
    expect(skills).toHaveLength(1);
    expect(skills[0].files).toHaveLength(2);

    const paths = skills[0].files.map((f) => f.relativePath).sort();
    expect(paths).toEqual(["basics.md", "patterns/generics.md"]);
  });

  it("handles missing .agents/skills/ directory gracefully", async () => {
    const skills = await scanForSkills(testDir);
    expect(skills).toEqual([]);
  });

  it("skips non-directory entries in skills folder", async () => {
    const skillsDir = join(testDir, ".agents", "skills");
    await mkdir(skillsDir, { recursive: true });
    await writeFile(join(skillsDir, "not-a-skill.md"), "# Not a skill");

    const skills = await scanForSkills(testDir);
    expect(skills).toEqual([]);
  });

  it("handles skill without SKILL.md (empty description)", async () => {
    const skillDir = join(testDir, ".agents", "skills", "bare-skill");
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, "guide.md"), "# Guide");

    const skills = await scanForSkills(testDir);
    expect(skills).toHaveLength(1);
    expect(skills[0].description).toBe("");
    expect(skills[0].files).toHaveLength(1);
  });

  it("excludes SKILL.md from file list", async () => {
    const skillDir = join(testDir, ".agents", "skills", "my-skill");
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, "SKILL.md"), "---\ndescription: Test\n---");
    await writeFile(join(skillDir, "guide.md"), "# Guide");

    const skills = await scanForSkills(testDir);
    expect(skills[0].files).toHaveLength(1);
    expect(skills[0].files[0].name).toBe("guide");
  });
});
