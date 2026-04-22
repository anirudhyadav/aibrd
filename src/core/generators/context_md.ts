import { BRDContent } from '../models/outputs'

export function generateContextMd(content: BRDContent, version: string): string {
  const now = new Date().toISOString().split('T')[0]
  const moduleLabel = content.moduleSlug
    ? `Module: ${content.moduleSlug} | `
    : ''

  const lines: string[] = [
    `# CONTEXT.md`,
    `_${moduleLabel}v${version} | Updated: ${now}_`,
    ''
  ]

  if (content.actors.length > 0) {
    lines.push('## Actors', '')
    for (const a of content.actors) {
      lines.push(`- **${a.id}**: ${a.name} — ${a.description}`)
    }
    lines.push('')
  }

  if (content.flows.length > 0) {
    lines.push('## Business Flows', '')
    for (const f of content.flows) {
      lines.push(`### ${f.id}: ${f.name}`)
      lines.push(`${f.description}`, '')
      if (f.steps.length > 0) {
        lines.push('**Steps:**')
        for (const s of f.steps) {
          const actor = s.actor ? ` _(${s.actor})_` : ''
          lines.push(`${s.order}. ${s.description}${actor}`)
        }
        lines.push('')
      }
      if (f.relatedRules.length > 0) {
        lines.push(`_Rules: ${f.relatedRules.join(', ')}_`)
      }
      if (f.relatedAC.length > 0) {
        lines.push(`_AC: ${f.relatedAC.join(', ')}_`)
      }
      lines.push('')
    }
  }

  if (content.rules.length > 0) {
    lines.push('## Business Rules', '')
    for (const r of content.rules) {
      lines.push(`### ${r.id}`)
      lines.push(r.description)
      if (r.rationale) lines.push(`> ${r.rationale}`)
      if (r.relatedFlows.length > 0) {
        lines.push(`_Flows: ${r.relatedFlows.join(', ')}_`)
      }
      lines.push('')
    }
  }

  if (content.criteria.length > 0) {
    lines.push('## Acceptance Criteria', '')
    for (const ac of content.criteria) {
      lines.push(`### ${ac.id}`)
      lines.push(`- **Given** ${ac.given}`)
      lines.push(`- **When** ${ac.when}`)
      lines.push(`- **Then** ${ac.then}`)
      if (ac.relatedFlow) lines.push(`_Flow: ${ac.relatedFlow}_`)
      if (ac.relatedRules.length > 0) lines.push(`_Rules: ${ac.relatedRules.join(', ')}_`)
      lines.push('')
    }
  }

  lines.push('## Changelog', '')
  lines.push(`- ${now} v${version}: Initial generation from BRD`, '')

  return lines.join('\n')
}

export function generateChangelogEntry(
  version: string,
  description: string
): string {
  const now = new Date().toISOString().split('T')[0]
  return `- ${now} v${version}: ${description}`
}
