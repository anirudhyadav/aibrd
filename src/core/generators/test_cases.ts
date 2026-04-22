import { BRDContent } from '../models/outputs'

export function generateTestCases(content: BRDContent, modulePrefix?: string): string {
  const lines: string[] = [
    '# Test Cases',
    `_Generated: ${new Date().toISOString().split('T')[0]}_`,
    ''
  ]

  for (const ac of content.criteria) {
    const tcId = ac.id.replace(/^AC/, modulePrefix ? `${modulePrefix}-TC` : 'TC')
    lines.push(`## ${tcId}`)
    lines.push(`_Traces: ${ac.id}${ac.relatedFlow ? `, ${ac.relatedFlow}` : ''}_`, '')
    lines.push('```gherkin')
    lines.push(`Scenario: ${ac.when}`)
    lines.push(`  Given ${ac.given}`)
    lines.push(`  When ${ac.when}`)
    lines.push(`  Then ${ac.then}`)
    lines.push('```', '')
  }

  for (const rule of content.rules) {
    const tcId = rule.id.replace(/^BR/, modulePrefix ? `${modulePrefix}-TC` : 'TC')
    lines.push(`## ${tcId}-boundary`)
    lines.push(`_Traces: ${rule.id}_`, '')
    lines.push('```gherkin')
    lines.push(`Scenario: Verify rule — ${rule.description.slice(0, 60)}`)
    lines.push(`  Given the system is operational`)
    lines.push(`  When the condition applies`)
    lines.push(`  Then the rule is enforced: ${rule.description}`)
    lines.push('```', '')
  }

  return lines.join('\n')
}
