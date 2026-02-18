import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readConfig } from "../src/lib/config.js";
import { TARGET_FILE } from "../src/lib/constants.js";
import { updateSkill } from "../src/lib/update.js";
import { createSkill, useTempDir } from "./helpers.js";

describe("update", () => {
  const { getDir } = useTempDir();

  it("updates a single indexed skill by path", async () => {
    const testDir = getDir();
    await createSkill(testDir, "react-patterns", "React best practices", ["hooks.md"]);

    // Bootstrap: add skill to config by writing it directly
    await writeFile(
      join(testDir, "skilldex.config.json"),
      JSON.stringify({
        version: 1,
        targets: [TARGET_FILE],
        skills: [{ name: "react-patterns", path: ".agents/skills/react-patterns" }],
      }),
    );

    const result = await updateSkill(testDir, [".agents/skills/react-patterns"]);

    expect(result.updated).toEqual(["react-patterns"]);
    expect(result.managedSize).toBeGreaterThan(0);
    expect(result.targets.length).toBeGreaterThan(0);

    const agentsMd = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(agentsMd).toContain("[react-patterns]");
  });

  it("updates multiple indexed skills by path", async () => {
    const testDir = getDir();
    await createSkill(testDir, "skill-a", "First skill", ["guide.md"]);
    await createSkill(testDir, "skill-b", "Second skill", ["docs.md"]);

    await writeFile(
      join(testDir, "skilldex.config.json"),
      JSON.stringify({
        version: 1,
        targets: [TARGET_FILE],
        skills: [
          { name: "skill-a", path: ".agents/skills/skill-a" },
          { name: "skill-b", path: ".agents/skills/skill-b" },
        ],
      }),
    );

    const result = await updateSkill(testDir, [".agents/skills/skill-a", ".agents/skills/skill-b"]);

    expect(result.updated).toEqual(["skill-a", "skill-b"]);
    expect(result.managedSize).toBeGreaterThan(0);

    const agentsMd = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(agentsMd).toContain("[skill-a]");
    expect(agentsMd).toContain("[skill-b]");
  });

  it("picks up changes to SKILL.md description on update", async () => {
    const testDir = getDir();
    await createSkill(testDir, "my-skill", "Original description", ["guide.md"]);

    await writeFile(
      join(testDir, "skilldex.config.json"),
      JSON.stringify({
        version: 1,
        targets: [TARGET_FILE],
        skills: [{ name: "my-skill", path: ".agents/skills/my-skill" }],
      }),
    );

    // First update — original description
    await updateSkill(testDir, [".agents/skills/my-skill"]);
    const before = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(before).toContain("|desc:Original description");

    // Change the description on disk
    await writeFile(
      join(testDir, ".agents/skills/my-skill/SKILL.md"),
      "---\ndescription: Updated description\n---\n",
    );

    // Second update — picks up the new description
    await updateSkill(testDir, [".agents/skills/my-skill"]);
    const after = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(after).toContain("|desc:Updated description");
    expect(after).not.toContain("|desc:Original description");
  });

  it("picks up new files added to skill directory on update", async () => {
    const testDir = getDir();
    await createSkill(testDir, "my-skill", "A skill", ["guide.md"]);

    await writeFile(
      join(testDir, "skilldex.config.json"),
      JSON.stringify({
        version: 1,
        targets: [TARGET_FILE],
        skills: [{ name: "my-skill", path: ".agents/skills/my-skill" }],
      }),
    );

    await updateSkill(testDir, [".agents/skills/my-skill"]);
    const before = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(before).toContain("{guide.md}");
    expect(before).not.toContain("newfile.md");

    // Add a new file to the skill directory
    await writeFile(join(testDir, ".agents/skills/my-skill/newfile.md"), "# New File");

    await updateSkill(testDir, [".agents/skills/my-skill"]);
    const after = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(after).toContain("newfile.md");
  });

  it("does not modify the config when updating", async () => {
    const testDir = getDir();
    await createSkill(testDir, "stable-skill", "Stable", ["file.md"]);

    const initialConfig = {
      version: 1,
      targets: [TARGET_FILE],
      skills: [{ name: "stable-skill", path: ".agents/skills/stable-skill" }],
    };
    await writeFile(join(testDir, "skilldex.config.json"), JSON.stringify(initialConfig));

    await updateSkill(testDir, [".agents/skills/stable-skill"]);

    const config = await readConfig(testDir);
    expect(config.skills).toHaveLength(1);
    expect(config.skills[0].name).toBe("stable-skill");
    expect(config.skills[0].path).toBe(".agents/skills/stable-skill");
  });

  it("throws when skill path is not indexed", async () => {
    const testDir = getDir();
    await createSkill(testDir, "unindexed-skill", "A skill", ["file.md"]);

    // Config does NOT include unindexed-skill
    await writeFile(
      join(testDir, "skilldex.config.json"),
      JSON.stringify({ version: 1, targets: [TARGET_FILE], skills: [] }),
    );

    await expect(updateSkill(testDir, [".agents/skills/unindexed-skill"])).rejects.toThrow(
      'Skill ".agents/skills/unindexed-skill" is not indexed',
    );
  });

  it("throws when one of multiple paths is not indexed", async () => {
    const testDir = getDir();
    await createSkill(testDir, "skill-a", "First", ["a.md"]);
    await createSkill(testDir, "skill-b", "Second", ["b.md"]);

    await writeFile(
      join(testDir, "skilldex.config.json"),
      JSON.stringify({
        version: 1,
        targets: [TARGET_FILE],
        skills: [{ name: "skill-a", path: ".agents/skills/skill-a" }],
      }),
    );

    await expect(
      updateSkill(testDir, [".agents/skills/skill-a", ".agents/skills/skill-b"]),
    ).rejects.toThrow('Skill ".agents/skills/skill-b" is not indexed');
  });

  it("throws when skill is indexed but missing from disk (stale)", async () => {
    const testDir = getDir();

    // Config says skill is indexed, but the directory was never created
    await writeFile(
      join(testDir, "skilldex.config.json"),
      JSON.stringify({
        version: 1,
        targets: [TARGET_FILE],
        skills: [{ name: "ghost-skill", path: ".agents/skills/ghost-skill" }],
      }),
    );

    await expect(updateSkill(testDir, [".agents/skills/ghost-skill"])).rejects.toThrow(
      "Skill \".agents/skills/ghost-skill\" not found on disk. Run 'skilldex sync' to remove stale entries.",
    );
  });

  it("writes to all configured target files on update", async () => {
    const testDir = getDir();
    await createSkill(testDir, "my-skill", "Multi-target skill", ["file.md"]);

    await writeFile(
      join(testDir, "skilldex.config.json"),
      JSON.stringify({
        version: 1,
        targets: ["AGENTS.md", "CLAUDE.md"],
        skills: [{ name: "my-skill", path: ".agents/skills/my-skill" }],
      }),
    );

    const result = await updateSkill(testDir, [".agents/skills/my-skill"]);

    expect(result.targets).toHaveLength(2);

    const agentsMd = await readFile(join(testDir, "AGENTS.md"), "utf-8");
    const claudeMd = await readFile(join(testDir, "CLAUDE.md"), "utf-8");
    expect(agentsMd).toContain("[my-skill]");
    expect(claudeMd).toContain("[my-skill]");
  });

  it("supports updating skills from agent-specific directories", async () => {
    const testDir = getDir();
    await createSkill(testDir, "cursor-skill", "Cursor skill", ["guide.md"], [".cursor", "skills"]);

    await writeFile(
      join(testDir, "skilldex.config.json"),
      JSON.stringify({
        version: 1,
        targets: [TARGET_FILE],
        skills: [{ name: "cursor-skill", path: ".cursor/skills/cursor-skill" }],
      }),
    );

    const result = await updateSkill(testDir, [".cursor/skills/cursor-skill"]);

    expect(result.updated).toEqual(["cursor-skill"]);

    const agentsMd = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(agentsMd).toContain("[cursor-skill]");
  });
});
