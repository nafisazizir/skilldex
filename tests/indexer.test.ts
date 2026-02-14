import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateIndex } from "../src/lib/indexer.js";
import type { DiscoveredSkill } from "../src/lib/types.js";

describe("generateIndex", () => {
  const projectRoot = "/home/user/project";

  it("generates index with header lines", () => {
    const skills: DiscoveredSkill[] = [];
    const result = generateIndex(skills, projectRoot);
    expect(result).toContain("[Skills Index]");
    expect(result).toContain("|IMPORTANT:");
  });

  it("generates index for a project skill with description", () => {
    const skills: DiscoveredSkill[] = [
      {
        name: "react-patterns",
        description: "React best practices",
        path: join(projectRoot, ".agents", "skills", "react-patterns"),
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
        path: join(projectRoot, ".agents", "skills", "no-desc"),
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
        path: join(projectRoot, ".agents", "skills", "multi-dir"),
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
        path: join(projectRoot, ".agents", "skills", "skill-a"),
        files: [{ relativePath: "guide.md", name: "guide" }],
      },
      {
        name: "skill-b",
        description: "Second",
        path: join(projectRoot, ".agents", "skills", "skill-b"),
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
