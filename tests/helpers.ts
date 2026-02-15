import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SKILL_META_FILE, SKILLS_DIR_SEGMENTS } from "../src/lib/constants.js";

/**
 * Create a skill directory with SKILL.md frontmatter and content files for testing.
 * Accepts `string[]` for simple filenames or `Record<string, string>` for filename→content pairs.
 */
export async function createSkill(
  testDir: string,
  name: string,
  description: string,
  files: string[] | Record<string, string>,
): Promise<void> {
  const skillDir = join(testDir, ...SKILLS_DIR_SEGMENTS, name);
  await mkdir(skillDir, { recursive: true });

  if (description) {
    await writeFile(join(skillDir, SKILL_META_FILE), `---\ndescription: ${description}\n---\n`);
  }

  const entries: [string, string][] = Array.isArray(files)
    ? files.map((f) => [f, `# ${f}`])
    : Object.entries(files);

  for (const [fileName, content] of entries) {
    const filePath = join(skillDir, fileName);
    await mkdir(join(filePath, ".."), { recursive: true });
    await writeFile(filePath, content);
  }
}
