import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CONFIG_FILENAME, compareByNameThenPath, TARGET_FILE } from "./constants.js";
import { safeReadFile } from "./scanner.js";
import type { Config } from "./types.js";

function getDefaultConfig(): Config {
  return {
    version: 1,
    targets: [TARGET_FILE],
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
      !Array.isArray(parsed.targets) ||
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
  const sorted = {
    ...config,
    skills: [...config.skills].sort(compareByNameThenPath),
  };
  const content = JSON.stringify(sorted, null, 2);
  await writeFile(configPath, content, "utf-8");
}
