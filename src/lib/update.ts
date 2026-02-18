import { access } from "node:fs/promises";
import { join } from "node:path";
import { readConfig } from "./config.js";
import type { UpdateResult } from "./types.js";
import { regenerateFromConfig } from "./writer.js";

export async function updateSkill(
  projectRoot: string,
  skillPaths: string[],
): Promise<UpdateResult> {
  const config = await readConfig(projectRoot);
  const configPathMap = new Map(config.skills.map((s) => [s.path, s.name]));

  // Validate all requested paths are indexed
  for (const skillPath of skillPaths) {
    if (!configPathMap.has(skillPath)) {
      throw new Error(
        `Skill "${skillPath}" is not indexed. Run 'skilldex add ${skillPath}' to index it.`,
      );
    }
  }

  // Validate all exist on disk
  for (const skillPath of skillPaths) {
    const absolutePath = join(projectRoot, skillPath);
    try {
      await access(absolutePath);
    } catch {
      throw new Error(
        `Skill "${skillPath}" not found on disk. Run 'skilldex sync' to remove stale entries.`,
      );
    }
  }

  const updated = skillPaths.map((p) => configPathMap.get(p) as string);

  const result = await regenerateFromConfig(projectRoot);

  return {
    updated,
    managedSize: result.managedSize,
    targets: result.targets,
  };
}
