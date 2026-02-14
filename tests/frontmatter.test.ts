import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "../src/lib/frontmatter.js";

describe("parseFrontmatter", () => {
  it("parses valid frontmatter with multiple keys", () => {
    const content = `---
description: A great skill
version: 1.0
author: test
---
# Some content`;

    const result = parseFrontmatter(content);
    expect(result).toEqual({
      description: "A great skill",
      version: "1.0",
      author: "test",
    });
  });

  it("returns empty object for content without frontmatter", () => {
    const content = "# Just a heading\nSome text";
    expect(parseFrontmatter(content)).toEqual({});
  });

  it("returns empty object for empty string", () => {
    expect(parseFrontmatter("")).toEqual({});
  });

  it("returns empty object for unclosed frontmatter", () => {
    const content = `---
description: incomplete
no closing delimiter`;
    expect(parseFrontmatter(content)).toEqual({});
  });

  it("handles values with colons", () => {
    const content = `---
description: key: value pair
---`;
    const result = parseFrontmatter(content);
    expect(result.description).toBe("key: value pair");
  });

  it("trims whitespace from keys and values", () => {
    const content = `---
  description  :   spaced out
---`;
    const result = parseFrontmatter(content);
    expect(result.description).toBe("spaced out");
  });

  it("skips lines without colons", () => {
    const content = `---
description: valid
no-colon-here
another: valid
---`;
    const result = parseFrontmatter(content);
    expect(result).toEqual({ description: "valid", another: "valid" });
  });
});
