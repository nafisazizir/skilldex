import { describe, expect, it } from "vitest";
import { getAgentDisplayName } from "../src/lib/agents.js";

describe("getAgentDisplayName", () => {
  it("returns Cursor for .cursor/skills paths", () => {
    expect(getAgentDisplayName(".cursor/skills/foo")).toBe("Cursor");
  });

  it("returns Claude Code for .claude/skills paths", () => {
    expect(getAgentDisplayName(".claude/skills/foo")).toBe("Claude Code");
  });

  it("returns Universal for .agents/skills paths (first match)", () => {
    expect(getAgentDisplayName(".agents/skills/foo")).toBe("Universal");
  });

  it("returns Windsurf for .windsurf/skills paths", () => {
    expect(getAgentDisplayName(".windsurf/skills/foo")).toBe("Windsurf");
  });

  it("returns Antigravity for .agent/skills paths", () => {
    expect(getAgentDisplayName(".agent/skills/foo")).toBe("Antigravity");
  });

  it("returns OpenClaw for skills/ paths", () => {
    expect(getAgentDisplayName("skills/foo")).toBe("OpenClaw");
  });

  it("returns undefined for unrecognized paths", () => {
    expect(getAgentDisplayName("random/path")).toBeUndefined();
  });

  it("matches exact skillsDir without trailing slash", () => {
    expect(getAgentDisplayName(".cursor/skills")).toBe("Cursor");
  });

  it("does not match partial directory names", () => {
    expect(getAgentDisplayName(".cursor/skillsExtra/foo")).toBeUndefined();
  });
});
