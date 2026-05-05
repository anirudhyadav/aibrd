import * as vscode from 'vscode'
import * as path from 'path'
import { detectStaleRequirements, buildStalenessReport, formatStalenessReport } from '../core/analyzers/stale_detector'
import { getAibrdDir, detectMode } from '../workspace/detector'
import { listModules } from '../workspace/reader'
import { writeFile } from '../workspace/writer'

export async function commandStaleDetector(): Promise<void> {
  const aibrdDir = getAibrdDir()
  const mode = detectMode(aibrdDir)
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? ''

  let moduleSlug: string | undefined
  if (mode === 'modular') {
    const modules = listModules(aibrdDir)
    const picked = await vscode.window.showQuickPick(['All modules', ...modules], {
      placeHolder: 'Check staleness for which module?'
    })
    if (!picked) return
    if (picked !== 'All modules') moduleSlug = picked
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aibrd: Checking requirement staleness...', cancellable: false },
    async () => {
      const slugs = moduleSlug
        ? [moduleSlug]
        : (mode === 'modular' ? listModules(aibrdDir) : [undefined])

      const allItems = slugs.flatMap(slug =>
        detectStaleRequirements(aibrdDir, workspaceRoot, slug)
      )

      const report = buildStalenessReport(allItems)
      const formatted = formatStalenessReport(report, moduleSlug)

      writeFile(path.join(aibrdDir, 'staleness-report.md'), formatted)

      const doc = await vscode.workspace.openTextDocument({ content: formatted, language: 'markdown' })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)

      const msg = report.staleCount
        ? `aibrd: ${report.staleCount} stale, ${report.driftedCount} drifting, ${report.okCount} ok. Saved to .aibrd/staleness-report.md`
        : `aibrd: All ${report.okCount} requirements are up to date. ✅`
      vscode.window.showInformationMessage(msg)
    }
  )
}
