# skilldex

CLI tool that indexes AI agent skills into passive context files (AGENTS.md, CLAUDE.md, etc.). Based on [Vercel's research](https://vercel.com/blog/ai-sdk-5-mcp-skills) showing **100% pass rate** with passive context vs 53% with active skill retrieval.

## Quick Start

```bash
npx skilldex init
```

This scans your project for installed skills, lets you pick which ones to index, and writes a skills index into your target file(s).

## What It Does

Agent skills (installed via [Vercel's `npx skills`](https://github.com/vercel-labs/skills) or manually) live in directories like `.cursor/skills/` or `.claude/skills/`. Skilldex reads their SKILL.md frontmatter and file structure, then writes a compact index into a passive context file so your agent always knows what's available — no tool calls needed.

**Before:** Agent has to discover and read skill files at runtime (active retrieval)

**After:** Agent sees all skills in its context file on every request (passive context)

```markdown
<!-- skilldex:start (auto-generated, do not edit) -->
[Skills Index]|IMPORTANT: Prefer retrieval-led reasoning...|[react-patterns]|root:./.cursor/skills/react-patterns|desc:React best practices|{hooks.md,components.md}|[testing]|root:./.cursor/skills/testing|{unit.md,integration.md}
<!-- skilldex:end -->
```

## Commands

| Command | Description |
|---------|-------------|
| `skilldex init` | Scan for skills, pick targets, and create initial index |
| `skilldex add <skill>` | Add a skill to the index |
| `skilldex remove <skill>` | Remove a skill from the index |
| `skilldex list` | List indexed and available skills |
| `skilldex sync` | Remove stale entries and regenerate index |
| `skilldex update <skill>` | Refresh the index for a specific skill |

**Flags:**
- `init -y` — skip prompts, index all discovered skills
- `init -t AGENTS.md CLAUDE.md` — specify target files
- `remove --delete-files` — also delete skill files from disk

## Supported Agents

Skilldex discovers skills from these agent directories:

| Agent | Directory |
|-------|-----------|
| Claude Code | `.claude/skills` |
| Cursor | `.cursor/skills` |
| Windsurf | `.windsurf/skills` |
| GitHub Copilot | `.agents/skills` |
| Codex | `.agents/skills` |
| OpenCode | `.agents/skills` |
| Antigravity | `.agent/skills` |
| OpenClaw | `skills` |

## Multi-Target

Write the index to multiple files simultaneously:

```bash
skilldex init -t AGENTS.md CLAUDE.md
```

Or configure targets in `skilldex.config.json`:

```json
{
  "version": 1,
  "targets": ["AGENTS.md", "CLAUDE.md"],
  "skills": [...]
}
```

## VS Code Extension

Manage skills visually inside VS Code and Cursor with the [Skilldex extension](https://marketplace.visualstudio.com/items?itemName=skilldex.skilldex-vscode). Adds a sidebar tree view, context menu actions, and command palette commands.

## How It Works

1. **Scan** — Discovers skill directories across all supported agents
2. **Index** — Reads SKILL.md frontmatter and file structure for each skill
3. **Write** — Inserts a managed section (between `<!-- skilldex:start -->` / `<!-- skilldex:end -->` tags) into target files
4. **Config** — Tracks indexed skills in `skilldex.config.json` so `sync` and `update` can regenerate

The managed section is the only part skilldex touches — the rest of your file is left untouched.

## License

MIT
