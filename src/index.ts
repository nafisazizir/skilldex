// skilldex library entry point

export { END_TAG, START_TAG } from "./lib/constants.js";
export { parseFrontmatter } from "./lib/frontmatter.js";
export { generateIndex } from "./lib/indexer.js";
export { init, initWithSkills } from "./lib/init.js";
export { scanForSkills } from "./lib/scanner.js";
export type { DiscoveredSkill, InitResult, SkillFile } from "./lib/types.js";
export { buildManagedSection, writeAgentsMd } from "./lib/writer.js";
