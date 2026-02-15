import * as p from "@clack/prompts";
import { Command } from "commander";
import pc from "picocolors";
import { addSkill } from "../lib/add.js";
import { getAgentDisplayName } from "../lib/agents.js";
import { readConfig } from "../lib/config.js";
import { TARGET_FILE } from "../lib/constants.js";
import { initWithSkills } from "../lib/init.js";
import { listSkills } from "../lib/list.js";
import { removeSkill } from "../lib/remove.js";
import { scanForSkills } from "../lib/scanner.js";
import { syncSkills } from "../lib/sync.js";
import { formatSkillPath, handleCommandError, logContextSize, pluralize } from "./format.js";

const program = new Command();

program
  .name("skilldex")
  .description("Index AI agent skills into passive context (AGENTS.md)")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize skilldex in the current project")
  .option("-y, --yes", "Skip prompts and index all discovered skills")
  .option("-t, --target <files...>", "Target file(s) to write index to")
  .action(async (opts: { yes?: boolean; target?: string[] }) => {
    p.intro(pc.bgCyan(pc.black(" skilldex init ")));

    const projectRoot = process.cwd();
    const skills = await scanForSkills(projectRoot);

    if (skills.length === 0) {
      p.outro(pc.yellow("No skills found in any agent skills directory."));
      return;
    }

    // Determine target files
    let targets: string[];
    if (opts.target) {
      targets = opts.target;
    } else if (opts.yes) {
      targets = [TARGET_FILE];
    } else {
      const selected = await p.multiselect({
        message: "Select target file(s)",
        options: [
          { value: "AGENTS.md", label: "AGENTS.md", hint: "default" },
          { value: "CLAUDE.md", label: "CLAUDE.md" },
          { value: "__custom__", label: "Custom..." },
        ],
        initialValues: ["AGENTS.md"],
        required: true,
      });

      if (p.isCancel(selected)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      targets = selected.filter((v) => v !== "__custom__");

      if (selected.includes("__custom__")) {
        const custom = await p.text({
          message: "Enter target filename",
          placeholder: "AGENTS.md",
          validate: (value) => {
            if (!value?.trim()) return "Filename is required";
          },
        });

        if (p.isCancel(custom)) {
          p.cancel("Init cancelled.");
          process.exit(0);
        }

        targets.push(custom);
      }
    }

    // Detect name collisions for hint display
    const nameCount = new Map<string, number>();
    for (const s of skills) {
      nameCount.set(s.name, (nameCount.get(s.name) ?? 0) + 1);
    }

    let selectedSkillPaths: string[];

    if (opts.yes) {
      p.log.info(
        `Found ${skills.length} ${pluralize(skills.length, "skill", "skills")}, indexing all (--yes)`,
      );
      selectedSkillPaths = skills.map((s) => s.relativePath);
    } else {
      const selected = await p.multiselect({
        message: "Select skills to index",
        options: skills.map((s) => {
          const relPath = s.relativePath;
          const hasCollision = (nameCount.get(s.name) ?? 0) > 1;
          if (hasCollision) {
            const agent = getAgentDisplayName(relPath);
            const label = agent ? `${s.name} - ${agent}` : s.name;
            return { value: relPath, label, hint: relPath };
          }
          return { value: relPath, label: s.name, hint: s.description || undefined };
        }),
        initialValues: skills.map((s) => s.relativePath),
        required: true,
      });

      if (p.isCancel(selected)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      selectedSkillPaths = selected;
    }

    const selectedSkills = skills.filter((s) => selectedSkillPaths.includes(s.relativePath));
    const result = await initWithSkills(projectRoot, selectedSkills, targets);

    logContextSize(result.managedSize, result.targets);
    p.outro(
      pc.green(
        `Indexed ${result.skillCount} ${pluralize(result.skillCount, "skill", "skills")} into ${result.targets.map((t) => t.file).join(", ")}`,
      ),
    );
  });

program
  .command("add <skill>")
  .description("Add a skill to the project")
  .action(async (skillName: string) => {
    p.intro(pc.bgCyan(pc.black(" skilldex add ")));

    const projectRoot = process.cwd();
    const s = p.spinner();

    try {
      // Disambiguate name-based input before calling addSkill
      let resolvedName = skillName;

      if (!skillName.includes("/")) {
        const allSkills = await scanForSkills(projectRoot);
        const matches = allSkills.filter((sk) => sk.name === skillName);

        if (matches.length > 1) {
          const config = await readConfig(projectRoot);
          const indexedPaths = new Set(config.skills.map((sk) => sk.path));
          const available = matches.filter((sk) => !indexedPaths.has(sk.relativePath));

          if (available.length === 0) {
            p.outro(pc.yellow(`All skills named "${skillName}" are already indexed.`));
            return;
          }

          const selected = await p.select({
            message: `Multiple skills named "${skillName}" found. Which one?`,
            options: matches
              .map((sk) => {
                const indexed = indexedPaths.has(sk.relativePath);
                const agent = getAgentDisplayName(sk.relativePath);
                return {
                  value: sk.relativePath,
                  label: agent ?? sk.relativePath,
                  hint: indexed ? "already indexed" : sk.relativePath,
                  disabled: indexed,
                };
              })
              .sort((a, b) => {
                if (a.disabled !== b.disabled) return a.disabled ? -1 : 1;
                return a.label.localeCompare(b.label);
              }),
          });

          if (p.isCancel(selected)) {
            p.cancel("Add cancelled.");
            process.exit(0);
          }

          resolvedName = selected;
        }
      }

      s.start("Adding skill...");
      const result = await addSkill(projectRoot, resolvedName);
      s.stop("✓ Skill added");

      logContextSize(result.managedSize, result.targets);
      p.outro(
        pc.green(`Added "${result.skillName}" to ${result.targets.map((t) => t.file).join(", ")}`),
      );
    } catch (error) {
      handleCommandError(error, s);
    }
  });

program
  .command("remove <skill>")
  .description("Remove a skill from the project")
  .option("--delete-files", "Delete skill files from disk")
  .action(async (skillName: string, opts: { deleteFiles?: boolean }) => {
    p.intro(pc.bgCyan(pc.black(" skilldex remove ")));

    const projectRoot = process.cwd();
    const s = p.spinner();

    try {
      // Disambiguate name-based input before removing
      let resolvedName = skillName;

      if (!skillName.includes("/")) {
        const config = await readConfig(projectRoot);
        const matches = config.skills.filter((sk) => sk.name === skillName);

        if (matches.length > 1) {
          const selected = await p.select({
            message: `Multiple skills named "${skillName}" indexed. Which one?`,
            options: matches.map((sk) => {
              const agent = getAgentDisplayName(sk.path);
              return { value: sk.path, label: agent ?? sk.path, hint: sk.path };
            }),
          });

          if (p.isCancel(selected)) {
            p.cancel("Remove cancelled.");
            process.exit(0);
          }

          resolvedName = selected;
        }
      }

      let deleteFiles = opts.deleteFiles ?? false;

      if (!opts.deleteFiles) {
        const shouldDelete = await p.confirm({
          message: `Delete skill files from disk (${resolvedName})?`,
          initialValue: false,
        });

        if (p.isCancel(shouldDelete)) {
          p.cancel("Remove cancelled.");
          process.exit(0);
        }

        deleteFiles = shouldDelete;
      }

      s.start("Removing skill...");
      const result = await removeSkill(projectRoot, resolvedName, deleteFiles);
      s.stop("✓ Skill removed");

      logContextSize(result.managedSize, result.targets);
      const suffix = result.wasDeleted ? " (files deleted)" : " (files kept on disk)";
      p.outro(pc.green(`Removed "${result.skillName}"${suffix}`));
    } catch (error) {
      handleCommandError(error, s);
    }
  });

program
  .command("list")
  .description("List indexed and available skills")
  .action(async () => {
    p.intro(pc.bgCyan(pc.black(" skilldex list ")));

    const projectRoot = process.cwd();

    try {
      const result = await listSkills(projectRoot);

      if (result.indexed.length > 0) {
        p.log.step(pc.bold("Indexed skills"));
        const indexedLines = result.indexed.map(
          (skill) => `  ${pc.green(skill.name)}  ${formatSkillPath(skill.path)}`,
        );
        p.log.info(indexedLines.join("\n"));
      } else {
        p.log.info(pc.dim("No indexed skills."));
      }

      if (result.available.length > 0) {
        p.log.step(pc.bold("Available skills (not indexed)"));
        const availableLines = result.available.map(
          (skill) => `  ${pc.yellow(skill.name)}  ${formatSkillPath(skill.path)}`,
        );
        p.log.info(availableLines.join("\n"));
      }

      p.outro(pc.green("Done"));
    } catch (error) {
      handleCommandError(error);
    }
  });

program
  .command("sync")
  .description("Sync skills and regenerate target file")
  .action(async () => {
    p.intro(pc.bgCyan(pc.black(" skilldex sync ")));

    const projectRoot = process.cwd();
    const s = p.spinner();

    try {
      s.start("Syncing...");
      const result = await syncSkills(projectRoot);
      s.stop("✓ Sync complete");

      if (result.removed.length > 0) {
        for (const name of result.removed) {
          p.log.warn(pc.red(`Removed stale skill "${name}" (missing from disk)`));
        }
      }

      logContextSize(result.managedSize, result.targets);

      if (result.changed) {
        p.outro(pc.green("Index updated"));
      } else {
        p.outro(pc.green("Everything up to date"));
      }
    } catch (error) {
      handleCommandError(error, s);
    }
  });

program.parse();
