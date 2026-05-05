import * as vscode from 'vscode'
import { analyzeImpact, formatImpactReport } from '../../core/codemap/impact_advisor'
import { readCodeMap } from '../../core/codemap/store'
import { getAibrdDir, getWorkspaceRoot } from '../../workspace/detector'

export async function handleImpact(
  request: vscode.ChatRequest,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<void> {
  const aibrdDir = getAibrdDir()
  const workspaceRoot = getWorkspaceRoot()
  const codeMap = readCodeMap(aibrdDir, workspaceRoot)

  if (codeMap.mappings.length === 0) {
    stream.markdown('No code map found. Run **aibrd: Scan Codebase** first to build the BRD-to-code mapping, then ask about impact.')
    return
  }

  const changeDescription = request.prompt
    .replace(/^impact\s*/i, '')
    .trim()

  if (!changeDescription) {
    stream.markdown('Describe the BRD change to analyze. Example:\n\n`@aibrd impact Users must now verify email before login`')
    return
  }

  stream.markdown('Analyzing impact of BRD change...\n\n')

  const impacts = await analyzeImpact(
    changeDescription,
    codeMap,
    workspaceRoot,
    token
  )

  const report = formatImpactReport(impacts)
  stream.markdown(report)
}
