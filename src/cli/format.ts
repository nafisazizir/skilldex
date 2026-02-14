import * as p from "@clack/prompts";
import pc from "picocolors";
import { CONTEXT_BUDGET_DANGER_KB, CONTEXT_BUDGET_WARN_KB } from "../lib/constants.js";

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

export function logContextSize(indexSize: number): void {
  const sizeKb = indexSize / 1024;
  const sizeFormatted = `${sizeKb.toFixed(1)} KB`;
  let sizeLabel: string;
  if (sizeKb < CONTEXT_BUDGET_WARN_KB) {
    sizeLabel = pc.green(sizeFormatted);
  } else if (sizeKb < CONTEXT_BUDGET_DANGER_KB) {
    sizeLabel = pc.yellow(sizeFormatted);
  } else {
    sizeLabel = pc.red(`${sizeFormatted} — may degrade agent performance`);
  }

  p.log.info(`Context size: ${sizeLabel}`);
}

export function handleCommandError(error: unknown, spinner?: ReturnType<typeof p.spinner>): never {
  if (spinner) {
    spinner.stop("✗ Failed");
  }
  const message = error instanceof Error ? error.message : String(error);
  p.outro(pc.red(message));
  process.exit(1);
}
