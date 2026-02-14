import { stat } from "node:fs/promises";
import { join } from "node:path";
import { readConfig, writeConfig } from "./config.js";
import { generateIndex } from "./indexer.js";
import { scanForSkills } from "./scanner.js";
import type { AddResult } from "./types.js";
import { writeAgentsMd } from "./writer.js";

export async function addSkill(projectRoot: string, skillName: string): Promise<AddResult> {
  // Load existing config
  const config = await readConfig(projectRoot);

  // Check if skill already exists in config
  if (config.skills.some((s) => s.name === skillName)) {
    throw new Error(`Skill "${skillName}" is already indexed`);
  }

  // Scan all available skills to find the target skill
  const allSkills = await scanForSkills(projectRoot);
  const targetSkill = allSkills.find((s) => s.name === skillName);

  if (!targetSkill) {
    throw new Error(
      `Skill "${skillName}" not found in .agents/skills/. Did you create the skill directory?`,
    );
  }

  // Add skill to config
  const skillPath = join(".agents", "skills", skillName);
  config.skills.push({
    name: skillName,
    path: skillPath,
  });

  // Write updated config
  await writeConfig(projectRoot, config);

  // Regenerate AGENTS.md with all indexed skills
  const skillMap = new Map(allSkills.map((s) => [s.name, s]));
  const indexedSkills = config.skills
    .map((entry) => skillMap.get(entry.name))
    .filter((s) => s !== undefined);

  const index = generateIndex(indexedSkills, projectRoot);
  await writeAgentsMd(projectRoot, index);

  const agentsMdPath = join(projectRoot, "AGENTS.md");
  const statsResult = await stat(agentsMdPath);

  return {
    skillName,
    indexSize: statsResult.size,
    agentsMdPath,
  };
}
