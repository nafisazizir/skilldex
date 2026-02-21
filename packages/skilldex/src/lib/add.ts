import { readConfig, writeConfig } from "./config.js";
import { scanForSkills } from "./scanner.js";
import type { AddResult, DiscoveredSkill } from "./types.js";
import { regenerateFromConfig } from "./writer.js";

export async function addSkill(projectRoot: string, skillName: string): Promise<AddResult> {
  const config = await readConfig(projectRoot);
  const allSkills = await scanForSkills(projectRoot);

  const isPath = skillName.includes("/");

  let targetSkill: DiscoveredSkill | undefined;

  if (isPath) {
    // Path-based lookup for disambiguation
    targetSkill = allSkills.find((s) => s.relativePath === skillName);
    if (!targetSkill) {
      throw new Error(`Skill "${skillName}" not found. Did you create the skill directory?`);
    }
  } else {
    // Name-based lookup
    const matches = allSkills.filter((s) => s.name === skillName);
    if (matches.length === 0) {
      throw new Error(`Skill "${skillName}" not found. Did you create the skill directory?`);
    }
    if (matches.length > 1) {
      const paths = matches.map((s) => `  ${s.relativePath}`).join("\n");
      throw new Error(`Multiple skills named "${skillName}" found. Specify the path:\n${paths}`);
    }
    targetSkill = matches[0];
  }

  if (config.skills.some((s) => s.path === targetSkill.relativePath)) {
    throw new Error(`Skill "${targetSkill.relativePath}" is already indexed`);
  }

  config.skills.push({
    name: targetSkill.name,
    path: targetSkill.relativePath,
  });

  await writeConfig(projectRoot, config);

  const result = await regenerateFromConfig(projectRoot);

  return {
    skillName: targetSkill.name,
    managedSize: result.managedSize,
    targets: result.targets,
  };
}
