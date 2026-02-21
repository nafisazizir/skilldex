import * as vscode from "vscode";
import { addCommand } from "./commands/add.js";
import { initCommand } from "./commands/init.js";
import { removeCommand } from "./commands/remove.js";
import { syncCommand } from "./commands/sync.js";
import { updateCommand } from "./commands/update.js";
import { getProjectRoot } from "./utils/workspace.js";
import type { SkillTreeItem } from "./views/skillTreeProvider.js";
import { SkillTreeProvider } from "./views/skillTreeProvider.js";

export function activate(context: vscode.ExtensionContext): void {
  const hasWorkspace = !!getProjectRoot();
  vscode.commands.executeCommand("setContext", "skilldex.hasWorkspace", hasWorkspace);

  const treeProvider = new SkillTreeProvider();
  const treeView = vscode.window.createTreeView("skilldexSkills", {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  function withProjectRoot<T>(
    fn: (projectRoot: string, ...args: T[]) => Promise<boolean>,
  ): (...args: T[]) => Promise<void> {
    return async (...args: T[]) => {
      const projectRoot = getProjectRoot();
      if (!projectRoot) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
      }
      try {
        const changed = await fn(projectRoot, ...args);
        if (changed) {
          treeProvider.refresh();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Skilldex: ${message}`);
      }
    };
  }

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("skilldex.init", withProjectRoot(initCommand)),
    vscode.commands.registerCommand(
      "skilldex.add",
      withProjectRoot<SkillTreeItem | undefined>(addCommand),
    ),
    vscode.commands.registerCommand(
      "skilldex.remove",
      withProjectRoot<SkillTreeItem | undefined>(removeCommand),
    ),
    vscode.commands.registerCommand("skilldex.sync", withProjectRoot(syncCommand)),
    vscode.commands.registerCommand("skilldex.update", withProjectRoot(updateCommand)),
    vscode.commands.registerCommand("skilldex.refresh", () => treeProvider.refresh()),
  );

  // File watchers — debounced to batch rapid filesystem events (e.g. git checkout)
  const configWatcher = vscode.workspace.createFileSystemWatcher("**/skilldex.config.json");
  configWatcher.onDidChange(() => treeProvider.debouncedRefresh());
  configWatcher.onDidCreate(() => treeProvider.debouncedRefresh());
  configWatcher.onDidDelete(() => treeProvider.debouncedRefresh());

  const skillWatcher = vscode.workspace.createFileSystemWatcher(
    "**/{.agents,.claude,.cursor,.windsurf,.agent}/skills/**",
  );
  skillWatcher.onDidCreate(() => treeProvider.debouncedRefresh());
  skillWatcher.onDidChange(() => treeProvider.debouncedRefresh());
  skillWatcher.onDidDelete(() => treeProvider.debouncedRefresh());

  context.subscriptions.push(treeView, configWatcher, skillWatcher);
}

export function deactivate(): void {
  // Cleanup handled by disposables
}
