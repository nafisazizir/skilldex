import * as p from "@clack/prompts";
import { Command } from "commander";
import pc from "picocolors";
import { initWithSkills } from "../lib/init.js";
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
  .command("add")
  .description("Add a skill to the project")
  .action(() => {
    console.log("not yet implemented");
  });

program
  .command("remove")
  .description("Remove a skill from the project")
  .action(() => {
    console.log("not yet implemented");
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
