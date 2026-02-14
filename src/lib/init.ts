import { stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { writeConfig } from "./config.js";
import { generateIndex } from "./indexer.js";
import { scanForSkills } from "./scanner.js";
import type { DiscoveredSkill, InitResult } from "./types.js";
import { writeAgentsMd } from "./writer.js";

/** Scan for skills, filter by selection, and write the index to AGENTS.md. */
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
    skills = discovered.filter((s) => selected.has(s.name));
  } else {
    skills = discovered;
  }

  return initWithSkills(projectRoot, skills);
}

/** Index a specific set of skills and write AGENTS.md. */
export async function initWithSkills(
  projectRoot: string,
  skills: DiscoveredSkill[],
): Promise<InitResult> {
  const index = generateIndex(skills, projectRoot);
  await writeAgentsMd(projectRoot, index);

  // Update config file with indexed skills
  const config = {
    version: 1 as const,
    target: "AGENTS.md",
    skills: skills.map((skill) => ({
      name: skill.name,
      path: relative(projectRoot, skill.path),
    })),
  };
  await writeConfig(projectRoot, config);

  const agentsMdPath = join(projectRoot, "AGENTS.md");
  const stats = await stat(agentsMdPath);

  return {
    skillCount: skills.length,
    indexSize: stats.size,
    agentsMdPath,
  };
}
