// skilldex library entry point

export { addSkill } from "./lib/add.js";
export { readConfig, writeConfig } from "./lib/config.js";
export { END_TAG, START_TAG } from "./lib/constants.js";
export { parseFrontmatter } from "./lib/frontmatter.js";
export { generateIndex } from "./lib/indexer.js";
export { init, initWithSkills } from "./lib/init.js";
export { scanForSkills } from "./lib/scanner.js";
export type {
  AddResult,
  Config,
  DiscoveredSkill,
  InitResult,
  SkillEntry,
  SkillFile,
} from "./lib/types.js";
export { buildManagedSection, regenerateFromConfig, writeAgentsMd } from "./lib/writer.js";
