import * as vscode from 'vscode'
import { detectGaps, formatGapReport } from '../../core/analyzers/gap_detector'
import { loadContextForQuery } from '../../workspace/reader'
import { getAibrdDir, detectMode } from '../../workspace/detector'

export async function handleCoverage(
  request: vscode.ChatRequest,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<void> {
  const aibrdDir = getAibrdDir()
  const mode = detectMode(aibrdDir)
  const { content } = loadContextForQuery(aibrdDir, mode)

  if (!content.trim()) {
    stream.markdown('No `.aibrd/` context found. Run **aibrd: Initialize from BRD** first.')
    return
  }

  const editor = vscode.window.activeTextEditor
  const codeSnippet = editor
    ? editor.document.getText(editor.selection.isEmpty ? undefined : editor.selection)
    : ''

  if (!codeSnippet) {
    stream.markdown('Open a file and optionally select code, then run `@aibrd coverage` to check requirement coverage.')
    return
  }

  stream.markdown('Checking coverage...\n\n')
  const gaps = await detectGaps(content, codeSnippet, token)
  stream.markdown(formatGapReport(gaps))
}
