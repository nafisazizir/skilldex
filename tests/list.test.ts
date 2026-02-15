import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { addSkill } from "../src/lib/add.js";
import { SKILLS_DIR_SEGMENTS } from "../src/lib/constants.js";
import { listSkills } from "../src/lib/list.js";
import { createSkill } from "./helpers.js";

describe("listSkills", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `skilldex-list-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("returns empty arrays when no skills exist", async () => {
    const result = await listSkills(testDir);

    expect(result.indexed).toEqual([]);
    expect(result.available).toEqual([]);
  });

  it("returns indexed skills with correct info", async () => {
    await createSkill(testDir, "my-skill", "A skill", { "guide.md": "some content" });
    await addSkill(testDir, "my-skill");

    const result = await listSkills(testDir);

    expect(result.indexed).toHaveLength(1);
    expect(result.indexed[0].name).toBe("my-skill");
    expect(result.indexed[0].path).toBe(join(".agents", "skills", "my-skill"));
    expect(result.indexed[0].description).toBe("A skill");
  });

  it("lists available (not indexed) skills separately", async () => {
    await createSkill(testDir, "indexed-skill", "Indexed", { "a.md": "content" });
    await createSkill(testDir, "available-skill", "Available", { "b.md": "content" });
    await addSkill(testDir, "indexed-skill");

    const result = await listSkills(testDir);

    expect(result.indexed).toHaveLength(1);
    expect(result.indexed[0].name).toBe("indexed-skill");

    expect(result.available).toHaveLength(1);
    expect(result.available[0].name).toBe("available-skill");
    expect(result.available[0].description).toBe("Available");
    expect(result.available[0].path).toBe(join(".agents", "skills", "available-skill"));
  });

  it("handles multiple indexed and available skills together", async () => {
    await createSkill(testDir, "alpha", "First", { "a.md": "content-a" });
    await createSkill(testDir, "bravo", "Second", { "b.md": "content-b" });
    await createSkill(testDir, "charlie", "Third", { "c.md": "content-c" });

    await addSkill(testDir, "alpha");
    await addSkill(testDir, "charlie");

    const result = await listSkills(testDir);

    expect(result.indexed).toHaveLength(2);
    expect(result.indexed.map((s) => s.name)).toEqual(["alpha", "charlie"]);

    expect(result.available).toHaveLength(1);
    expect(result.available[0].name).toBe("bravo");
  });

  it("handles skills with no description", async () => {
    await createSkill(testDir, "no-desc", "", { "guide.md": "content" });
    await addSkill(testDir, "no-desc");

    const result = await listSkills(testDir);

    expect(result.indexed[0].description).toBe("");

    // Also check available with no description
    await createSkill(testDir, "no-desc-avail", "", { "other.md": "stuff" });
    const result2 = await listSkills(testDir);

    expect(result2.available.find((s) => s.name === "no-desc-avail")?.description).toBe("");
  });

  it("skips indexed skills whose directories were deleted", async () => {
    await createSkill(testDir, "exists", "Still here", { "a.md": "content" });
    await createSkill(testDir, "gone", "Will be removed", { "b.md": "content" });

    await addSkill(testDir, "exists");
    await addSkill(testDir, "gone");

    // Delete the skill directory but leave config entry
    await rm(join(testDir, ...SKILLS_DIR_SEGMENTS, "gone"), { recursive: true, force: true });

    const result = await listSkills(testDir);

    expect(result.indexed).toHaveLength(1);
    expect(result.indexed[0].name).toBe("exists");
  });
});
