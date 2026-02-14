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
  /** .md files in the skill (excluding SKILL.md) */
  files: SkillFile[];
}

export interface InitResult {
  skillCount: number;
  /** Size of AGENTS.md in bytes */
  indexSize: number;
  /** Absolute path to the written AGENTS.md */
  agentsMdPath: string;
}

export interface SkillEntry {
  /** Skill name (e.g., "react-best-practices") */
  name: string;
  /** Relative path from project root (e.g., ".agents/skills/react-best-practices") */
  path: string;
}

export interface Config {
  version: 1;
  /** Which file to write to (e.g., "AGENTS.md") */
  target: string;
  /** List of indexed skills */
  skills: SkillEntry[];
}

export interface AddResult {
  skillName: string;
  indexSize: number;
  agentsMdPath: string;
}
