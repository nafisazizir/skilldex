import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { START_TAG, TARGET_FILE } from "../src/lib/constants.js";
import { init } from "../src/lib/init.js";
import { createSkill } from "./helpers.js";

describe("init", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `skilldex-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("creates AGENTS.md with indexed skills (--yes mode)", async () => {
    await createSkill(testDir, "react-patterns", "React best practices", ["hooks.md", "state.md"]);
    await createSkill(testDir, "testing", "Testing guidelines", ["unit.md"]);

    const result = await init({ projectRoot: testDir, yes: true });

    expect(result.skillCount).toBe(2);
    expect(result.indexSize).toBeGreaterThan(0);
    expect(result.agentsMdPath).toBe(join(testDir, TARGET_FILE));

    const content = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(content).toContain(START_TAG);
    expect(content).toContain("[react-patterns]");
    expect(content).toContain("[testing]");
    expect(content).toContain("desc:React best practices");
    expect(content).toContain("desc:Testing guidelines");
  });

  it("filters to selected skills only", async () => {
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
    const result = await init({ projectRoot: testDir, yes: true });

    expect(result.skillCount).toBe(0);

    const content = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(content).toContain("[Skills Index]");
  });

  it("preserves existing AGENTS.md content", async () => {
    await writeFile(join(testDir, TARGET_FILE), "# My Project Config\n\nCustom content.\n");
    await createSkill(testDir, "my-skill", "A skill", ["docs.md"]);

    await init({ projectRoot: testDir, yes: true });

    const content = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(content).toContain("# My Project Config");
    expect(content).toContain("Custom content.");
    expect(content).toContain("[my-skill]");
  });
});
