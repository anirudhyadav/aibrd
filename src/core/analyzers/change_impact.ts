import * as vscode from 'vscode'
import { callLLMJson } from '../../llm/client'

export interface ImpactResult {
  affectedId: string
  affectedName: string
  impactType: 'breaking' | 'modified' | 'new'
  description: string
}

const SYSTEM = `You are a business analyst comparing two versions of a BRD.
Identify which requirements changed, were added, or conflict between versions.
Return JSON: {
  "impacts": [{
    "affectedId": "BF-001 or BR-002 etc",
    "affectedName": "...",
    "impactType": "breaking|modified|new",
    "description": "what changed and what it affects"
  }]
}`

export async function analyzeChangeImpact(
  oldContext: string,
  newBRDText: string,
  token?: vscode.CancellationToken
): Promise<ImpactResult[]> {
  const prompt = `OLD VERSION:\n${oldContext.slice(0, 4000)}\n\nNEW VERSION:\n${newBRDText.slice(0, 4000)}`
  const result = await callLLMJson<{ impacts: ImpactResult[] }>(prompt, SYSTEM, token)
  return result.impacts
}

export function formatImpactReport(impacts: ImpactResult[]): string {
  const lines: string[] = [
    '# Change Impact Report',
    `_Generated: ${new Date().toISOString().split('T')[0]}_`,
    ''
  ]

  const breaking = impacts.filter(i => i.impactType === 'breaking')
  const modified = impacts.filter(i => i.impactType === 'modified')
  const added = impacts.filter(i => i.impactType === 'new')

  if (breaking.length > 0) {
    lines.push('## 🔴 Breaking Changes', '')
    for (const i of breaking) {
      lines.push(`- **${i.affectedId}** ${i.affectedName}: ${i.description}`)
    }
    lines.push('')
  }

  if (modified.length > 0) {
    lines.push('## 🟡 Modified Requirements', '')
    for (const i of modified) {
      lines.push(`- **${i.affectedId}** ${i.affectedName}: ${i.description}`)
    }
    lines.push('')
  }

  if (added.length > 0) {
    lines.push('## 🟢 New Requirements', '')
    for (const i of added) {
      lines.push(`- **${i.affectedId}** ${i.affectedName}: ${i.description}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
