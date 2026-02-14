import { Command } from "commander";

const program = new Command();

program
  .name("skilldex")
  .description("Index AI agent skills into passive context (AGENTS.md)")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize skilldex in the current project")
  .action(() => {
    console.log("not yet implemented");
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
