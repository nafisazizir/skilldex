import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { INDEX_HEADER, SKILLS_DIR_SEGMENTS } from "../src/lib/constants.js";
import { generateIndex } from "../src/lib/indexer.js";
import type { DiscoveredSkill } from "../src/lib/types.js";

describe("generateIndex", () => {
  const projectRoot = "/home/user/project";

  it("generates index with header lines", () => {
    const skills: DiscoveredSkill[] = [];
    const result = generateIndex(skills, projectRoot);
    expect(result).toContain(INDEX_HEADER);
    expect(result).toContain("|IMPORTANT:");
  });

  it("generates index for a project skill with description", () => {
    const skills: DiscoveredSkill[] = [
      {
        name: "react-patterns",
        description: "React best practices",
        path: join(projectRoot, ...SKILLS_DIR_SEGMENTS, "react-patterns"),
        files: [{ relativePath: "hooks.md", name: "hooks" }],
      },
    ];

    const result = generateIndex(skills, projectRoot);
    expect(result).toContain("[react-patterns]|root:./.agents/skills/react-patterns");
    expect(result).toContain("|desc:React best practices");
    expect(result).toContain("|{hooks.md}");
  });

  it("omits desc line when description is empty", () => {
    const skills: DiscoveredSkill[] = [
      {
        name: "no-desc",
        description: "",
        path: join(projectRoot, ...SKILLS_DIR_SEGMENTS, "no-desc"),
        files: [],
      },
    ];

    const result = generateIndex(skills, projectRoot);
    expect(result).not.toContain("|desc:");
  });

  it("groups files by subdirectory", () => {
    const skills: DiscoveredSkill[] = [
      {
        name: "multi-dir",
        description: "",
        path: join(projectRoot, ...SKILLS_DIR_SEGMENTS, "multi-dir"),
        files: [
          { relativePath: "root-file.md", name: "root-file" },
          { relativePath: "patterns/hooks.md", name: "hooks" },
          { relativePath: "patterns/state.md", name: "state" },
        ],
      },
    ];

    const result = generateIndex(skills, projectRoot);
    expect(result).toContain("|{root-file.md}");
    expect(result).toContain("|patterns:{hooks.md,state.md}");
  });

  it("handles multiple skills", () => {
    const skills: DiscoveredSkill[] = [
      {
        name: "skill-a",
        description: "First",
        path: join(projectRoot, ...SKILLS_DIR_SEGMENTS, "skill-a"),
        files: [{ relativePath: "guide.md", name: "guide" }],
      },
      {
        name: "skill-b",
        description: "Second",
        path: join(projectRoot, ...SKILLS_DIR_SEGMENTS, "skill-b"),
        files: [{ relativePath: "docs.md", name: "docs" }],
      },
    ];

    const result = generateIndex(skills, projectRoot);
    expect(result).toContain("[skill-a]|root:./.agents/skills/skill-a");
    expect(result).toContain("[skill-b]|root:./.agents/skills/skill-b");
    expect(result).toContain("|desc:First");
    expect(result).toContain("|desc:Second");
  });
});
