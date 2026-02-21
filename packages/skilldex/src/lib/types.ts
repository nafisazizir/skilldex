export interface SkillFile {
  /** Relative path within the skill directory, e.g. "patterns/hooks.md" */
  relativePath: string;
  /** Filename without extension, e.g. "hooks" */
  name: string;
}

export interface DiscoveredSkill {
  /** Directory name, e.g. "react-best-practices" */
  name: string;
  /** From SKILL.md frontmatter description field; empty string if not found */
  description: string;
  /** Absolute path to skill directory */
  path: string;
  /** Relative path from project root, e.g. ".agents/skills/react-best-practices" */
  relativePath: string;
  /** .md files in the skill (excluding SKILL.md) */
  files: SkillFile[];
}

export interface TargetFileInfo {
  /** Target filename (e.g. "AGENTS.md") */
  file: string;
  /** Absolute path */
  path: string;
  /** Total file size in bytes */
  totalSize: number;
}

export interface InitResult {
  skillCount: number;
  /** Size of the managed section in bytes */
  managedSize: number;
  /** Per-target file details */
  targets: TargetFileInfo[];
}

export interface SkillEntry {
  /** Skill name (e.g., "react-best-practices") */
  name: string;
  /** Relative path from project root (e.g., ".agents/skills/react-best-practices") */
  path: string;
}

export interface Config {
  version: 1;
  /** Which files to write the index to (e.g., ["AGENTS.md", "CLAUDE.md"]) */
  targets: string[];
  /** List of indexed skills */
  skills: SkillEntry[];
}

export interface AddResult {
  skillName: string;
  managedSize: number;
  targets: TargetFileInfo[];
}

export interface RemoveResult {
  skillName: string;
  /** true if skill files were deleted from disk */
  wasDeleted: boolean;
  managedSize: number;
  targets: TargetFileInfo[];
}

export interface SkillInfo {
  name: string;
  /** Relative path from project root */
  path: string;
  description: string;
  /** true when the skill is indexed but its directory no longer exists on disk */
  missing?: boolean;
}

export interface ListResult {
  indexed: SkillInfo[];
  available: SkillInfo[];
}

export interface SyncResult {
  /** Skills that were in config but missing from disk (removed) */
  removed: string[];
  /** Whether any target file content actually changed after regeneration */
  changed: boolean;
  managedSize: number;
  targets: TargetFileInfo[];
}

export interface UpdateResult {
  /** Display names of the skills that were updated */
  updated: string[];
  managedSize: number;
  targets: TargetFileInfo[];
}
