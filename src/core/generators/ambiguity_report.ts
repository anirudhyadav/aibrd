import * as vscode from 'vscode'
import { callLLMJson } from '../../llm/client'
import { Ambiguity } from '../models/outputs'

const SYSTEM = `You are a business analyst reviewing a BRD for ambiguities.
Flag vague terms that lack measurable definitions (e.g. "fast", "intuitive", "soon", "large", "efficient").
Return JSON: {
  "ambiguities": [{
    "term": "the vague term",
    "context": "the sentence it appears in",
    "suggestion": "how to make it measurable"
  }]
}`

export async function detectAmbiguities(
  brdText: string,
  token?: vscode.CancellationToken
): Promise<Omit<Ambiguity, 'id'>[]> {
  const result = await callLLMJson<{ ambiguities: Omit<Ambiguity, 'id'>[] }>(
    brdText,
    SYSTEM,
    token
  )
  return result.ambiguities
}

export function formatAmbiguityReport(ambiguities: Ambiguity[]): string {
  const lines: string[] = [
    '# Ambiguity Report',
    `_Generated: ${new Date().toISOString().split('T')[0]}_`,
    '',
    '> Terms flagged as vague or unmeasurable. Resolve before sprint planning.',
    ''
  ]

  if (ambiguities.length === 0) {
    lines.push('No ambiguities detected.')
    return lines.join('\n')
  }

  for (const a of ambiguities) {
    lines.push(`## ${a.id}: "${a.term}"`)
    lines.push(`**Found in:** _${a.context}_`)
    lines.push(`**Suggestion:** ${a.suggestion}`)
    lines.push('')
  }

  return lines.join('\n')
}
