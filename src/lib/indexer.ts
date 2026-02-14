import { relative } from "node:path";
import type { DiscoveredSkill } from "./types.js";

/** Generate the skill index string for a set of discovered skills. */
export function generateIndex(skills: DiscoveredSkill[], projectRoot: string): string {
  const lines: string[] = [
    "[Skills Index]",
    "|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any tasks covered by indexed skills.",
    "",
  ];

  for (const skill of skills) {
    const skillPath = `./${relative(projectRoot, skill.path)}`;
    lines.push(`[${skill.name}]`);
    lines.push(`root: ${skillPath}`);

    if (skill.description) {
      lines.push(`desc: ${skill.description}`);
    }

    // List each file with full relative path
    for (const file of skill.files) {
      lines.push(file.relativePath);
    }

    lines.push(""); // Blank line between skills
  }

  return lines.join("\n");
}
