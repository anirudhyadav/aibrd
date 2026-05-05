import * as vscode from 'vscode'
import { readCodeMap, codeMapExists } from '../core/codemap/store'
import { getAibrdDir, getWorkspaceRoot } from '../workspace/detector'

export async function commandShowCodeMap(): Promise<void> {
  const workspaceRoot = getWorkspaceRoot()
  const aibrdDir = getAibrdDir(workspaceRoot)

  if (!codeMapExists(aibrdDir)) {
    vscode.window.showWarningMessage(
      'aibrd: No code map found. Run "aibrd: Scan Codebase" first.'
    )
    return
  }

  const codeMap = readCodeMap(aibrdDir, workspaceRoot)

  const lines: string[] = [
    '# Code Map — BRD to Code Mapping',
    `_Last updated: ${codeMap.lastUpdated}_`,
    '',
    `**${codeMap.mappings.length}** requirements mapped to **${Object.keys(codeMap.fileIndex).length}** files`,
    ''
  ]

  // Summary table
  lines.push('## Requirement → Code Files', '')
  lines.push('| Requirement | Type | Files | Primary | Secondary | Tests |')
  lines.push('|-------------|------|-------|---------|-----------|-------|')

  for (const mapping of codeMap.mappings) {
    const primary = mapping.codeFiles.filter(f => f.relevance === 'primary').length
    const secondary = mapping.codeFiles.filter(f => f.relevance === 'secondary').length
    const tests = mapping.codeFiles.filter(f => f.relevance === 'test').length

    lines.push(
      `| **${mapping.requirementId}** | ${mapping.requirementType} | ` +
      `${mapping.codeFiles.length} | ${primary} | ${secondary} | ${tests} |`
    )
  }

  lines.push('')

  // File → Requirements reverse index
  lines.push('## Code File → Requirements', '')
  lines.push('| File | Requirements |')
  lines.push('|------|-------------|')

  const sortedFiles = Object.entries(codeMap.fileIndex)
    .sort((a, b) => b[1].length - a[1].length)

  for (const [file, reqIds] of sortedFiles) {
    lines.push(`| \`${file}\` | ${reqIds.join(', ')} |`)
  }

  lines.push('')

  // Detailed mappings
  lines.push('## Detailed Mappings', '')
  for (const mapping of codeMap.mappings) {
    lines.push(`### ${mapping.requirementId}: ${mapping.requirementSummary || mapping.requirementType}`, '')
    for (const file of mapping.codeFiles) {
      lines.push(`**\`${file.path}\`** (${file.relevance})`)
      if (file.symbols.length > 0) {
        for (const sym of file.symbols) {
          lines.push(`  - ${sym.kind}: \`${sym.name}\` (line ${sym.line})`)
        }
      }
      if (file.snippet) {
        lines.push(`  \`\`\`\n  ${file.snippet}\n  \`\`\``)
      }
      lines.push('')
    }
  }

  const doc = await vscode.workspace.openTextDocument({
    content: lines.join('\n'),
    language: 'markdown'
  })
  await vscode.window.showTextDocument(doc)
}
