import { syncSkills } from "skilldex";
import * as vscode from "vscode";

export async function syncCommand(projectRoot: string): Promise<boolean> {
  const result = await syncSkills(projectRoot);

  if (result.removed.length > 0) {
    vscode.window.showInformationMessage(
      `Synced: removed ${result.removed.length} stale skill(s).`,
    );
  } else if (result.changed) {
    vscode.window.showInformationMessage("Synced: index refreshed.");
  } else {
    vscode.window.showInformationMessage("Already in sync.");
  }

  return true;
}
