import * as vscode from 'vscode'
import { analyzeImpact, formatImpactReport } from '../core/codemap/impact_advisor'
import { readCodeMap, codeMapExists } from '../core/codemap/store'
import { getAibrdDir, getWorkspaceRoot } from '../workspace/detector'

export async function commandImpactAdvisor(): Promise<void> {
  const workspaceRoot = getWorkspaceRoot()
  const aibrdDir = getAibrdDir(workspaceRoot)

  if (!codeMapExists(aibrdDir)) {
    vscode.window.showWarningMessage(
      'aibrd: No code map found. Run "aibrd: Scan Codebase" first.'
    )
    return
  }

  const input = await vscode.window.showInputBox({
    prompt: 'Describe the BRD change (e.g. "Users must verify email before login")',
    placeHolder: 'e.g. Payment timeout changed from 30s to 60s',
    ignoreFocusOut: true
  })
  if (!input?.trim()) return

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'aibrd: Analyzing impact...',
      cancellable: true
    },
    async (_progress, token) => {
      const codeMap = readCodeMap(aibrdDir, workspaceRoot)
      const impacts = await analyzeImpact(input, codeMap, workspaceRoot, token)
      const report = formatImpactReport(impacts)

      const doc = await vscode.workspace.openTextDocument({
        content: report,
        language: 'markdown'
      })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)
    }
  )
}
