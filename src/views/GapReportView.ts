import * as vscode from 'vscode'
import { detectGaps, formatGapReport } from '../core/analyzers/gap_detector'
import { loadContextForQuery } from '../workspace/reader'
import { getAibrdDir, detectMode } from '../workspace/detector'

export async function showGapReport(token: vscode.CancellationToken): Promise<void> {
  const aibrdDir = getAibrdDir()
  const mode = detectMode(aibrdDir)
  const { content } = loadContextForQuery(aibrdDir, mode)

  if (!content.trim()) {
    vscode.window.showWarningMessage('aibrd: No context found. Run aibrd: Initialize first.')
    return
  }

  const editor = vscode.window.activeTextEditor
  if (!editor) {
    vscode.window.showWarningMessage('aibrd: Open a source file to check coverage.')
    return
  }

  const codeText = editor.document.getText()
  const fileName = editor.document.fileName

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aibrd: Analyzing coverage...', cancellable: true },
    async (_, t) => {
      const gaps = await detectGaps(content, `// File: ${fileName}\n${codeText.slice(0, 8000)}`, t)
      const report = formatGapReport(gaps)

      const doc = await vscode.workspace.openTextDocument({
        content: report,
        language: 'markdown'
      })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)
    }
  )
}
