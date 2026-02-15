import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readConfig, writeConfig } from "../src/lib/config.js";
import { END_TAG, SKILLS_DIR_SEGMENTS, START_TAG, TARGET_FILE } from "../src/lib/constants.js";
import { initWithSkills } from "../src/lib/init.js";
import { scanForSkills } from "../src/lib/scanner.js";
import { syncSkills } from "../src/lib/sync.js";
import { createSkill } from "./helpers.js";

describe("sync", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `skilldex-sync-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  async function setupIndexedSkill(
    name: string,
    description: string,
    files: string[],
  ): Promise<void> {
    await createSkill(testDir, name, description, files);
    const config = await readConfig(testDir);
    config.skills.push({ name, path: `.agents/skills/${name}` });
    await writeConfig(testDir, config);
  }

  it("returns no changes when index is already up to date", async () => {
    await setupIndexedSkill("my-skill", "A skill", ["guide.md"]);
    // Generate initial AGENTS.md
    await syncSkills(testDir);

    // Sync again — nothing changed
    const result = await syncSkills(testDir);

    expect(result.changed).toBe(false);
    expect(result.removed).toEqual([]);
    expect(result.managedSize).toBeGreaterThan(0);
    expect(result.targets.map((t) => t.path)).toEqual([join(testDir, TARGET_FILE)]);
  });

  it("detects changes after modifying a skill file", async () => {
    await setupIndexedSkill("my-skill", "A skill", ["guide.md"]);
    await syncSkills(testDir);

    // Modify the SKILL.md description
    const skillMdPath = join(testDir, ...SKILLS_DIR_SEGMENTS, "my-skill", "SKILL.md");
    await writeFile(skillMdPath, "---\ndescription: Updated description\n---\n");

    const result = await syncSkills(testDir);

    expect(result.changed).toBe(true);
    expect(result.removed).toEqual([]);
  });

  it("removes stale entries when skill directory is deleted", async () => {
    await setupIndexedSkill("keep-skill", "Kept", ["a.md"]);
    await setupIndexedSkill("stale-skill", "Stale", ["b.md"]);
    await syncSkills(testDir);

    // Delete the stale skill directory
    await rm(join(testDir, ...SKILLS_DIR_SEGMENTS, "stale-skill"), {
      recursive: true,
      force: true,
    });

    const result = await syncSkills(testDir);

    expect(result.removed).toEqual(["stale-skill"]);
    expect(result.changed).toBe(true);

    // Config should no longer contain the stale skill
    const config = await readConfig(testDir);
    expect(config.skills.map((s) => s.name)).toEqual(["keep-skill"]);
  });

  it("handles empty config with no skills indexed", async () => {
    const result = await syncSkills(testDir);

    expect(result.changed).toBe(false);
    expect(result.removed).toEqual([]);
  });

  it("detects changes after adding a new file to a skill", async () => {
    await setupIndexedSkill("my-skill", "A skill", ["guide.md"]);
    await syncSkills(testDir);

    // Add a new file
    await writeFile(
      join(testDir, ...SKILLS_DIR_SEGMENTS, "my-skill", "extra.md"),
      "# Extra content",
    );

    const result = await syncSkills(testDir);

    expect(result.changed).toBe(true);
  });

  it("detects changes after removing a file from a skill", async () => {
    await setupIndexedSkill("my-skill", "A skill", ["guide.md", "extra.md"]);
    await syncSkills(testDir);

    // Remove a file from the skill
    await rm(join(testDir, ...SKILLS_DIR_SEGMENTS, "my-skill", "extra.md"));

    const result = await syncSkills(testDir);

    expect(result.changed).toBe(true);
    expect(result.removed).toEqual([]);

    const agentsMd = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(agentsMd).toContain("|{guide.md}");
    expect(agentsMd).not.toContain("extra.md");
  });

  it("cleans multiple stale entries from config", async () => {
    await setupIndexedSkill("good", "Good skill", ["a.md"]);
    await setupIndexedSkill("stale-1", "Gone 1", ["b.md"]);
    await setupIndexedSkill("stale-2", "Gone 2", ["c.md"]);
    await syncSkills(testDir);

    await rm(join(testDir, ...SKILLS_DIR_SEGMENTS, "stale-1"), { recursive: true, force: true });
    await rm(join(testDir, ...SKILLS_DIR_SEGMENTS, "stale-2"), { recursive: true, force: true });

    const result = await syncSkills(testDir);

    expect(result.removed).toContain("stale-1");
    expect(result.removed).toContain("stale-2");
    expect(result.removed).toHaveLength(2);

    const config = await readConfig(testDir);
    expect(config.skills.map((s) => s.name)).toEqual(["good"]);
  });

  it("produces correct AGENTS.md content after sync", async () => {
    await setupIndexedSkill("alpha", "Alpha skill", ["docs.md"]);
    await setupIndexedSkill("beta", "Beta skill", ["guide.md"]);

    const result = await syncSkills(testDir);

    expect(result.changed).toBe(true);

    const agentsMd = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(agentsMd).toContain(START_TAG);
    expect(agentsMd).toContain(END_TAG);
    expect(agentsMd).toContain("[alpha]");
    expect(agentsMd).toContain("[beta]");
    expect(agentsMd).toContain("|desc:Alpha skill");
    expect(agentsMd).toContain("|desc:Beta skill");
  });

  it("returns correct SyncResult structure", async () => {
    await setupIndexedSkill("my-skill", "A skill", ["guide.md"]);

    const result = await syncSkills(testDir);

    expect(result).toHaveProperty("removed");
    expect(result).toHaveProperty("changed");
    expect(result).toHaveProperty("managedSize");
    expect(result).toHaveProperty("targets");
    expect(Array.isArray(result.removed)).toBe(true);
    expect(typeof result.changed).toBe("boolean");
    expect(typeof result.managedSize).toBe("number");
    expect(Array.isArray(result.targets)).toBe(true);
    expect(result.targets[0]).toHaveProperty("file");
    expect(result.targets[0]).toHaveProperty("path");
    expect(result.targets[0]).toHaveProperty("totalSize");
  });

  it("syncs using custom target files from config", async () => {
    await createSkill(testDir, "my-skill", "A skill", ["guide.md"]);

    // Init with custom target
    const skills = await scanForSkills(testDir);
    await initWithSkills(testDir, skills, ["CLAUDE.md"]);

    // Modify the skill
    const skillMdPath = join(testDir, ...SKILLS_DIR_SEGMENTS, "my-skill", "SKILL.md");
    await writeFile(skillMdPath, "---\ndescription: Updated description\n---\n");

    const result = await syncSkills(testDir);

    expect(result.changed).toBe(true);
    expect(result.targets.map((t) => t.path)).toEqual([join(testDir, "CLAUDE.md")]);

    const content = await readFile(join(testDir, "CLAUDE.md"), "utf-8");
    expect(content).toContain(START_TAG);
    expect(content).toContain("Updated description");
  });

  it("detects changes across multiple targets", async () => {
    await createSkill(testDir, "my-skill", "A skill", ["guide.md"]);

    // Init with multiple targets
    const skills = await scanForSkills(testDir);
    await initWithSkills(testDir, skills, ["AGENTS.md", "CLAUDE.md"]);

    // Modify the skill
    const skillMdPath = join(testDir, ...SKILLS_DIR_SEGMENTS, "my-skill", "SKILL.md");
    await writeFile(skillMdPath, "---\ndescription: Updated description\n---\n");

    const result = await syncSkills(testDir);

    expect(result.changed).toBe(true);
    expect(result.targets.map((t) => t.path)).toEqual([
      join(testDir, "AGENTS.md"),
      join(testDir, "CLAUDE.md"),
    ]);

    // Both files should have updated content
    for (const target of ["AGENTS.md", "CLAUDE.md"]) {
      const content = await readFile(join(testDir, target), "utf-8");
      expect(content).toContain("Updated description");
    }
  });
});
