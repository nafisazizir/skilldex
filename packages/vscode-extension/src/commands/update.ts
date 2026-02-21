import { getAgentDisplayName, listSkills, updateSkill } from "skilldex";
import * as vscode from "vscode";

export async function updateCommand(projectRoot: string): Promise<boolean> {
  const { indexed } = await listSkills(projectRoot);
  if (indexed.length === 0) {
    vscode.window.showInformationMessage("No indexed skills to update.");
    return false;
  }

  const skillItems = indexed.map((s) => ({
    label: s.name,
    description: getAgentDisplayName(s.path) ?? s.path,
    detail: s.description || undefined,
    path: s.path,
  }));

  const updateAllItem = {
    label: "Update All",
    description: `Refresh all ${indexed.length} skill(s)`,
    path: "",
  };
  const items = [updateAllItem, ...skillItems];

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: "Select skills to update",
    title: "Update Skills",
  });

  if (!picked) {
    return false;
  }

  const paths = picked === updateAllItem ? indexed.map((s) => s.path) : [picked.path];

  const result = await updateSkill(projectRoot, paths);
  vscode.window.showInformationMessage(`Updated ${result.updated.length} skill(s).`);
  return true;
}
