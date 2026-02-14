export const START_TAG = "<!-- skilldex:start (auto-generated, do not edit) -->";
export const END_TAG = "<!-- skilldex:end -->";

export const TARGET_FILE = "AGENTS.md";
export const CONFIG_FILENAME = "skilldex.config.json";
export const SKILL_META_FILE = "SKILL.md";
export const SKILLS_DIR_SEGMENTS = [".agents", "skills"] as const;
export const INDEX_HEADER = "[Skills Index]";
export const INDEX_INSTRUCTION =
  "IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any tasks covered by indexed skills.";
export const CONTEXT_BUDGET_WARN_KB = 20;
export const CONTEXT_BUDGET_DANGER_KB = 40;
