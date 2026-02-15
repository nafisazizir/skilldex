import { access, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { addSkill } from "../src/lib/add.js";
import { readConfig } from "../src/lib/config.js";
import { END_TAG, SKILLS_DIR_SEGMENTS, START_TAG, TARGET_FILE } from "../src/lib/constants.js";
import { removeSkill } from "../src/lib/remove.js";
import { createSkill, useTempDir } from "./helpers.js";

describe("remove", () => {
  const { getDir } = useTempDir();

  async function exists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  it("removes skill from config, keeps files (default)", async () => {
    const testDir = getDir();
    await createSkill(testDir, "my-skill", "A skill", ["docs.md"]);
    await addSkill(testDir, "my-skill");

    const result = await removeSkill(testDir, "my-skill");

    expect(result.skillName).toBe("my-skill");
    expect(result.wasDeleted).toBe(false);
    expect(result.managedSize).toBeGreaterThan(0);

    const config = await readConfig(testDir);
    expect(config.skills).toHaveLength(0);

    // Files should still exist
    expect(await exists(join(testDir, ...SKILLS_DIR_SEGMENTS, "my-skill"))).toBe(true);

    // AGENTS.md should not contain the skill
    const agentsMd = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(agentsMd).not.toContain("[my-skill]");
  });

  it("removes skill and deletes files when deleteFiles=true", async () => {
    const testDir = getDir();
    await createSkill(testDir, "my-skill", "A skill", ["docs.md"]);
    await addSkill(testDir, "my-skill");

    const result = await removeSkill(testDir, "my-skill", true);

    expect(result.wasDeleted).toBe(true);

    const config = await readConfig(testDir);
    expect(config.skills).toHaveLength(0);

    // Files should be deleted
    expect(await exists(join(testDir, ...SKILLS_DIR_SEGMENTS, "my-skill"))).toBe(false);
  });

  it("throws on non-indexed skill", async () => {
    const testDir = getDir();
    await createSkill(testDir, "my-skill", "A skill", ["docs.md"]);

    await expect(removeSkill(testDir, "my-skill")).rejects.toThrow(
      'Skill "my-skill" is not indexed',
    );
  });

  it("removes one skill from multi-skill index, others remain", async () => {
    const testDir = getDir();
    await createSkill(testDir, "skill-a", "First", ["a.md"]);
    await createSkill(testDir, "skill-b", "Second", ["b.md"]);
    await createSkill(testDir, "skill-c", "Third", ["c.md"]);

    await addSkill(testDir, "skill-a");
    await addSkill(testDir, "skill-b");
    await addSkill(testDir, "skill-c");

    await removeSkill(testDir, "skill-b");

    const config = await readConfig(testDir);
    expect(config.skills.map((s) => s.name)).toEqual(["skill-a", "skill-c"]);

    const agentsMd = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(agentsMd).toContain("[skill-a]");
    expect(agentsMd).not.toContain("[skill-b]");
    expect(agentsMd).toContain("[skill-c]");
  });

  it("preserves AGENTS.md content outside managed section", async () => {
    const testDir = getDir();
    await writeFile(join(testDir, TARGET_FILE), "# My Project\n\nCustom content.\n");
    await createSkill(testDir, "my-skill", "A skill", ["docs.md"]);
    await addSkill(testDir, "my-skill");

    await removeSkill(testDir, "my-skill");

    const agentsMd = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(agentsMd).toContain("# My Project");
    expect(agentsMd).toContain("Custom content.");
    expect(agentsMd).toContain(START_TAG);
    expect(agentsMd).toContain(END_TAG);
    expect(agentsMd).not.toContain("[my-skill]");
  });

  it("handles removal when skill dir was already manually deleted", async () => {
    const testDir = getDir();
    await createSkill(testDir, "my-skill", "A skill", ["docs.md"]);
    await addSkill(testDir, "my-skill");

    // Manually delete the skill directory
    await rm(join(testDir, ...SKILLS_DIR_SEGMENTS, "my-skill"), { recursive: true, force: true });

    // Should still succeed — force: true handles already-deleted dirs
    const result = await removeSkill(testDir, "my-skill", true);
    expect(result.skillName).toBe("my-skill");
    expect(result.wasDeleted).toBe(true);

    const config = await readConfig(testDir);
    expect(config.skills).toHaveLength(0);
  });

  it("returns correct RemoveResult shape", async () => {
    const testDir = getDir();
    await createSkill(testDir, "my-skill", "A skill", ["docs.md"]);
    await addSkill(testDir, "my-skill");

    const result = await removeSkill(testDir, "my-skill");

    expect(result).toEqual({
      skillName: "my-skill",
      wasDeleted: false,
      managedSize: expect.any(Number),
      targets: [
        {
          file: TARGET_FILE,
          path: join(testDir, TARGET_FILE),
          totalSize: expect.any(Number),
        },
      ],
    });
  });

  it("handles removing last skill (empty index)", async () => {
    const testDir = getDir();
    await createSkill(testDir, "only-skill", "The only one", ["guide.md"]);
    await addSkill(testDir, "only-skill");

    const result = await removeSkill(testDir, "only-skill");

    const config = await readConfig(testDir);
    expect(config.skills).toHaveLength(0);

    const agentsMd = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(agentsMd).toContain(START_TAG);
    expect(agentsMd).toContain(END_TAG);
    expect(agentsMd).not.toContain("[only-skill]");
    expect(result.managedSize).toBeGreaterThan(0);
  });
});
