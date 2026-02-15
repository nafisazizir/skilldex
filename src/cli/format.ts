import * as p from "@clack/prompts";
import pc from "picocolors";
import { CONTEXT_BUDGET_DANGER_KB, CONTEXT_BUDGET_WARN_KB } from "../lib/constants.js";
import type { TargetFileInfo } from "../lib/types.js";

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function formatKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function logContextSize(managedSize: number, targets: TargetFileInfo[]): void {
  const sizeKb = managedSize / 1024;
  const sizeFormatted = formatKb(managedSize);
  let sizeLabel: string;
  if (sizeKb < CONTEXT_BUDGET_WARN_KB) {
    sizeLabel = pc.green(sizeFormatted);
  } else if (sizeKb < CONTEXT_BUDGET_DANGER_KB) {
    sizeLabel = pc.yellow(sizeFormatted);
  } else {
    sizeLabel = pc.red(`${sizeFormatted} — may degrade agent performance`);
  }

  const targetLines = targets.map(
    (t) => `   ${t.file}  ${pc.dim(`${formatKb(t.totalSize)} total`)}`,
  );
  p.log.info(`Context: ${sizeLabel} (managed section)\n${targetLines.join("\n")}`);
}

export function handleCommandError(error: unknown, spinner?: ReturnType<typeof p.spinner>): never {
  if (spinner) {
    spinner.stop("✗ Failed");
  }
  const message = error instanceof Error ? error.message : String(error);
  p.outro(pc.red(message));
  process.exit(1);
}
