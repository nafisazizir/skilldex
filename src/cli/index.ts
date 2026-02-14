import * as p from "@clack/prompts";
import { Command } from "commander";
import pc from "picocolors";
import { addSkill } from "../lib/add.js";
import { initWithSkills } from "../lib/init.js";
import { removeSkill } from "../lib/remove.js";
import { scanForSkills } from "../lib/scanner.js";

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
      p.outro(pc.yellow("No skills found. Add skill directories to .agents/skills/"));
      return;
    }

    let selectedSkillNames: string[];

    if (opts.yes) {
      p.log.info(`Found ${skills.length} skill(s), indexing all (--yes)`);
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

    const sizeKb = result.indexSize / 1024;
    const sizeFormatted = `${sizeKb.toFixed(1)} KB`;
    let sizeLabel: string;
    if (sizeKb < 20) {
      sizeLabel = pc.green(sizeFormatted);
    } else if (sizeKb < 40) {
      sizeLabel = pc.yellow(sizeFormatted);
    } else {
      sizeLabel = pc.red(`${sizeFormatted} — may degrade agent performance`);
    }

    p.log.info(`Context size: ${sizeLabel}`);
    p.outro(pc.green(`Indexed ${result.skillCount} skill(s) into AGENTS.md`));
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

      const sizeKb = result.indexSize / 1024;
      const sizeFormatted = `${sizeKb.toFixed(1)} KB`;
      let sizeLabel: string;
      if (sizeKb < 20) {
        sizeLabel = pc.green(sizeFormatted);
      } else if (sizeKb < 40) {
        sizeLabel = pc.yellow(sizeFormatted);
      } else {
        sizeLabel = pc.red(`${sizeFormatted} — may degrade agent performance`);
      }

      p.log.info(`Context size: ${sizeLabel}`);
      p.outro(pc.green(`Added "${result.skillName}" to AGENTS.md`));
    } catch (error) {
      s.stop("✗ Failed");
      const message = error instanceof Error ? error.message : String(error);
      p.outro(pc.red(message));
      process.exit(1);
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
        message: `Delete skill files from disk (.agents/skills/${skillName})?`,
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

      const sizeKb = result.indexSize / 1024;
      const sizeFormatted = `${sizeKb.toFixed(1)} KB`;
      let sizeLabel: string;
      if (sizeKb < 20) {
        sizeLabel = pc.green(sizeFormatted);
      } else if (sizeKb < 40) {
        sizeLabel = pc.yellow(sizeFormatted);
      } else {
        sizeLabel = pc.red(`${sizeFormatted} — may degrade agent performance`);
      }

      p.log.info(`Context size: ${sizeLabel}`);
      const suffix = result.wasDeleted ? " (files deleted)" : " (files kept on disk)";
      p.outro(pc.green(`Removed "${result.skillName}"${suffix}`));
    } catch (error) {
      s.stop("✗ Failed");
      const message = error instanceof Error ? error.message : String(error);
      p.outro(pc.red(message));
      process.exit(1);
    }
  });

program
  .command("list")
  .description("List installed skills")
  .action(() => {
    console.log("not yet implemented");
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
  .action(() => {
    console.log("not yet implemented");
  });

program.parse();
