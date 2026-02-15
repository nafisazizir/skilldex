import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readConfig, writeConfig } from "../src/lib/config.js";
import { CONFIG_FILENAME, TARGET_FILE } from "../src/lib/constants.js";
import type { Config } from "../src/lib/types.js";
import { useTempDir } from "./helpers.js";

describe("config", () => {
  const { getDir } = useTempDir();

  it("returns default config when file does not exist", async () => {
    const config = await readConfig(getDir());

    expect(config.version).toBe(1);
    expect(config.targets).toEqual(["AGENTS.md"]);
    expect(config.skills).toEqual([]);
  });

  it("reads existing config file", async () => {
    const testDir = getDir();
    const testConfig: Config = {
      version: 1,
      targets: [TARGET_FILE],
      skills: [
        { name: "react-patterns", path: ".agents/skills/react-patterns" },
        { name: "testing", path: ".agents/skills/testing" },
      ],
    };

    const configPath = join(testDir, CONFIG_FILENAME);
    await writeFile(configPath, JSON.stringify(testConfig), "utf-8");

    const config = await readConfig(testDir);

    expect(config.version).toBe(1);
    expect(config.targets).toEqual(["AGENTS.md"]);
    expect(config.skills).toHaveLength(2);
    expect(config.skills[0].name).toBe("react-patterns");
    expect(config.skills[1].name).toBe("testing");
  });

  it("writes config to file", async () => {
    const testDir = getDir();
    const testConfig: Config = {
      version: 1,
      targets: [TARGET_FILE],
      skills: [{ name: "my-skill", path: ".agents/skills/my-skill" }],
    };

    await writeConfig(testDir, testConfig);

    const content = await readFile(join(testDir, CONFIG_FILENAME), "utf-8");
    const parsed = JSON.parse(content) as Config;

    expect(parsed.version).toBe(1);
    expect(parsed.targets).toEqual([TARGET_FILE]);
    expect(parsed.skills).toHaveLength(1);
    expect(parsed.skills[0].name).toBe("my-skill");
  });

  it("returns default config on invalid JSON", async () => {
    const testDir = getDir();
    const configPath = join(testDir, CONFIG_FILENAME);
    await writeFile(configPath, "invalid json {", "utf-8");

    const config = await readConfig(testDir);

    expect(config.version).toBe(1);
    expect(config.targets).toEqual(["AGENTS.md"]);
    expect(config.skills).toEqual([]);
  });

  it("returns default config on malformed structure", async () => {
    const testDir = getDir();
    const configPath = join(testDir, CONFIG_FILENAME);
    await writeFile(configPath, JSON.stringify({ version: 1 }), "utf-8");

    const config = await readConfig(testDir);

    expect(config.version).toBe(1);
    expect(config.targets).toEqual(["AGENTS.md"]);
    expect(config.skills).toEqual([]);
  });

  it("preserves formatting when writing config", async () => {
    const testDir = getDir();
    const testConfig: Config = {
      version: 1,
      targets: [TARGET_FILE],
      skills: [
        { name: "skill-a", path: ".agents/skills/skill-a" },
        { name: "skill-b", path: ".agents/skills/skill-b" },
      ],
    };

    await writeConfig(testDir, testConfig);

    const content = await readFile(join(testDir, CONFIG_FILENAME), "utf-8");

    // Should be pretty-printed JSON (with indentation)
    expect(content).toContain("\n");
    expect(content).toContain("  ");
  });

  it("sorts skills alphabetically by name when writing", async () => {
    const testDir = getDir();
    const testConfig: Config = {
      version: 1,
      targets: [TARGET_FILE],
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

  it("sorts same-named skills by path as tiebreaker", async () => {
    const testDir = getDir();
    const testConfig: Config = {
      version: 1,
      targets: [TARGET_FILE],
      skills: [
        { name: "react", path: ".cursor/skills/react" },
        { name: "react", path: ".agents/skills/react" },
      ],
    };

    await writeConfig(testDir, testConfig);

    const readBack = await readConfig(testDir);
    expect(readBack.skills.map((s) => s.path)).toEqual([
      ".agents/skills/react",
      ".cursor/skills/react",
    ]);
  });

  it("can read config after multiple writes", async () => {
    const testDir = getDir();
    const config1: Config = {
      version: 1,
      targets: [TARGET_FILE],
      skills: [{ name: "skill-a", path: ".agents/skills/skill-a" }],
    };

    await writeConfig(testDir, config1);

    const config2: Config = {
      version: 1,
      targets: [TARGET_FILE],
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

  it("supports multiple targets in config", async () => {
    const testDir = getDir();
    const testConfig: Config = {
      version: 1,
      targets: ["AGENTS.md", "CLAUDE.md"],
      skills: [{ name: "my-skill", path: ".agents/skills/my-skill" }],
    };

    await writeConfig(testDir, testConfig);

    const readBack = await readConfig(testDir);
    expect(readBack.targets).toEqual(["AGENTS.md", "CLAUDE.md"]);
  });
});
