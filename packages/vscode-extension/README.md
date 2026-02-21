# Skilldex for VS Code

Manage AI agent skills visually inside VS Code and Cursor. Index installed skills into passive context files so your agents always know what tools are available.

## Features

- **Sidebar tree view** — See all indexed and available skills at a glance
- **Add/remove from context menu** — Right-click a skill to add or remove it from the index
- **Sync** — Remove stale entries and regenerate the index
- **Multi-agent support** — Works with Cursor, Claude Code, GitHub Copilot, Windsurf, and more

## Commands

Open the command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and search for:

| Command | Description |
|---------|-------------|
| **Skilldex: Initialize** | Scan for skills and create the initial index |
| **Skilldex: Add Skill** | Add a skill to the index |
| **Skilldex: Remove Skill** | Remove a skill from the index |
| **Skilldex: Sync Skills** | Remove stale entries and regenerate |
| **Skilldex: Update Skills** | Refresh the index for changed skills |
| **Skilldex: Refresh** | Refresh the sidebar tree view |

## How It Works

Skilldex discovers skills installed in agent-specific directories (`.cursor/skills/`, `.claude/skills/`, etc.), reads their metadata, and writes a compact index into passive context files like `AGENTS.md` or `CLAUDE.md`. This gives your AI agent immediate awareness of all available skills without runtime tool calls.

The extension manages a `skilldex.config.json` file that tracks which skills are indexed and which target files to write to. The index lives in a managed section between `<!-- skilldex:start -->` / `<!-- skilldex:end -->` tags — the rest of your file is untouched.

## Supported Agents

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

## CLI

For command-line usage and full documentation, see the [skilldex repository](https://github.com/nafisazizir/skilldex).

```bash
npx skilldex init
```

## License

MIT
