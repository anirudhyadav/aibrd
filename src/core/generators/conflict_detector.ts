import * as vscode from 'vscode'
import { callLLMJson } from '../../llm/client'
import { Conflict, BusinessRule } from '../models/outputs'

const SYSTEM = `You are a business analyst reviewing business rules for contradictions.
Find pairs of rules that directly conflict with each other.
Return JSON: {
  "conflicts": [{
    "ruleA": "rule ID or description",
    "ruleB": "rule ID or description",
    "description": "why they conflict"
  }]
}`

export async function detectConflicts(
  rules: BusinessRule[],
  token?: vscode.CancellationToken
): Promise<Conflict[]> {
  if (rules.length < 2) return []

  const rulesText = rules
    .map(r => `${r.id}: ${r.description}`)
    .join('\n')

  const result = await callLLMJson<{ conflicts: Conflict[] }>(
    rulesText,
    SYSTEM,
    token
  )
  return result.conflicts
}

export function formatConflictReport(conflicts: Conflict[]): string {
  const lines: string[] = [
    '# Conflict Report',
    `_Generated: ${new Date().toISOString().split('T')[0]}_`,
    ''
  ]

  if (conflicts.length === 0) {
    lines.push('No conflicts detected.')
    return lines.join('\n')
  }

  lines.push('> The following rule pairs contradict each other. Resolve before development.', '')

  for (let i = 0; i < conflicts.length; i++) {
    const c = conflicts[i]
    lines.push(`## Conflict ${i + 1}`)
    lines.push(`- **Rule A:** ${c.ruleA}`)
    lines.push(`- **Rule B:** ${c.ruleB}`)
    lines.push(`- **Issue:** ${c.description}`)
    lines.push('')
  }

  return lines.join('\n')
}
