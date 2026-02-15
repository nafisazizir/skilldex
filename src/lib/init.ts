import { stat } from "node:fs/promises";
import { basename, join, relative } from "node:path";
import { writeConfig } from "./config.js";
import { TARGET_FILE } from "./constants.js";
import { generateIndex } from "./indexer.js";
import { scanForSkills } from "./scanner.js";
import type { DiscoveredSkill, InitResult, TargetFileInfo } from "./types.js";
import { buildManagedSection, writeTargetFile } from "./writer.js";

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
    skills = discovered.filter((s) => selected.has(s.name));
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
  const index = generateIndex(skills, projectRoot);

  for (const target of targets) {
    await writeTargetFile(projectRoot, index, target);
  }

  // Update config file with indexed skills
  const config = {
    version: 1 as const,
    targets,
    skills: skills.map((skill) => ({
      name: skill.name,
      path: relative(projectRoot, skill.path),
    })),
  };
  await writeConfig(projectRoot, config);

  const managedSize = Buffer.byteLength(buildManagedSection(index));
  const targetInfos: TargetFileInfo[] = await Promise.all(
    targets.map(async (t) => {
      const p = join(projectRoot, t);
      const s = await stat(p);
      return { file: basename(t), path: p, totalSize: s.size };
    }),
  );

  return {
    skillCount: skills.length,
    managedSize,
    targets: targetInfos,
  };
}
