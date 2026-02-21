# skilldex

CLI tool that indexes AI agent skills into passive context (AGENTS.md).

## Why passive context?

Vercel's research found that AI agents achieve **100% pass rate** when skills are included as passive context, compared to **53% with active retrieval** (RAG, tool-based lookup). skilldex manages a compact index of your installed skills directly in your agent context file, so the agent always knows what's available.

See [Vercel's "`AGENTS.md` outperforms skills in our agent evals"](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals) for the full research.

## Install

```bash
# Interactive setup (recommended)
npx skilldex init

# Or install globally
npm install -g skilldex
```

## Quick start

Run `npx skilldex init` in your project root. skilldex will:

1. Scan for installed skills (`.agents/skills/`, `.claude/`, `.cursor/`, etc.)
2. Let you pick which skills to index
3. Choose target files (AGENTS.md, CLAUDE.md, or custom)
4. Generate a managed skills index

Your target file will include a managed section like this:

```markdown
<!-- skilldex:start (auto-generated, do not edit) -->
[Skills Index]|IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any tasks covered by indexed skills.|[web-design-guidelines]|root:./.cursor/skills/web-design-guidelines|desc:Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
<!-- skilldex:end -->
```

The index is compact (~tokens) but gives the agent enough context to find and read full skill docs from disk when needed.

## Commands

| Command | Description |
|---|---|
| `skilldex init` | Interactive setup. scan for skills, pick targets, generate index |
| `skilldex add <name>` | Add a skill to the index |
| `skilldex remove <name>` | Remove a skill from the index |
| `skilldex list` | List all indexed skills |
| `skilldex sync` | Re-scan disk and regenerate index |

## How it works

skilldex uses a two-part system:

1. **Compact index** — A managed section in your agent context file (AGENTS.md, CLAUDE.md, etc.) that lists skill names, paths, and file structure. This is always visible to the agent as passive context.

2. **Full docs on disk** — The actual skill files (markdown docs, examples, patterns) stay in their original locations. When the agent needs details, it reads the specific files referenced in the index.

The managed section is delimited by `<!-- skilldex:start -->` / `<!-- skilldex:end -->` tags. skilldex only modifies content between these tags — your own content in the file is never touched.

### Multi-target support

skilldex can write to multiple target files simultaneously. Configure targets in `skilldex.config.json`:

```json
{
  "targets": ["AGENTS.md", "CLAUDE.md"],
  "skills": [...]
}
```

## Complementary to Vercel Skills

[Vercel's Skills CLI](https://github.com/vercel-labs/skills) (`npx skills`) handles skill **installation**: downloading and organizing skill files from a registry of 35+ agent-compatible skills. skilldex handles skill **indexing**: scanning your installed skills and generating a compact index in your agent's context file. They work great together: install skills with `npx skills`, then index them with `npx skilldex init`.

## License

[MIT](LICENSE)
