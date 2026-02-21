import { writeConfig } from "./config.js";
import { TARGET_FILE } from "./constants.js";
import { scanForSkills } from "./scanner.js";
import type { DiscoveredSkill, InitResult } from "./types.js";
import { regenerateFromConfig } from "./writer.js";

/** Scan for skills, filter by selection, and write the index to target files. */
export async function init(options: {
  projectRoot: string;
  selectedSkills?: string[];
  yes?: boolean;
}): Promise<InitResult> {
  const { projectRoot, selectedSkills } = options;

  const discovered = await scanForSkills(projectRoot);

  let skills: DiscoveredSkill[];
  if (selectedSkills) {
    const selected = new Set(selectedSkills);
    skills = discovered.filter((s) => selected.has(s.name) || selected.has(s.relativePath));
  } else {
    skills = discovered;
  }

  return initWithSkills(projectRoot, skills);
}

/** Index a specific set of skills and write to target file(s). */
export async function initWithSkills(
  projectRoot: string,
  skills: DiscoveredSkill[],
  targets: string[] = [TARGET_FILE],
): Promise<InitResult> {
  const config = {
    version: 1 as const,
    targets,
    skills: skills.map((skill) => ({
      name: skill.name,
      path: skill.relativePath,
    })),
  };
  await writeConfig(projectRoot, config);

  return regenerateFromConfig(projectRoot);
}
