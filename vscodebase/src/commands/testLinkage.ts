import * as vscode from 'vscode'
import * as path from 'path'
import { linkTestFiles, buildTestLinkageReport, formatTestLinkageReport } from '../core/analyzers/test_linkage'
import { getAibrdDir, detectMode } from '../workspace/detector'
import { listModules } from '../workspace/reader'
import { writeFile } from '../workspace/writer'

export async function commandTestLinkage(): Promise<void> {
  const aibrdDir = getAibrdDir()
  const mode = detectMode(aibrdDir)
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? ''

  let moduleSlug: string | undefined
  if (mode === 'modular') {
    const modules = listModules(aibrdDir)
    const picked = await vscode.window.showQuickPick(['All modules', ...modules], {
      placeHolder: 'Check test coverage for which module?'
    })
    if (!picked) return
    if (picked !== 'All modules') moduleSlug = picked
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aibrd: Linking test files to requirements...', cancellable: false },
    async () => {
      const slugs = moduleSlug
        ? [moduleSlug]
        : (mode === 'modular' ? listModules(aibrdDir) : [undefined])

      const allLinks = slugs.flatMap(slug =>
        linkTestFiles(aibrdDir, workspaceRoot, slug)
      )

      const report = buildTestLinkageReport(allLinks)
      const formatted = formatTestLinkageReport(report, moduleSlug)

      writeFile(path.join(aibrdDir, 'test-linkage-report.md'), formatted)

      const doc = await vscode.workspace.openTextDocument({ content: formatted, language: 'markdown' })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)

      const pct = allLinks.length ? Math.round((report.coveredCount / allLinks.length) * 100) : 0
      vscode.window.showInformationMessage(
        `aibrd: ${pct}% requirements covered by tests (${report.coveredCount}/${allLinks.length}). Saved to .aibrd/test-linkage-report.md`
      )
    }
  )
}
