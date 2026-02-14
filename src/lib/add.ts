import { join } from "node:path";
import { readConfig, writeConfig } from "./config.js";
import { SKILLS_DIR_SEGMENTS } from "./constants.js";
import { scanForSkills } from "./scanner.js";
import type { AddResult } from "./types.js";
import { regenerateFromConfig } from "./writer.js";

export async function addSkill(projectRoot: string, skillName: string): Promise<AddResult> {
  const config = await readConfig(projectRoot);

  if (config.skills.some((s) => s.name === skillName)) {
    throw new Error(`Skill "${skillName}" is already indexed`);
  }

  const allSkills = await scanForSkills(projectRoot);
  const targetSkill = allSkills.find((s) => s.name === skillName);

  if (!targetSkill) {
    throw new Error(
      `Skill "${skillName}" not found in .agents/skills/. Did you create the skill directory?`,
    );
  }

  config.skills.push({
    name: skillName,
    path: join(...SKILLS_DIR_SEGMENTS, skillName),
  });

  await writeConfig(projectRoot, config);

  const result = await regenerateFromConfig(projectRoot);

  return {
    skillName,
    indexSize: result.indexSize,
    agentsMdPath: result.agentsMdPath,
  };
}
