import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { getAibrdDir, detectMode } from '../workspace/detector'
import { listModules } from '../workspace/reader'

class RtmItem extends vscode.TreeItem {
  constructor(
    label: string,
    collapsible: vscode.TreeItemCollapsibleState,
    public readonly itemType: 'module' | 'requirement' | 'empty',
    public readonly filePath?: string
  ) {
    super(label, collapsible)
    if (filePath) {
      this.command = {
        command: 'vscode.open',
        title: 'Open',
        arguments: [vscode.Uri.file(filePath)]
      }
    }
    this.iconPath = itemType === 'module'
      ? new vscode.ThemeIcon('folder')
      : itemType === 'requirement'
      ? new vscode.ThemeIcon('list-unordered')
      : new vscode.ThemeIcon('info')
  }
}

export class RtmTreeProvider implements vscode.TreeDataProvider<RtmItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<RtmItem | undefined>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined)
  }

  getTreeItem(element: RtmItem): vscode.TreeItem {
    return element
  }

  getChildren(element?: RtmItem): RtmItem[] {
    try {
      const aibrdDir = getAibrdDir()
      const mode = detectMode(aibrdDir)

      if (!element) {
        if (mode === 'modular') {
          return listModules(aibrdDir).map(slug =>
            new RtmItem(slug, vscode.TreeItemCollapsibleState.Collapsed, 'module',
              path.join(aibrdDir, 'modules', slug, 'CONTEXT.md'))
          )
        }
        return this.getRequirementsFromFile(path.join(aibrdDir, 'CONTEXT.md'))
      }

      if (element.itemType === 'module' && element.filePath) {
        return this.getRequirementsFromFile(element.filePath)
      }
    } catch {
      // no workspace open
    }
    return []
  }

  private getRequirementsFromFile(contextPath: string): RtmItem[] {
    if (!fs.existsSync(contextPath)) {
      return [new RtmItem('No CONTEXT.md found', vscode.TreeItemCollapsibleState.None, 'empty')]
    }
    const content = fs.readFileSync(contextPath, 'utf-8')
    const matches = [...content.matchAll(/###\s+([A-Z]+-[A-Z]+-\d+|[A-Z]+-\d+)[:\s]+(.+)/g)]
    if (matches.length === 0) {
      return [new RtmItem('No requirements found', vscode.TreeItemCollapsibleState.None, 'empty')]
    }
    return matches.map(m =>
      new RtmItem(`${m[1]}: ${m[2].trim()}`, vscode.TreeItemCollapsibleState.None, 'requirement', contextPath)
    )
  }
}
