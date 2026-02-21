import { addSkill, getAgentDisplayName, listSkills } from "skilldex";
import * as vscode from "vscode";
import type { SkillTreeItem } from "../views/skillTreeProvider.js";

export async function addCommand(projectRoot: string, treeItem?: SkillTreeItem): Promise<boolean> {
  // If invoked from context menu on a specific skill
  if (treeItem?.skill) {
    const result = await addSkill(projectRoot, treeItem.skill.path);
    vscode.window.showInformationMessage(`Added "${result.skillName}"`);
    return true;
  }

  // Otherwise show picker
  const { available } = await listSkills(projectRoot);
  if (available.length === 0) {
    vscode.window.showInformationMessage("No available skills to add.");
    return false;
  }

  const items = available.map((s) => ({
    label: s.name,
    description: getAgentDisplayName(s.path) ?? s.path,
    detail: s.description || undefined,
    path: s.path,
  }));

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: "Select a skill to add",
    title: "Add Skill",
  });

  if (!picked) {
    return false;
  }

  const result = await addSkill(projectRoot, picked.path);
  vscode.window.showInformationMessage(`Added "${result.skillName}"`);
  return true;
}
