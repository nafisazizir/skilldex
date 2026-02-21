import * as path from "node:path";
import type { SkillInfo } from "skilldex";
import { getAgentDisplayName, listSkills } from "skilldex";
import * as vscode from "vscode";
import { getProjectRoot } from "../utils/workspace.js";

type TreeItemType = "indexedGroup" | "availableGroup" | "indexedSkill" | "availableSkill";

export class SkillTreeItem extends vscode.TreeItem {
  constructor(
    public readonly type: TreeItemType,
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly skill?: SkillInfo,
  ) {
    super(label, collapsibleState);
    this.contextValue = type;

    if (skill) {
      const agentName = getAgentDisplayName(skill.path);
      this.description = agentName ?? skill.path;

      if (skill.missing) {
        this.description = `${agentName ?? skill.path} (missing)`;
        this.iconPath = new vscode.ThemeIcon(
          "warning",
          new vscode.ThemeColor("list.warningForeground"),
        );
        this.tooltip = `${skill.name}\n${skill.path}\n(missing from disk)`;
      } else {
        this.tooltip = `${skill.name}\n${skill.path}${skill.description ? `\n${skill.description}` : ""}`;

        if (type === "indexedSkill") {
          this.iconPath = new vscode.ThemeIcon("check");
        } else {
          this.iconPath = new vscode.ThemeIcon("circle-outline");
        }

        const projectRoot = getProjectRoot();
        if (projectRoot) {
          const skillMdPath = vscode.Uri.file(path.join(projectRoot, skill.path, "SKILL.md"));
          this.command = {
            command: "vscode.open",
            title: "Open SKILL.md",
            arguments: [skillMdPath],
          };
        }
      }
    }
  }
}

export class SkillTreeProvider implements vscode.TreeDataProvider<SkillTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SkillTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private indexed: SkillInfo[] = [];
  private available: SkillInfo[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  /** Immediate refresh — use for command-driven updates. */
  refresh(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
    this._onDidChangeTreeData.fire(undefined);
  }

  /** Debounced refresh (300ms) — use for file watcher events to batch rapid changes. */
  debouncedRefresh(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      this._onDidChangeTreeData.fire(undefined);
    }, 300);
  }

  getTreeItem(element: SkillTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SkillTreeItem): Promise<SkillTreeItem[]> {
    const projectRoot = getProjectRoot();
    if (!projectRoot) {
      return [];
    }

    if (!element) {
      // Root level: load data and return group nodes
      try {
        const result = await listSkills(projectRoot);
        this.indexed = result.indexed;
        this.available = result.available;
      } catch {
        this.indexed = [];
        this.available = [];
      }

      const items: SkillTreeItem[] = [];

      items.push(
        new SkillTreeItem(
          "indexedGroup",
          `Indexed (${this.indexed.length})`,
          this.indexed.length > 0
            ? vscode.TreeItemCollapsibleState.Expanded
            : vscode.TreeItemCollapsibleState.None,
        ),
      );

      items.push(
        new SkillTreeItem(
          "availableGroup",
          `Available (${this.available.length})`,
          this.available.length > 0
            ? vscode.TreeItemCollapsibleState.Expanded
            : vscode.TreeItemCollapsibleState.None,
        ),
      );

      return items;
    }

    // Group children
    if (element.type === "indexedGroup") {
      return this.indexed.map(
        (skill) =>
          new SkillTreeItem(
            "indexedSkill",
            skill.name,
            vscode.TreeItemCollapsibleState.None,
            skill,
          ),
      );
    }

    if (element.type === "availableGroup") {
      return this.available.map(
        (skill) =>
          new SkillTreeItem(
            "availableSkill",
            skill.name,
            vscode.TreeItemCollapsibleState.None,
            skill,
          ),
      );
    }

    return [];
  }
}
