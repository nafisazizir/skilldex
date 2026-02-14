import { join } from "node:path";
import { readConfig, writeConfig } from "./config.js";
import { TARGET_FILE } from "./constants.js";
import { safeReadFile, scanForSkills } from "./scanner.js";
import type { SyncResult } from "./types.js";
import { regenerateFromConfig } from "./writer.js";

export async function syncSkills(projectRoot: string): Promise<SyncResult> {
  const config = await readConfig(projectRoot);
  const onDisk = await scanForSkills(projectRoot);
  const diskNames = new Set(onDisk.map((s) => s.name));

  // Find stale entries: in config but not on disk
  const stale = config.skills.filter((s) => !diskNames.has(s.name));
  const removed = stale.map((s) => s.name);

  if (stale.length > 0) {
    const staleNames = new Set(removed);
    config.skills = config.skills.filter((s) => !staleNames.has(s.name));
    await writeConfig(projectRoot, config);
  }

  const agentsMdPath = join(projectRoot, TARGET_FILE);
  const before = await safeReadFile(agentsMdPath);

  // Nothing to do if no skills indexed and no AGENTS.md exists
  if (config.skills.length === 0 && before === undefined) {
    return { removed, changed: false, indexSize: 0, agentsMdPath };
  }

  const result = await regenerateFromConfig(projectRoot);

  const after = await safeReadFile(agentsMdPath);
  const changed = before !== after;

  return {
    removed,
    changed,
    indexSize: result.indexSize,
    agentsMdPath: result.agentsMdPath,
  };
}
