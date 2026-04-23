import * as vscode from 'vscode'
import { execSync } from 'child_process'
import { callLLM } from '../llm/client'
import { loadContextForQuery } from '../workspace/reader'
import { getAibrdDir, detectMode } from '../workspace/detector'

export async function commandPrDraft(): Promise<void> {
  const aibrdDir = getAibrdDir()
  const mode = detectMode(aibrdDir)
  const { content: contextContent } = loadContextForQuery(aibrdDir, mode)

  if (!contextContent.trim()) {
    vscode.window.showWarningMessage('aibrd: No .aibrd/ context found. Run aibrd: Initialize first.')
    return
  }

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath
  const range = await vscode.window.showInputBox({
    prompt: 'Git range for PR diff',
    value: 'HEAD~5..HEAD',
    placeHolder: 'e.g. main..HEAD or HEAD~10..HEAD',
    ignoreFocusOut: true
  })
  if (!range?.trim()) return

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aibrd: Drafting PR description...', cancellable: true },
    async (_, token) => {
      let gitDiff = ''
      try {
        gitDiff = execSync(`git diff ${range} --stat --diff-filter=AM`, {
          cwd: workspaceRoot, maxBuffer: 512 * 1024
        }).toString()

        const commitMessages = execSync(`git log ${range} --oneline`, {
          cwd: workspaceRoot
        }).toString()

        gitDiff = `COMMITS:\n${commitMessages}\n\nFILES CHANGED:\n${gitDiff}`
      } catch {
        vscode.window.showWarningMessage('aibrd: Could not read git diff.')
        return
      }

      const SYSTEM = `You are a senior engineer writing a pull request description.
Given the requirements context and git changes, generate a professional PR description.
Format as markdown with exactly these sections:
## What Changed
(bullet list of changes, reference requirement IDs like PAY-BF-001 wherever applicable)
## Requirements Covered
(table: | ID | Requirement | Status |)
## Test Coverage
(which test cases or ACs are satisfied)
## Notes
(anything the reviewer should know)`

      const prompt = `REQUIREMENTS:\n${contextContent.slice(0, 3000)}\n\nGIT CHANGES:\n${gitDiff.slice(0, 3000)}`
      const response = await callLLM(prompt, SYSTEM, token)

      const doc = await vscode.workspace.openTextDocument({
        content: response.text,
        language: 'markdown'
      })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)

      vscode.window.showInformationMessage('aibrd: PR description drafted. Copy it to your PR.')
    }
  )
}
