import { dirname } from "node:path";
import { INDEX_HEADER, INDEX_INSTRUCTION } from "./constants.js";
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

export function generateIndex(skills: DiscoveredSkill[]): string {
  const segments: string[] = [INDEX_HEADER, INDEX_INSTRUCTION];

  for (const skill of skills) {
    segments.push(`[${skill.name}]`);
    segments.push(`root:./${skill.relativePath}`);

    if (skill.description) {
      segments.push(`desc:${skill.description}`);
    }

    const groups = groupFilesBySubdir(skill.files);
    for (const [subdir, fileNames] of groups) {
      const fileList = `{${fileNames.join(",")}}`;
      if (subdir) {
        segments.push(`${subdir}:${fileList}`);
      } else {
        segments.push(fileList);
      }
    }
  }

  return segments.join("|");
}
