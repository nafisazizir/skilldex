import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { SKILL_META_FILE, skillsDir } from "./constants.js";
import type { DiscoveredSkill, SkillFile } from "./types.js";

/** Extract key-value pairs from YAML frontmatter (between `---` fences). */
export function parseFrontmatter(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!content.startsWith("---")) return result;

  const endIndex = content.indexOf("\n---", 3);
  if (endIndex === -1) return result;

  const block = content.slice(4, endIndex);
  for (const line of block.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

async function safeReaddir(dir: string): Promise<Dirent[]> {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

export async function safeReadFile(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf-8");
  } catch {
    return undefined;
  }
}

async function collectMdFiles(dir: string, skillRoot: string): Promise<SkillFile[]> {
  const entries = await safeReaddir(dir);
  const files: SkillFile[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectMdFiles(fullPath, skillRoot);
      files.push(...nested);
    } else if (entry.isFile() && entry.name.endsWith(".md") && entry.name !== SKILL_META_FILE) {
      files.push({
        relativePath: relative(skillRoot, fullPath),
        name: entry.name.replace(/\.md$/, ""),
      });
    }
  }
  return files;
}

/** Scan for skills in the project's `.agents/skills/` directory. */
export async function scanForSkills(projectRoot: string): Promise<DiscoveredSkill[]> {
  const dir = skillsDir(projectRoot);
  const entries = await safeReaddir(dir);
  const skills: DiscoveredSkill[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillPath = join(dir, entry.name);
    let description = "";

    const skillMd = await safeReadFile(join(skillPath, SKILL_META_FILE));
    if (skillMd !== undefined) {
      const frontmatter = parseFrontmatter(skillMd);
      description = frontmatter.description ?? "";
    }

    const files = await collectMdFiles(skillPath, skillPath);
    skills.push({
      name: entry.name,
      description,
      path: skillPath,
      files,
    });
  }
  return skills;
}
