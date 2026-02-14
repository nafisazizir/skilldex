import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { addSkill } from "../src/lib/add.js";
import { readConfig } from "../src/lib/config.js";
import { removeSkill } from "../src/lib/remove.js";
import { END_TAG, START_TAG } from "../src/lib/writer.js";

describe("remove", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `skilldex-remove-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  async function createSkill(name: string, description: string, files: string[]): Promise<void> {
    const skillDir = join(testDir, ".agents", "skills", name);
    await mkdir(skillDir, { recursive: true });

    if (description) {
      await writeFile(join(skillDir, "SKILL.md"), `---\ndescription: ${description}\n---\n`);
    }

    for (const file of files) {
      const filePath = join(skillDir, file);
      await mkdir(join(filePath, ".."), { recursive: true });
      await writeFile(filePath, `# ${file}`);
    }
  }

  async function exists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  it("removes skill from config, keeps files (default)", async () => {
    await createSkill("my-skill", "A skill", ["docs.md"]);
    await addSkill(testDir, "my-skill");

    const result = await removeSkill(testDir, "my-skill");

    expect(result.skillName).toBe("my-skill");
    expect(result.wasDeleted).toBe(false);
    expect(result.indexSize).toBeGreaterThan(0);

    const config = await readConfig(testDir);
    expect(config.skills).toHaveLength(0);

    // Files should still exist
    expect(await exists(join(testDir, ".agents", "skills", "my-skill"))).toBe(true);

    // AGENTS.md should not contain the skill
    const agentsMd = await readFile(join(testDir, "AGENTS.md"), "utf-8");
    expect(agentsMd).not.toContain("[my-skill]");
  });

  it("removes skill and deletes files when deleteFiles=true", async () => {
    await createSkill("my-skill", "A skill", ["docs.md"]);
    await addSkill(testDir, "my-skill");

    const result = await removeSkill(testDir, "my-skill", true);

    expect(result.wasDeleted).toBe(true);

    const config = await readConfig(testDir);
    expect(config.skills).toHaveLength(0);

    // Files should be deleted
    expect(await exists(join(testDir, ".agents", "skills", "my-skill"))).toBe(false);
  });

  it("throws on non-indexed skill", async () => {
    await createSkill("my-skill", "A skill", ["docs.md"]);

    await expect(removeSkill(testDir, "my-skill")).rejects.toThrow(
      'Skill "my-skill" is not indexed',
    );
  });

  it("removes one skill from multi-skill index, others remain", async () => {
    await createSkill("skill-a", "First", ["a.md"]);
    await createSkill("skill-b", "Second", ["b.md"]);
    await createSkill("skill-c", "Third", ["c.md"]);

    await addSkill(testDir, "skill-a");
    await addSkill(testDir, "skill-b");
    await addSkill(testDir, "skill-c");

    await removeSkill(testDir, "skill-b");

    const config = await readConfig(testDir);
    expect(config.skills.map((s) => s.name)).toEqual(["skill-a", "skill-c"]);

    const agentsMd = await readFile(join(testDir, "AGENTS.md"), "utf-8");
    expect(agentsMd).toContain("[skill-a]");
    expect(agentsMd).not.toContain("[skill-b]");
    expect(agentsMd).toContain("[skill-c]");
  });

  it("preserves AGENTS.md content outside managed section", async () => {
    await writeFile(join(testDir, "AGENTS.md"), "# My Project\n\nCustom content.\n");
    await createSkill("my-skill", "A skill", ["docs.md"]);
    await addSkill(testDir, "my-skill");

    await removeSkill(testDir, "my-skill");

    const agentsMd = await readFile(join(testDir, "AGENTS.md"), "utf-8");
    expect(agentsMd).toContain("# My Project");
    expect(agentsMd).toContain("Custom content.");
    expect(agentsMd).toContain(START_TAG);
    expect(agentsMd).toContain(END_TAG);
    expect(agentsMd).not.toContain("[my-skill]");
  });

  it("handles removal when skill dir was already manually deleted", async () => {
    await createSkill("my-skill", "A skill", ["docs.md"]);
    await addSkill(testDir, "my-skill");

    // Manually delete the skill directory
    await rm(join(testDir, ".agents", "skills", "my-skill"), { recursive: true, force: true });

    // Should still succeed — force: true handles already-deleted dirs
    const result = await removeSkill(testDir, "my-skill", true);
    expect(result.skillName).toBe("my-skill");
    expect(result.wasDeleted).toBe(true);

    const config = await readConfig(testDir);
    expect(config.skills).toHaveLength(0);
  });

  it("returns correct RemoveResult shape", async () => {
    await createSkill("my-skill", "A skill", ["docs.md"]);
    await addSkill(testDir, "my-skill");

    const result = await removeSkill(testDir, "my-skill");

    expect(result).toEqual({
      skillName: "my-skill",
      wasDeleted: false,
      indexSize: expect.any(Number),
      agentsMdPath: join(testDir, "AGENTS.md"),
    });
  });

  it("handles removing last skill (empty index)", async () => {
    await createSkill("only-skill", "The only one", ["guide.md"]);
    await addSkill(testDir, "only-skill");

    const result = await removeSkill(testDir, "only-skill");

    const config = await readConfig(testDir);
    expect(config.skills).toHaveLength(0);

    const agentsMd = await readFile(join(testDir, "AGENTS.md"), "utf-8");
    expect(agentsMd).toContain(START_TAG);
    expect(agentsMd).toContain(END_TAG);
    expect(agentsMd).not.toContain("[only-skill]");
    expect(result.indexSize).toBeGreaterThan(0);
  });
});
