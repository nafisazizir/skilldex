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
