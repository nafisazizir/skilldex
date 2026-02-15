export interface AgentSource {
  /** Agent identifier, e.g. "claude-code" */
  name: string;
  /** Human-readable name, e.g. "Claude Code" */
  displayName: string;
  /** Skills directory relative to project root, e.g. ".claude/skills" */
  skillsDir: string;
}

/**
 * Known agent source directories (project-scoped).
 * Sourced from the Vercel Skills CLI agent conventions.
 */
export const AGENT_SOURCES: AgentSource[] = [
  { name: "universal", displayName: "Universal", skillsDir: ".agents/skills" },
  { name: "antigravity", displayName: "Antigravity", skillsDir: ".agent/skills" },
  { name: "claude-code", displayName: "Claude Code", skillsDir: ".claude/skills" },
  { name: "codex", displayName: "Codex", skillsDir: ".agents/skills" },
  { name: "cursor", displayName: "Cursor", skillsDir: ".cursor/skills" },
  { name: "github-copilot", displayName: "GitHub Copilot", skillsDir: ".agents/skills" },
  { name: "opencode", displayName: "OpenCode", skillsDir: ".agents/skills" },
  { name: "openclaw", displayName: "OpenClaw", skillsDir: "skills" },
  { name: "windsurf", displayName: "Windsurf", skillsDir: ".windsurf/skills" },
];

/** Unique skills directories to scan (deduplicates agents sharing the same dir). */
export function getUniqueSkillsDirs(): string[] {
  return [...new Set(AGENT_SOURCES.map((a) => a.skillsDir))];
}
