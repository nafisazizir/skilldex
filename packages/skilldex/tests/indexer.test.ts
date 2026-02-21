import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { INDEX_HEADER, SKILLS_DIR_SEGMENTS } from "../src/lib/constants.js";
import { generateIndex } from "../src/lib/indexer.js";
import type { DiscoveredSkill } from "../src/lib/types.js";

describe("generateIndex", () => {
  const projectRoot = "/home/user/project";

  function skill(
    name: string,
    description: string,
    files: { relativePath: string; name: string }[],
    dirSegments: readonly string[] = SKILLS_DIR_SEGMENTS,
  ): DiscoveredSkill {
    const relPath = [...dirSegments, name].join("/");
    return {
      name,
      description,
      path: join(projectRoot, ...dirSegments, name),
      relativePath: relPath,
      files,
    };
  }

  it("generates index with header lines", () => {
    const result = generateIndex([]);
    expect(result).toContain(INDEX_HEADER);
    expect(result).toContain("|IMPORTANT:");
  });

  it("generates index for a project skill with description", () => {
    const skills = [
      skill("react-patterns", "React best practices", [
        { relativePath: "hooks.md", name: "hooks" },
      ]),
    ];

    const result = generateIndex(skills);
    expect(result).toContain("[react-patterns]|root:./.agents/skills/react-patterns");
    expect(result).toContain("|desc:React best practices");
    expect(result).toContain("|{hooks.md}");
  });

  it("omits desc line when description is empty", () => {
    const skills = [skill("no-desc", "", [])];

    const result = generateIndex(skills);
    expect(result).not.toContain("|desc:");
  });

  it("groups files by subdirectory", () => {
    const skills = [
      skill("multi-dir", "", [
        { relativePath: "root-file.md", name: "root-file" },
        { relativePath: "patterns/hooks.md", name: "hooks" },
        { relativePath: "patterns/state.md", name: "state" },
      ]),
    ];

    const result = generateIndex(skills);
    expect(result).toContain("|{root-file.md}");
    expect(result).toContain("|patterns:{hooks.md,state.md}");
  });

  it("handles multiple skills", () => {
    const skills = [
      skill("skill-a", "First", [{ relativePath: "guide.md", name: "guide" }]),
      skill("skill-b", "Second", [{ relativePath: "docs.md", name: "docs" }]),
    ];

    const result = generateIndex(skills);
    expect(result).toContain("[skill-a]|root:./.agents/skills/skill-a");
    expect(result).toContain("[skill-b]|root:./.agents/skills/skill-b");
    expect(result).toContain("|desc:First");
    expect(result).toContain("|desc:Second");
  });
});
