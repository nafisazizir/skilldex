import * as p from "@clack/prompts";
import { Command } from "commander";
import pc from "picocolors";
import { addSkill } from "../lib/add.js";
import { SKILLS_DIR_SEGMENTS, TARGET_FILE } from "../lib/constants.js";
import { initWithSkills } from "../lib/init.js";
import { listSkills } from "../lib/list.js";
import { removeSkill } from "../lib/remove.js";
import { scanForSkills } from "../lib/scanner.js";
import { syncSkills } from "../lib/sync.js";
import { handleCommandError, logContextSize, pluralize } from "./format.js";

const program = new Command();

program
  .name("skilldex")
  .description("Index AI agent skills into passive context (AGENTS.md)")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize skilldex in the current project")
  .option("-y, --yes", "Skip prompts and index all discovered skills")
  .action(async (opts: { yes?: boolean }) => {
    p.intro(pc.bgCyan(pc.black(" skilldex init ")));

    const projectRoot = process.cwd();
    const skills = await scanForSkills(projectRoot);

    if (skills.length === 0) {
      p.outro(
        pc.yellow(`No skills found. Add skill directories to ${SKILLS_DIR_SEGMENTS.join("/")}/`),
      );
      return;
    }

    let selectedSkillNames: string[];

    if (opts.yes) {
      p.log.info(
        `Found ${skills.length} ${pluralize(skills.length, "skill", "skills")}, indexing all (--yes)`,
      );
      selectedSkillNames = skills.map((s) => s.name);
    } else {
      const selected = await p.multiselect({
        message: "Select skills to index",
        options: skills.map((s) => ({
          value: s.name,
          label: s.name,
          hint: s.description || undefined,
        })),
        initialValues: skills.map((s) => s.name),
        required: true,
      });

      if (p.isCancel(selected)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      selectedSkillNames = selected;
    }

    const selectedSkills = skills.filter((s) => selectedSkillNames.includes(s.name));
    const result = await initWithSkills(projectRoot, selectedSkills);

    logContextSize(result.indexSize);
    p.outro(
      pc.green(
        `Indexed ${result.skillCount} ${pluralize(result.skillCount, "skill", "skills")} into ${TARGET_FILE}`,
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
      s.start("Adding skill...");
      const result = await addSkill(projectRoot, skillName);
      s.stop("✓ Skill added");

      logContextSize(result.indexSize);
      p.outro(pc.green(`Added "${result.skillName}" to ${TARGET_FILE}`));
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

    let deleteFiles = opts.deleteFiles ?? false;

    if (!opts.deleteFiles) {
      const shouldDelete = await p.confirm({
        message: `Delete skill files from disk (${SKILLS_DIR_SEGMENTS.join("/")}/${skillName})?`,
        initialValue: false,
      });

      if (p.isCancel(shouldDelete)) {
        p.cancel("Remove cancelled.");
        process.exit(0);
      }

      deleteFiles = shouldDelete;
    }

    try {
      s.start("Removing skill...");
      const result = await removeSkill(projectRoot, skillName, deleteFiles);
      s.stop("✓ Skill removed");

      logContextSize(result.indexSize);
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
          (skill) => `  ${pc.green(skill.name)}  ${pc.dim(skill.path)}`,
        );
        p.log.info(indexedLines.join("\n"));
      } else {
        p.log.info(pc.dim("No indexed skills."));
      }

      if (result.available.length > 0) {
        p.log.step(pc.bold("Available skills (not indexed)"));
        const availableLines = result.available.map(
          (skill) => `  ${pc.yellow(skill.name)}  ${pc.dim(skill.path)}`,
        );
        p.log.info(availableLines.join("\n"));
      }

      p.outro(pc.green("Done"));
    } catch (error) {
      handleCommandError(error);
    }
  });

program
  .command("browse")
  .description("Browse available skills")
  .action(() => {
    console.log("not yet implemented");
  });

program
  .command("sync")
  .description("Sync skills and regenerate AGENTS.md")
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

      logContextSize(result.indexSize);

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
