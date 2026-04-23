import * as vscode from 'vscode'
import { callLLMJson } from '../../llm/client'
import { BRDContent } from '../models/outputs'

export type ComplianceFramework = 'GDPR' | 'WCAG' | 'HIPAA' | 'SOX' | 'PCI-DSS' | 'ISO27001'

export interface ComplianceTag {
  requirementId: string
  requirementSummary: string
  framework: ComplianceFramework
  clause: string
  rationale: string
  risk: 'high' | 'medium' | 'low'
}

const SYSTEM = `You are a compliance specialist mapping business requirements to regulatory frameworks.
For each requirement, identify which compliance clauses apply.
Only tag requirements that have a genuine compliance relevance.
Return JSON: { "tags": [{
  "requirementId": "...",
  "requirementSummary": "...",
  "framework": "GDPR|WCAG|HIPAA|SOX|PCI-DSS|ISO27001",
  "clause": "e.g. GDPR Art. 17 — Right to erasure",
  "rationale": "why this applies",
  "risk": "high|medium|low"
}]}`

export async function mapCompliance(
  contents: BRDContent[],
  frameworks: ComplianceFramework[],
  token?: vscode.CancellationToken
): Promise<ComplianceTag[]> {
  const allItems = contents.flatMap(c => [
    ...c.flows.map(f => `${f.id}: ${f.name} — ${f.description}`),
    ...c.rules.map(r => `${r.id}: ${r.description}`)
  ]).join('\n')

  const prompt = `FRAMEWORKS TO CHECK: ${frameworks.join(', ')}\n\nREQUIREMENTS:\n${allItems}`
  const raw = await callLLMJson<{ tags: ComplianceTag[] }>(prompt, SYSTEM, token)
  return raw.tags
}

export function formatComplianceMap(tags: ComplianceTag[]): string {
  const today = new Date().toISOString().split('T')[0]
  const lines = [
    '# Compliance Map',
    `_Generated: ${today}_`,
    '',
    '> Auto-generated mapping. Validate with your compliance team before submission.',
    ''
  ]

  if (!tags.length) {
    lines.push('No compliance tags detected for the selected frameworks.')
    return lines.join('\n')
  }

  // group by framework
  const byFramework = tags.reduce((acc, t) => {
    acc[t.framework] = acc[t.framework] ?? []
    acc[t.framework].push(t)
    return acc
  }, {} as Record<string, ComplianceTag[]>)

  for (const [fw, fwTags] of Object.entries(byFramework)) {
    lines.push(`## ${fw}`, '')
    lines.push('| Requirement | Clause | Risk | Rationale |')
    lines.push('|---|---|---|---|')
    for (const t of fwTags) {
      const risk = t.risk === 'high' ? '🔴' : t.risk === 'medium' ? '🟡' : '🟢'
      lines.push(`| ${t.requirementId}: ${t.requirementSummary.slice(0, 50)} | ${t.clause} | ${risk} ${t.risk} | ${t.rationale} |`)
    }
    lines.push('')
  }

  const highRisk = tags.filter(t => t.risk === 'high')
  if (highRisk.length) {
    lines.push('## 🔴 High Risk Items — Action Required', '')
    for (const t of highRisk) {
      lines.push(`- **${t.requirementId}** (${t.framework} ${t.clause}): ${t.rationale}`)
    }
  }

  return lines.join('\n')
}
