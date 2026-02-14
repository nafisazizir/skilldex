import { dirname, relative } from "node:path";
import type { DiscoveredSkill } from "./types.js";

function groupFilesBySubdir(
  files: { relativePath: string; name: string }[],
): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const file of files) {
    const dir = dirname(file.relativePath);
    const key = dir === "." ? "" : dir;
    const existing = groups.get(key);
    if (existing) {
      existing.push(`${file.name}.md`);
    } else {
      groups.set(key, [`${file.name}.md`]);
    }
  }
  return groups;
}

/** Generate the compressed skill index string for a set of discovered skills. */
export function generateIndex(skills: DiscoveredSkill[], projectRoot: string): string {
  const lines: string[] = [
    "[Skills Index]",
    "|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any tasks covered by indexed skills.",
  ];

  for (const skill of skills) {
    const skillPath = `./${relative(projectRoot, skill.path)}`;
    lines.push(`[${skill.name}]|root:${skillPath}`);

    if (skill.description) {
      lines.push(`|desc:${skill.description}`);
    }

    const groups = groupFilesBySubdir(skill.files);
    for (const [subdir, fileNames] of groups) {
      const fileList = `{${fileNames.join(",")}}`;
      if (subdir) {
        lines.push(`|${subdir}:${fileList}`);
      } else {
        lines.push(`|${fileList}`);
      }
    }
  }

  return lines.join("\n");
}
