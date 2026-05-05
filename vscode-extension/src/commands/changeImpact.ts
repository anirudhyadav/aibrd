import * as vscode from 'vscode'
import * as path from 'path'
import { parsePdf } from '../core/parsers/pdf'
import { parseDocx } from '../core/parsers/docx'
import { parseMarkdown } from '../core/parsers/markdown'
import { analyzeChangeImpact, formatImpactReport } from '../core/analyzers/change_impact'
import { loadContextForQuery } from '../workspace/reader'
import { getAibrdDir, detectMode } from '../workspace/detector'
import { writeFile } from '../workspace/writer'

export async function commandChangeImpact(context: vscode.ExtensionContext): Promise<void> {
  const aibrdDir = getAibrdDir()
  const mode = detectMode(aibrdDir)
  const { content: existingContext } = loadContextForQuery(aibrdDir, mode)

  if (!existingContext.trim()) {
    vscode.window.showWarningMessage('aibrd: No .aibrd/ context found. Run aibrd: Initialize first.')
    return
  }

  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: { 'New BRD Version': ['pdf', 'docx', 'doc', 'md'] },
    title: 'Select new BRD version to compare'
  })
  if (!uris || uris.length === 0) return

  const filePath = uris[0].fsPath
  const ext = path.extname(filePath).toLowerCase()

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aibrd: Analysing change impact...', cancellable: true },
    async (_, token) => {
      const rawBRD =
        ext === '.pdf' ? await parsePdf(filePath) :
        ext === '.md'  ? parseMarkdown(filePath) :
        await parseDocx(filePath)

      const impacts = await analyzeChangeImpact(existingContext, rawBRD.text, token)
      const report  = formatImpactReport(impacts)

      const outPath = `${aibrdDir}/change-impact-report.md`
      writeFile(outPath, report)

      const doc = await vscode.workspace.openTextDocument({ content: report, language: 'markdown' })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)

      const breaking = impacts.filter(i => i.impactType === 'breaking').length
      vscode.window.showInformationMessage(
        `aibrd: Impact analysis complete — ${breaking} breaking change(s). Saved to .aibrd/change-impact-report.md`
      )
    }
  )
}
