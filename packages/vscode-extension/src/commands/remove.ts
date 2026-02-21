import { getAgentDisplayName, listSkills, removeSkill } from "skilldex";
import * as vscode from "vscode";
import type { SkillTreeItem } from "../views/skillTreeProvider.js";

export async function removeCommand(
  projectRoot: string,
  treeItem?: SkillTreeItem,
): Promise<boolean> {
  // If invoked from context menu on a specific skill
  if (treeItem?.skill) {
    const result = await removeSkill(projectRoot, treeItem.skill.path);
    vscode.window.showInformationMessage(`Removed "${result.skillName}"`);
    return true;
  }

  // Otherwise show picker
  const { indexed } = await listSkills(projectRoot);
  if (indexed.length === 0) {
    vscode.window.showInformationMessage("No indexed skills to remove.");
    return false;
  }

  const items = indexed.map((s) => ({
    label: s.name,
    description: getAgentDisplayName(s.path) ?? s.path,
    detail: s.description || undefined,
    path: s.path,
  }));

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: "Select a skill to remove",
    title: "Remove Skill",
  });

  if (!picked) {
    return false;
  }

  const result = await removeSkill(projectRoot, picked.path);
  vscode.window.showInformationMessage(`Removed "${result.skillName}"`);
  return true;
}
