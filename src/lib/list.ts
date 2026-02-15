import { readConfig } from "./config.js";
import { scanForSkills } from "./scanner.js";
import type { ListResult, SkillInfo } from "./types.js";

export async function listSkills(projectRoot: string): Promise<ListResult> {
  const config = await readConfig(projectRoot);
  const allSkills = await scanForSkills(projectRoot);

  const indexedPaths = new Set(config.skills.map((s) => s.path));
  const skillMap = new Map(allSkills.map((s) => [s.relativePath, s]));

  const indexed: SkillInfo[] = config.skills
    .map((entry) => {
      const discovered = skillMap.get(entry.path);
      if (!discovered) return undefined;
      return {
        name: entry.name,
        path: entry.path,
        description: discovered.description,
      };
    })
    .filter((s) => s !== undefined);

  const available: SkillInfo[] = allSkills
    .filter((s) => !indexedPaths.has(s.relativePath))
    .map((s) => ({
      name: s.name,
      description: s.description,
      path: s.relativePath,
    }));

  return { indexed, available };
}
