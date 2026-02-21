import { join } from "node:path";
import { readConfig, writeConfig } from "./config.js";
import { safeReadFile, scanForSkills } from "./scanner.js";
import type { SyncResult } from "./types.js";
import { regenerateFromConfig } from "./writer.js";

export async function syncSkills(projectRoot: string): Promise<SyncResult> {
  const config = await readConfig(projectRoot);
  const onDisk = await scanForSkills(projectRoot);
  const diskPaths = new Set(onDisk.map((s) => s.relativePath));

  // Find stale entries: in config but not on disk
  const stale = config.skills.filter((s) => !diskPaths.has(s.path));
  const removed = stale.map((s) => s.name);

  if (stale.length > 0) {
    const stalePaths = new Set(stale.map((s) => s.path));
    config.skills = config.skills.filter((s) => !stalePaths.has(s.path));
    await writeConfig(projectRoot, config);
  }

  const targetPaths = config.targets.map((t) => join(projectRoot, t));

  // Read before-state for all targets
  const beforeMap = new Map<string, string | undefined>();
  for (const targetPath of targetPaths) {
    beforeMap.set(targetPath, await safeReadFile(targetPath));
  }

  // Nothing to do if no skills indexed and no target files exist
  if (config.skills.length === 0 && [...beforeMap.values()].every((v) => v === undefined)) {
    return { removed, changed: false, managedSize: 0, targets: [] };
  }

  const result = await regenerateFromConfig(projectRoot);

  // Check if ANY target changed using the written content from regeneration
  let changed = false;
  for (const targetPath of targetPaths) {
    const after = result.writtenContent.get(targetPath);
    if (beforeMap.get(targetPath) !== after) {
      changed = true;
      break;
    }
  }

  return {
    removed,
    changed,
    managedSize: result.managedSize,
    targets: result.targets,
  };
}
