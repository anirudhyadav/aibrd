import * as vscode from 'vscode'
import * as path from 'path'
import { CodeMap, RequirementMapping, CodeFileMapping } from '../core/models/codemap'
import { readCodeMap } from '../core/codemap/store'
import { getAibrdDir, getWorkspaceRoot } from '../workspace/detector'

type CodeMapNode = RequirementNode | FileNode

interface RequirementNode {
  type: 'requirement'
  mapping: RequirementMapping
}

interface FileNode {
  type: 'file'
  file: CodeFileMapping
  requirementId: string
}

export class CodeMapTreeProvider implements vscode.TreeDataProvider<CodeMapNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<CodeMapNode | undefined>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined)
  }

  getTreeItem(element: CodeMapNode): vscode.TreeItem {
    if (element.type === 'requirement') {
      const m = element.mapping
      const item = new vscode.TreeItem(
        `${m.requirementId}: ${m.requirementSummary || m.requirementType}`,
        vscode.TreeItemCollapsibleState.Collapsed
      )
      item.tooltip = `${m.codeFiles.length} file(s) mapped`
      item.iconPath = new vscode.ThemeIcon('symbol-structure')
      return item
    }

    const f = element.file
    const item = new vscode.TreeItem(
      f.path,
      vscode.TreeItemCollapsibleState.None
    )
    item.description = `${f.relevance} (${f.symbols.length} symbols)`
    item.tooltip = f.symbols.map(s => `${s.kind}: ${s.name}`).join('\n')
    item.iconPath = new vscode.ThemeIcon(
      f.relevance === 'primary' ? 'file-code' :
      f.relevance === 'test' ? 'beaker' : 'file'
    )

    try {
      const workspaceRoot = getWorkspaceRoot()
      const fullPath = path.join(workspaceRoot, f.path)
      item.command = {
        title: 'Open File',
        command: 'vscode.open',
        arguments: [vscode.Uri.file(fullPath)]
      }
    } catch {
      // workspace not available
    }

    return item
  }

  getChildren(element?: CodeMapNode): CodeMapNode[] {
    if (!element) {
      try {
        const aibrdDir = getAibrdDir()
        const workspaceRoot = getWorkspaceRoot()
        const codeMap: CodeMap = readCodeMap(aibrdDir, workspaceRoot)

        return codeMap.mappings.map(m => ({
          type: 'requirement' as const,
          mapping: m
        }))
      } catch {
        return []
      }
    }

    if (element.type === 'requirement') {
      return element.mapping.codeFiles.map(f => ({
        type: 'file' as const,
        file: f,
        requirementId: element.mapping.requirementId
      }))
    }

    return []
  }
}
