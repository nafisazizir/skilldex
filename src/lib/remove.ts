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

  const isPath = skillName.includes("/");

  let skillIndex: number;

  if (isPath) {
    skillIndex = config.skills.findIndex((s) => s.path === skillName);
    if (skillIndex === -1) {
      throw new Error(`Skill "${skillName}" is not indexed`);
    }
  } else {
    const matches = config.skills
      .map((s, i) => ({ entry: s, index: i }))
      .filter(({ entry }) => entry.name === skillName);

    if (matches.length === 0) {
      throw new Error(`Skill "${skillName}" is not indexed`);
    }
    if (matches.length > 1) {
      const paths = matches.map(({ entry }) => `  ${entry.path}`).join("\n");
      throw new Error(`Multiple skills named "${skillName}" indexed. Specify the path:\n${paths}`);
    }
    skillIndex = matches[0].index;
  }

  const entry = config.skills[skillIndex];
  const skillPath = join(projectRoot, entry.path);

  config.skills.splice(skillIndex, 1);
  await writeConfig(projectRoot, config);

  if (deleteFiles) {
    await rm(skillPath, { recursive: true, force: true });
  }

  const result = await regenerateFromConfig(projectRoot);

  return {
    skillName: entry.name,
    wasDeleted: deleteFiles,
    managedSize: result.managedSize,
    targets: result.targets,
  };
}
