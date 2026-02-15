import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { END_TAG, START_TAG, TARGET_FILE } from "../src/lib/constants.js";
import { buildManagedSection, writeTargetFile } from "../src/lib/writer.js";

describe("buildManagedSection", () => {
  it("wraps content in start and end tags", () => {
    const result = buildManagedSection("index content");
    expect(result).toBe(`${START_TAG}\nindex content\n${END_TAG}`);
  });
});

describe("writeTargetFile", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `skilldex-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("creates new AGENTS.md when file does not exist", async () => {
    await writeTargetFile(testDir, "test index");

    const content = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(content).toContain(START_TAG);
    expect(content).toContain("test index");
    expect(content).toContain(END_TAG);
  });

  it("appends managed section to existing AGENTS.md without tags", async () => {
    await writeFile(join(testDir, TARGET_FILE), "# Existing Content\n\nSome text here.", "utf-8");

    await writeTargetFile(testDir, "new index");

    const content = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(content).toContain("# Existing Content");
    expect(content).toContain("Some text here.");
    expect(content).toContain(START_TAG);
    expect(content).toContain("new index");
    expect(content).toContain(END_TAG);

    // Existing content comes before managed section
    const existingPos = content.indexOf("# Existing Content");
    const tagPos = content.indexOf(START_TAG);
    expect(existingPos).toBeLessThan(tagPos);
  });

  it("replaces content between existing tags", async () => {
    const existing = `# My Project

${START_TAG}
old index content
${END_TAG}

# Footer`;
    await writeFile(join(testDir, TARGET_FILE), existing, "utf-8");

    await writeTargetFile(testDir, "updated index");

    const content = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(content).toContain("# My Project");
    expect(content).toContain("updated index");
    expect(content).toContain("# Footer");
    expect(content).not.toContain("old index content");
  });

  it("preserves surrounding content when replacing tags", async () => {
    const existing = `Before section
${START_TAG}
old
${END_TAG}
After section`;
    await writeFile(join(testDir, TARGET_FILE), existing, "utf-8");

    await writeTargetFile(testDir, "new");

    const content = await readFile(join(testDir, TARGET_FILE), "utf-8");
    expect(content).toContain("Before section");
    expect(content).toContain("After section");
    expect(content).toContain("new");
  });

  it("writes to custom target file", async () => {
    await writeTargetFile(testDir, "custom index", "CLAUDE.md");

    const content = await readFile(join(testDir, "CLAUDE.md"), "utf-8");
    expect(content).toContain(START_TAG);
    expect(content).toContain("custom index");
    expect(content).toContain(END_TAG);
  });

  it("writes to multiple targets when called in a loop", async () => {
    const targets = ["AGENTS.md", "CLAUDE.md"];
    for (const target of targets) {
      await writeTargetFile(testDir, "shared index", target);
    }

    for (const target of targets) {
      const content = await readFile(join(testDir, target), "utf-8");
      expect(content).toContain(START_TAG);
      expect(content).toContain("shared index");
      expect(content).toContain(END_TAG);
    }
  });
});
