# skilldex

CLI tool + VS Code extension that indexes AI agent skills into passive context (AGENTS.md). Based on Vercel's research showing 100% pass rate with passive context vs 53% with active skill retrieval.

## Tech Stack

- **Language:** TypeScript (strict mode)
- **Runtime:** Node.js >=18
- **Package manager:** pnpm (workspaces)
- **CLI framework:** Commander.js
- **Interactive prompts:** @clack/prompts
- **Terminal styling:** picocolors
- **Build:** tsup (CLI/lib), esbuild (VS Code extension)
- **Test:** vitest
- **Lint/Format:** Biome


## Commands

```bash
pnpm build          # Build all packages
pnpm test           # Run all tests
pnpm lint           # Lint with Biome
pnpm format         # Format with Biome
```

## Architecture

```
packages/
├── skilldex/               # CLI + library (npm published)
│   ├── src/
│   │   ├── cli/            # CLI entry point (Commander.js)
│   │   ├── lib/            # Core logic (programmatic API)
│   │   └── index.ts        # Library entry point
│   └── tests/
└── vscode-extension/       # VS Code/Cursor extension
    └── src/
        ├── extension.ts    # activate/deactivate
        ├── commands/       # Command handlers (init, add, remove, sync, update)
        ├── views/          # TreeView provider
        └── utils/          # Workspace helpers
```

**Key principle:** `packages/skilldex/src/lib/` contains all core logic as a programmatic API. Both the CLI (`src/cli/`) and VS Code extension import from the lib. The extension uses `"skilldex": "workspace:*"` to import the lib directly.

## Conventions

- Strict TypeScript — no `any`, no implicit returns
- Biome for formatting (2-space indent, 100 char line width) and linting
- vitest for all tests

## Reference Projects

- **Vercel Skills CLI:** https://github.com/vercel-labs/skills — The open agent skills tool (`npx skills`). Supports 35+ agents with per-agent directory conventions. Key reference for multi-agent directory structures and skill format (SKILL.md). Skilldex complements this — they handle skill *installation*, we handle skill *indexing* into passive context.

## CLI Display Design

- **Agent name is primary, path is secondary.** In interactive selects, show the agent display name as the label and the skill path as the `hint` (only visible on hover). Never combine both in the label.
- `getAgentDisplayName()` maps a relative skill path to its agent's display name (e.g., `.cursor/skills/foo` → `"Cursor"`). Falls back to showing the raw path when no agent matches.
- For name collisions in `init`, the label is `skillName - AgentName` with the path as hint.
