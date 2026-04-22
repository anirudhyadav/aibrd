import { BRDContent, RTMEntry } from '../models/outputs'

export function generateRTM(
  contents: BRDContent[],
  projectName: string
): string {
  const entries = buildRTMEntries(contents)
  const now = new Date().toISOString().split('T')[0]

  const lines: string[] = [
    '# index.md — Requirement Traceability Matrix',
    `_Project: ${projectName} | Updated: ${now}_`,
    ''
  ]

  const modules = [...new Set(contents.map(c => c.moduleSlug).filter(Boolean))]
  if (modules.length > 0) {
    lines.push('## Modules', '')
    for (const slug of modules) {
      lines.push(`- [${slug}](modules/${slug}/CONTEXT.md)`)
    }
    lines.push('')
  }

  lines.push('## Traceability Matrix', '')
  lines.push('| ID | Requirement | Test Cases | Status |')
  lines.push('|---|---|---|---|')

  for (const entry of entries) {
    const tests = entry.testCaseIds.length > 0 ? entry.testCaseIds.join(', ') : '—'
    const status = entry.status === 'covered' ? '✅' : entry.status === 'partial' ? '⚠️' : '❌'
    lines.push(`| ${entry.requirementId} | ${entry.requirementName} | ${tests} | ${status} |`)
  }

  lines.push('')
  lines.push('_Status: ✅ Covered · ⚠️ Partial · ❌ Missing_')

  return lines.join('\n')
}

function buildRTMEntries(contents: BRDContent[]): RTMEntry[] {
  const entries: RTMEntry[] = []

  for (const content of contents) {
    for (const flow of content.flows) {
      const relatedTC = content.criteria
        .filter(ac => ac.relatedFlow === flow.id)
        .map(ac => ac.id.replace('AC', 'TC'))
      entries.push({
        requirementId: flow.id,
        requirementName: flow.name,
        testCaseIds: relatedTC,
        codeFiles: [],
        status: relatedTC.length > 0 ? 'covered' : 'missing'
      })
    }

    for (const rule of content.rules) {
      entries.push({
        requirementId: rule.id,
        requirementName: rule.description.slice(0, 60),
        testCaseIds: [],
        codeFiles: [],
        status: 'missing'
      })
    }
  }

  return entries
}
