import * as vscode from 'vscode'
import { scanAndBuildCodeMap } from '../core/codemap/engine'
import { writeCodeMap } from '../core/codemap/store'
import { loadContextForQuery } from '../workspace/reader'
import { getAibrdDir, getWorkspaceRoot, detectMode } from '../workspace/detector'

export async function commandScanCodebase(): Promise<void> {
  const workspaceRoot = getWorkspaceRoot()
  const aibrdDir = getAibrdDir(workspaceRoot)
  const mode = detectMode(aibrdDir)
  const { content } = loadContextForQuery(aibrdDir, mode)

  if (!content.trim()) {
    vscode.window.showWarningMessage(
      'aibrd: No CONTEXT.md found. Run "aibrd: Initialize from BRD" first.'
    )
    return
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'aibrd: Scanning codebase...',
      cancellable: true
    },
    async (progress, token) => {
      progress.report({ message: 'Discovering workspace files...' })

      const codeMap = await scanAndBuildCodeMap(workspaceRoot, content, token)

      if (token.isCancellationRequested) return

      // Enrich with requirement summaries from CONTEXT.md
      const idSummaries = extractIdSummaries(content)
      for (const mapping of codeMap.mappings) {
        if (idSummaries[mapping.requirementId]) {
          mapping.requirementSummary = idSummaries[mapping.requirementId]
        }
      }

      writeCodeMap(aibrdDir, codeMap)

      const fileCount = Object.keys(codeMap.fileIndex).length
      vscode.window.showInformationMessage(
        `aibrd: Code map built! ${codeMap.mappings.length} requirements mapped to ${fileCount} files. ` +
        `Saved to .aibrd/codemap.json`
      )
    }
  )
}

function extractIdSummaries(context: string): Record<string, string> {
  const summaries: Record<string, string> = {}
  const pattern = /###\s+([A-Z]{2,4}-(?:[A-Z]{2,3}-)?(?:\d{3}))(?::\s*(.+))?/g
  let match
  while ((match = pattern.exec(context)) !== null) {
    summaries[match[1]] = match[2]?.trim() ?? ''
  }
  return summaries
}
