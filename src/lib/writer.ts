import { stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readConfig } from "./config.js";
import { END_TAG, START_TAG, TARGET_FILE } from "./constants.js";
import { generateIndex } from "./indexer.js";
import { safeReadFile, scanForSkills } from "./scanner.js";
import type { InitResult } from "./types.js";

export { END_TAG, START_TAG };

export function buildManagedSection(indexContent: string): string {
  return `${START_TAG}\n${indexContent}\n${END_TAG}`;
}

/** Write or update the managed skilldex section in AGENTS.md. Creates, appends, or replaces as needed. */
export async function writeAgentsMd(projectRoot: string, indexContent: string): Promise<void> {
  const agentsMdPath = join(projectRoot, TARGET_FILE);
  const section = buildManagedSection(indexContent);

  const existing = await safeReadFile(agentsMdPath);

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

  await writeFile(agentsMdPath, output, "utf-8");
}

/** Regenerate AGENTS.md from config (reads config, scans indexed skills, writes AGENTS.md). */
export async function regenerateFromConfig(projectRoot: string): Promise<InitResult> {
  const config = await readConfig(projectRoot);
  const allSkills = await scanForSkills(projectRoot);

  // Map skill names from config to DiscoveredSkill objects
  const skillMap = new Map(allSkills.map((s) => [s.name, s]));
  const skills = config.skills
    .map((entry) => skillMap.get(entry.name))
    .filter((s) => s !== undefined);

  const index = generateIndex(skills, projectRoot);
  await writeAgentsMd(projectRoot, index);

  const agentsMdPath = join(projectRoot, TARGET_FILE);
  const statsResult = await stat(agentsMdPath);

  return {
    skillCount: skills.length,
    indexSize: statsResult.size,
    agentsMdPath,
  };
}
