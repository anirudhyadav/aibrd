import * as vscode from 'vscode'
import { callLLMJson } from '../../llm/client'
import { buildGapPrompt } from '../../llm/context_builder'

export interface GapResult {
  requirementId: string
  requirementSummary: string
  status: 'covered' | 'partial' | 'missing'
  reason: string
}

const SYSTEM = `You are a software auditor. Compare requirements against code.
For each requirement, determine if the code covers it.
Return JSON: {
  "gaps": [{
    "requirementId": "...",
    "requirementSummary": "...",
    "status": "covered|partial|missing",
    "reason": "..."
  }]
}`

export async function detectGaps(
  contextContent: string,
  codeSnippets: string,
  token?: vscode.CancellationToken
): Promise<GapResult[]> {
  const prompt = buildGapPrompt(contextContent, codeSnippets)
  const result = await callLLMJson<{ gaps: GapResult[] }>(prompt, SYSTEM, token)
  return result.gaps
}

export function formatGapReport(gaps: GapResult[]): string {
  const lines: string[] = [
    '# Gap Report',
    `_Generated: ${new Date().toISOString().split('T')[0]}_`,
    ''
  ]

  const missing = gaps.filter(g => g.status === 'missing')
  const partial = gaps.filter(g => g.status === 'partial')
  const covered = gaps.filter(g => g.status === 'covered')

  lines.push(`**Summary:** ${covered.length} covered · ${partial.length} partial · ${missing.length} missing`, '')

  if (missing.length > 0) {
    lines.push('## ❌ Missing Coverage', '')
    for (const g of missing) {
      lines.push(`### ${g.requirementId}: ${g.requirementSummary}`)
      lines.push(`${g.reason}`, '')
    }
  }

  if (partial.length > 0) {
    lines.push('## ⚠️ Partial Coverage', '')
    for (const g of partial) {
      lines.push(`### ${g.requirementId}: ${g.requirementSummary}`)
      lines.push(`${g.reason}`, '')
    }
  }

  return lines.join('\n')
}
