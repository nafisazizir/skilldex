import { stat, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { readConfig } from "./config.js";
import { END_TAG, START_TAG, TARGET_FILE } from "./constants.js";
import { generateIndex } from "./indexer.js";
import { safeReadFile, scanForSkills } from "./scanner.js";
import type { InitResult, TargetFileInfo } from "./types.js";

export async function getTargetInfos(
  projectRoot: string,
  targets: string[],
): Promise<TargetFileInfo[]> {
  return Promise.all(
    targets.map(async (t) => {
      const p = join(projectRoot, t);
      const s = await stat(p);
      return { file: basename(t), path: p, totalSize: s.size };
    }),
  );
}

export function buildManagedSection(indexContent: string): string {
  return `${START_TAG}\n${indexContent}\n${END_TAG}`;
}

/** Write or update the managed skilldex section in a target file. Creates, appends, or replaces as needed. Returns the written file content. */
export async function writeTargetFile(
  projectRoot: string,
  indexContent: string,
  targetFile: string = TARGET_FILE,
): Promise<string> {
  const targetPath = join(projectRoot, targetFile);
  const section = buildManagedSection(indexContent);

  const existing = await safeReadFile(targetPath);

  let output: string;
  if (existing === undefined) {
    output = `${section}\n`;
  } else if (existing.includes(START_TAG) && existing.includes(END_TAG)) {
    const startIdx = existing.indexOf(START_TAG);
    const endIdx = existing.indexOf(END_TAG) + END_TAG.length;
    output = existing.slice(0, startIdx) + section + existing.slice(endIdx);
  } else {
    output = `${existing.trimEnd()}\n\n${section}\n`;
  }

  await writeFile(targetPath, output, "utf-8");
  return output;
}

export interface RegenerateResult extends InitResult {
  /** Map of target file path → written content */
  writtenContent: Map<string, string>;
}

/** Regenerate all target files from config (reads config, scans indexed skills, writes targets). */
export async function regenerateFromConfig(projectRoot: string): Promise<RegenerateResult> {
  const config = await readConfig(projectRoot);
  const allSkills = await scanForSkills(projectRoot);

  // Map skill paths from config to DiscoveredSkill objects
  const skillMap = new Map(allSkills.map((s) => [s.relativePath, s]));
  const skills = config.skills
    .map((entry) => skillMap.get(entry.path))
    .filter((s) => s !== undefined);

  const index = generateIndex(skills);

  const writtenContent = new Map<string, string>();
  for (const target of config.targets) {
    const content = await writeTargetFile(projectRoot, index, target);
    writtenContent.set(join(projectRoot, target), content);
  }

  const managedSize = Buffer.byteLength(buildManagedSection(index));
  const targets = await getTargetInfos(projectRoot, config.targets);

  return {
    skillCount: skills.length,
    managedSize,
    targets,
    writtenContent,
  };
}
