import { relative } from "node:path";
import { readConfig } from "./config.js";
import { scanForSkills } from "./scanner.js";
import type { ListResult, SkillInfo } from "./types.js";

export async function listSkills(projectRoot: string): Promise<ListResult> {
  const config = await readConfig(projectRoot);
  const allSkills = await scanForSkills(projectRoot);

  const indexedNames = new Set(config.skills.map((s) => s.name));
  const skillMap = new Map(allSkills.map((s) => [s.name, s]));

  const indexed: SkillInfo[] = config.skills
    .map((entry) => {
      const discovered = skillMap.get(entry.name);
      if (!discovered) return undefined;
      return {
        name: entry.name,
        path: relative(projectRoot, discovered.path),
        description: discovered.description,
      };
    })
    .filter((s) => s !== undefined);

  const available: SkillInfo[] = allSkills
    .filter((s) => !indexedNames.has(s.name))
    .map((s) => ({
      name: s.name,
      description: s.description,
      path: relative(projectRoot, s.path),
    }));

  return { indexed, available };
}
