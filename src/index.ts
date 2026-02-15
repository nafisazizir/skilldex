// skilldex library entry point

export { addSkill } from "./lib/add.js";
export type { AgentSource } from "./lib/agents.js";
export { AGENT_SOURCES, getUniqueSkillsDirs } from "./lib/agents.js";
export { readConfig, writeConfig } from "./lib/config.js";
export {
  CONFIG_FILENAME,
  CONTEXT_BUDGET_DANGER_KB,
  CONTEXT_BUDGET_WARN_KB,
  compareByNameThenPath,
  END_TAG,
  INDEX_HEADER,
  INDEX_INSTRUCTION,
  SKILL_META_FILE,
  START_TAG,
  TARGET_FILE,
} from "./lib/constants.js";
export { generateIndex } from "./lib/indexer.js";
export { init, initWithSkills } from "./lib/init.js";
export { listSkills } from "./lib/list.js";
export { removeSkill } from "./lib/remove.js";
export { scanForSkills } from "./lib/scanner.js";
export { syncSkills } from "./lib/sync.js";
export type {
  AddResult,
  Config,
  DiscoveredSkill,
  InitResult,
  ListResult,
  RemoveResult,
  SkillEntry,
  SkillFile,
  SkillInfo,
  SyncResult,
  TargetFileInfo,
} from "./lib/types.js";
export type { RegenerateResult } from "./lib/writer.js";
export { buildManagedSection, regenerateFromConfig, writeTargetFile } from "./lib/writer.js";
