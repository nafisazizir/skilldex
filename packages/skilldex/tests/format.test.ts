import { describe, expect, it } from "vitest";
import { pluralize } from "../src/cli/format.js";

describe("pluralize", () => {
  it("returns singular when count is 1", () => {
    expect(pluralize(1, "skill", "skills")).toBe("skill");
  });

  it("returns plural when count is 0", () => {
    expect(pluralize(0, "skill", "skills")).toBe("skills");
  });

  it("returns plural when count is greater than 1", () => {
    expect(pluralize(5, "skill", "skills")).toBe("skills");
  });

  it("works with irregular plurals", () => {
    expect(pluralize(1, "index", "indices")).toBe("index");
    expect(pluralize(2, "index", "indices")).toBe("indices");
  });
});
