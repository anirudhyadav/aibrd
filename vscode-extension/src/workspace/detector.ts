import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { WorkspaceMode } from '../core/models/module'

export function getWorkspaceRoot(): string {
  const folders = vscode.workspace.workspaceFolders
  if (!folders || folders.length === 0) {
    throw new Error('No workspace folder open')
  }
  return folders[0].uri.fsPath
}

export function getAibrdDir(workspaceRoot?: string): string {
  const root = workspaceRoot ?? getWorkspaceRoot()
  return path.join(root, '.aibrd')
}

export function detectMode(aibrdDir: string): WorkspaceMode {
  const modulesDir = path.join(aibrdDir, 'modules')
  return fs.existsSync(modulesDir) ? 'modular' : 'flat'
}

export function isInitialized(aibrdDir: string): boolean {
  return fs.existsSync(path.join(aibrdDir, 'registry.json'))
}

export function inferModeFromBRD(text: string): WorkspaceMode {
  // heuristic: multiple major sections and large size suggest modular
  const sectionCount = (text.match(/^#{1,2}\s+/gm) ?? []).length
  const wordCount = text.split(/\s+/).length
  return sectionCount >= 5 && wordCount >= 2000 ? 'modular' : 'flat'
}
