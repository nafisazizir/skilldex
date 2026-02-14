import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readConfig, writeConfig } from "../src/lib/config.js";
import type { Config } from "../src/lib/types.js";

describe("config", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `skilldex-config-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("returns default config when file does not exist", async () => {
    const config = await readConfig(testDir);

    expect(config.version).toBe(1);
    expect(config.target).toBe("AGENTS.md");
    expect(config.skills).toEqual([]);
  });

  it("reads existing config file", async () => {
    const testConfig: Config = {
      version: 1,
      target: "AGENTS.md",
      skills: [
        { name: "react-patterns", path: ".agents/skills/react-patterns" },
        { name: "testing", path: ".agents/skills/testing" },
      ],
    };

    const configPath = join(testDir, "skilldex.config.json");
    await writeFile(configPath, JSON.stringify(testConfig), "utf-8");

    const config = await readConfig(testDir);

    expect(config.version).toBe(1);
    expect(config.target).toBe("AGENTS.md");
    expect(config.skills).toHaveLength(2);
    expect(config.skills[0].name).toBe("react-patterns");
    expect(config.skills[1].name).toBe("testing");
  });

  it("writes config to file", async () => {
    const testConfig: Config = {
      version: 1,
      target: "AGENTS.md",
      skills: [{ name: "my-skill", path: ".agents/skills/my-skill" }],
    };

    await writeConfig(testDir, testConfig);

    const content = await readFile(join(testDir, "skilldex.config.json"), "utf-8");
    const parsed = JSON.parse(content) as Config;

    expect(parsed.version).toBe(1);
    expect(parsed.target).toBe("AGENTS.md");
    expect(parsed.skills).toHaveLength(1);
    expect(parsed.skills[0].name).toBe("my-skill");
  });

  it("returns default config on invalid JSON", async () => {
    const configPath = join(testDir, "skilldex.config.json");
    await writeFile(configPath, "invalid json {", "utf-8");

    const config = await readConfig(testDir);

    expect(config.version).toBe(1);
    expect(config.target).toBe("AGENTS.md");
    expect(config.skills).toEqual([]);
  });

  it("returns default config on malformed structure", async () => {
    const configPath = join(testDir, "skilldex.config.json");
    await writeFile(configPath, JSON.stringify({ version: 1 }), "utf-8");

    const config = await readConfig(testDir);

    expect(config.version).toBe(1);
    expect(config.target).toBe("AGENTS.md");
    expect(config.skills).toEqual([]);
  });

  it("preserves formatting when writing config", async () => {
    const testConfig: Config = {
      version: 1,
      target: "AGENTS.md",
      skills: [
        { name: "skill-a", path: ".agents/skills/skill-a" },
        { name: "skill-b", path: ".agents/skills/skill-b" },
      ],
    };

    await writeConfig(testDir, testConfig);

    const content = await readFile(join(testDir, "skilldex.config.json"), "utf-8");

    // Should be pretty-printed JSON (with indentation)
    expect(content).toContain("\n");
    expect(content).toContain("  ");
  });

  it("sorts skills alphabetically by name when writing", async () => {
    const testConfig: Config = {
      version: 1,
      target: "AGENTS.md",
      skills: [
        { name: "zulu", path: ".agents/skills/zulu" },
        { name: "alpha", path: ".agents/skills/alpha" },
        { name: "mike", path: ".agents/skills/mike" },
      ],
    };

    await writeConfig(testDir, testConfig);

    const readBack = await readConfig(testDir);
    expect(readBack.skills.map((s) => s.name)).toEqual(["alpha", "mike", "zulu"]);
  });

  it("can read config after multiple writes", async () => {
    const config1: Config = {
      version: 1,
      target: "AGENTS.md",
      skills: [{ name: "skill-a", path: ".agents/skills/skill-a" }],
    };

    await writeConfig(testDir, config1);

    const config2: Config = {
      version: 1,
      target: "AGENTS.md",
      skills: [
        { name: "skill-a", path: ".agents/skills/skill-a" },
        { name: "skill-b", path: ".agents/skills/skill-b" },
      ],
    };

    await writeConfig(testDir, config2);

    const readBack = await readConfig(testDir);

    expect(readBack.skills).toHaveLength(2);
    expect(readBack.skills.map((s) => s.name)).toEqual(["skill-a", "skill-b"]);
  });
});
