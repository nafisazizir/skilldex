import type { DiscoveredSkill } from "skilldex";
import {
  getAgentDisplayName,
  initWithSkills,
  readConfig,
  scanForSkills,
  TARGET_FILE,
} from "skilldex";
import * as vscode from "vscode";

export async function initCommand(projectRoot: string): Promise<boolean> {
  // Check if config already exists
  try {
    const config = await readConfig(projectRoot);
    if (config.skills.length > 0) {
      const overwrite = await vscode.window.showWarningMessage(
        "Skilldex is already initialized. Re-initialize?",
        "Yes",
        "No",
      );
      if (overwrite !== "Yes") {
        return false;
      }
    }
  } catch {
    // No config yet, proceed
  }

  const discovered = await scanForSkills(projectRoot);
  if (discovered.length === 0) {
    vscode.window.showInformationMessage(
      "No skills found. Create skill directories first (e.g., .cursor/skills/my-skill/SKILL.md).",
    );
    return false;
  }

  const items = discovered.map((skill) => ({
    label: skill.name,
    description: getAgentDisplayName(skill.relativePath) ?? skill.relativePath,
    detail: skill.description || undefined,
    picked: true,
    skill,
  }));

  const picked = await vscode.window.showQuickPick(items, {
    canPickMany: true,
    placeHolder: "Select skills to index",
    title: "Initialize Skilldex",
  });

  if (!picked || picked.length === 0) {
    return false;
  }

  // Ask for target files
  const targetInput = await vscode.window.showInputBox({
    prompt: "Target files (comma-separated)",
    value: TARGET_FILE,
    placeHolder: "e.g., AGENTS.md, CLAUDE.md",
  });

  if (targetInput === undefined) {
    return false;
  }

  const targets = targetInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const skills: DiscoveredSkill[] = picked.map((p) => p.skill);
  const result = await initWithSkills(projectRoot, skills, targets);

  const targetNames = result.targets.map((t) => t.file).join(", ");
  vscode.window.showInformationMessage(
    `Initialized ${result.skillCount} skill(s) → ${targetNames}`,
  );
  return true;
}
