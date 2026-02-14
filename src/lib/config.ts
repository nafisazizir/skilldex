import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { safeReadFile } from "./scanner.js";
import type { Config } from "./types.js";

const CONFIG_FILENAME = "skilldex.config.json";

function getDefaultConfig(): Config {
  return {
    version: 1,
    target: "AGENTS.md",
    skills: [],
  };
}

export async function readConfig(projectRoot: string): Promise<Config> {
  const configPath = join(projectRoot, CONFIG_FILENAME);
  const content = await safeReadFile(configPath);

  if (content === undefined) {
    return getDefaultConfig();
  }

  try {
    const parsed = JSON.parse(content) as Config;
    // Validate structure
    if (
      typeof parsed.version !== "number" ||
      typeof parsed.target !== "string" ||
      !Array.isArray(parsed.skills)
    ) {
      return getDefaultConfig();
    }
    return parsed;
  } catch {
    return getDefaultConfig();
  }
}

export async function writeConfig(projectRoot: string, config: Config): Promise<void> {
  const configPath = join(projectRoot, CONFIG_FILENAME);
  const content = JSON.stringify(config, null, 2);
  await writeFile(configPath, content, "utf-8");
}
