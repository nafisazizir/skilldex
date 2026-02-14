import { rm } from "node:fs/promises";
import { join } from "node:path";
import { readConfig, writeConfig } from "./config.js";
import type { RemoveResult } from "./types.js";
import { regenerateFromConfig } from "./writer.js";

export async function removeSkill(
  projectRoot: string,
  skillName: string,
  deleteFiles = false,
): Promise<RemoveResult> {
  const config = await readConfig(projectRoot);

  const skillIndex = config.skills.findIndex((s) => s.name === skillName);
  if (skillIndex === -1) {
    throw new Error(`Skill "${skillName}" is not indexed`);
  }

  const skillPath = join(projectRoot, config.skills[skillIndex].path);

  config.skills.splice(skillIndex, 1);
  await writeConfig(projectRoot, config);

  if (deleteFiles) {
    await rm(skillPath, { recursive: true, force: true });
  }

  const result = await regenerateFromConfig(projectRoot);

  return {
    skillName,
    wasDeleted: deleteFiles,
    indexSize: result.indexSize,
    agentsMdPath: result.agentsMdPath,
  };
}
