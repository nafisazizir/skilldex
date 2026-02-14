import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { END_TAG, START_TAG } from "./constants.js";
import { safeReadFile } from "./scanner.js";

export { END_TAG, START_TAG };

export function buildManagedSection(indexContent: string): string {
  return `${START_TAG}\n${indexContent}\n${END_TAG}`;
}

/** Write or update the managed skilldex section in AGENTS.md. Creates, appends, or replaces as needed. */
export async function writeAgentsMd(projectRoot: string, indexContent: string): Promise<void> {
  const agentsMdPath = join(projectRoot, "AGENTS.md");
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
