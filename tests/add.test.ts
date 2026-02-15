import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { addSkill } from "../src/lib/add.js";
import { readConfig } from "../src/lib/config.js";
import { END_TAG, START_TAG, TARGET_FILE } from "../src/lib/constants.js";
import { createSkill } from "./helpers.js";

describe("add", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `skilldex-add-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("adds a skill to empty index", async () => {
    await createSkill(testDir, "react-patterns", "React best practices", ["hooks.md"]);

    const result = await addSkill(testDir, "react-patterns");

    expect(result.skillName).toBe("react-patterns");
    expect(result.indexSize).toBeGreaterThan(0);

    const agentsMd = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(agentsMd).toContain("[react-patterns]");
    expect(agentsMd).toContain("|desc:React best practices");
  });

  it("adds a skill to existing index", async () => {
    await createSkill(testDir, "skill-a", "First skill", ["guide.md"]);
    await createSkill(testDir, "skill-b", "Second skill", ["docs.md"]);

    // Add first skill
    await addSkill(testDir, "skill-a");

    // Add second skill
    const result = await addSkill(testDir, "skill-b");

    expect(result.skillName).toBe("skill-b");

    const agentsMd = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(agentsMd).toContain("[skill-a]");
    expect(agentsMd).toContain("[skill-b]");
    expect(agentsMd).toContain("|desc:First skill");
    expect(agentsMd).toContain("|desc:Second skill");
  });

  it("updates config with new skill", async () => {
    await createSkill(testDir, "my-skill", "A skill", ["content.md"]);

    await addSkill(testDir, "my-skill");

    const config = await readConfig(testDir);
    expect(config.skills).toHaveLength(1);
    expect(config.skills[0].name).toBe("my-skill");
    expect(config.skills[0].path).toBe(".agents/skills/my-skill");
  });

  it("throws error when adding duplicate skill", async () => {
    await createSkill(testDir, "duplicate-skill", "A skill", ["test.md"]);

    await addSkill(testDir, "duplicate-skill");

    await expect(addSkill(testDir, "duplicate-skill")).rejects.toThrow(
      'Skill "duplicate-skill" is already indexed',
    );
  });

  it("throws error when skill does not exist", async () => {
    await expect(addSkill(testDir, "nonexistent-skill")).rejects.toThrow(
      /Skill "nonexistent-skill" not found/,
    );
  });

  it("preserves existing AGENTS.md content outside managed section", async () => {
    await writeFile(join(testDir, TARGET_FILE), "# My Project\n\nCustom content.\n");
    await createSkill(testDir, "my-skill", "A skill", ["docs.md"]);

    await addSkill(testDir, "my-skill");

    const agentsMd = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(agentsMd).toContain("# My Project");
    expect(agentsMd).toContain("Custom content.");
    expect(agentsMd).toContain("[my-skill]");
  });

  it("maintains managed section tags", async () => {
    await createSkill(testDir, "my-skill", "A skill", ["docs.md"]);

    await addSkill(testDir, "my-skill");

    const agentsMd = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(agentsMd).toContain(START_TAG);
    expect(agentsMd).toContain(END_TAG);
  });

  it("adds skill with multiple files and subdirectories", async () => {
    await createSkill(testDir, "complex-skill", "Complex skill", [
      "guide.md",
      "examples/hook.md",
      "examples/pattern.md",
    ]);

    const result = await addSkill(testDir, "complex-skill");

    expect(result.skillName).toBe("complex-skill");

    const agentsMd = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(agentsMd).toContain("[complex-skill]");
    expect(agentsMd).toContain("|desc:Complex skill");
    expect(agentsMd).toContain("|{guide.md}");
    expect(agentsMd).toContain("|examples:{hook.md,pattern.md}");
  });

  it("correctly handles sequential adds", async () => {
    await createSkill(testDir, "skill-1", "First", ["a.md"]);
    await createSkill(testDir, "skill-2", "Second", ["b.md"]);
    await createSkill(testDir, "skill-3", "Third", ["c.md"]);

    await addSkill(testDir, "skill-1");
    await addSkill(testDir, "skill-2");
    const result = await addSkill(testDir, "skill-3");

    const config = await readConfig(testDir);
    expect(config.skills.map((s) => s.name)).toEqual(["skill-1", "skill-2", "skill-3"]);

    const agentsMd = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(agentsMd).toContain("[skill-1]");
    expect(agentsMd).toContain("[skill-2]");
    expect(agentsMd).toContain("[skill-3]");
    expect(result.indexSize).toBeGreaterThan(0);
  });
});
