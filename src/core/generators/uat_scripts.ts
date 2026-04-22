import { BRDContent } from '../models/outputs'

export function generateUATScripts(content: BRDContent): string {
  const lines: string[] = [
    '# UAT Scripts',
    `_Generated: ${new Date().toISOString().split('T')[0]}_`,
    '',
    '> Step-by-step scripts for UAT team. No technical knowledge required.',
    ''
  ]

  for (const flow of content.flows) {
    lines.push(`## ${flow.id}: ${flow.name}`, '')
    lines.push('**Pre-conditions:**')
    lines.push('- System is accessible and user is logged in (if applicable)', '')
    lines.push('**Steps:**', '')

    for (const step of flow.steps) {
      lines.push(`${step.order}. ${step.description}`)
      lines.push(`   - _Expected: Action completes without error_`, '')
    }

    const relatedAC = content.criteria.filter(ac => ac.relatedFlow === flow.id)
    if (relatedAC.length > 0) {
      lines.push('**Acceptance Checks:**', '')
      for (const ac of relatedAC) {
        lines.push(`- [ ] ${ac.id}: ${ac.then}`)
      }
    }

    lines.push('', '---', '')
  }

  return lines.join('\n')
}
