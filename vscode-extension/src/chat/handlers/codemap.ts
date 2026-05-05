import * as vscode from 'vscode'
import * as path from 'path'
import { readCodeMap } from '../../core/codemap/store'
import { getAibrdDir, getWorkspaceRoot } from '../../workspace/detector'

export async function handleCodeMap(
  request: vscode.ChatRequest,
  stream: vscode.ChatResponseStream,
  _token: vscode.CancellationToken
): Promise<void> {
  const aibrdDir = getAibrdDir()
  const workspaceRoot = getWorkspaceRoot()
  const codeMap = readCodeMap(aibrdDir, workspaceRoot)

  if (codeMap.mappings.length === 0) {
    stream.markdown('No code map found. Run **aibrd: Scan Codebase** to build the BRD-to-code mapping.')
    return
  }

  const query = request.prompt.trim()

  // Check if user is asking about a specific requirement ID
  const idMatch = query.match(/\b([A-Z]{2,4}-(?:[A-Z]{2,3}-)?(?:\d{3}))\b/i)
  if (idMatch) {
    const reqId = idMatch[1].toUpperCase()
    const mapping = codeMap.mappings.find(m => m.requirementId === reqId)

    if (!mapping) {
      stream.markdown(`No code mapping found for **${reqId}**.`)
      return
    }

    stream.markdown(`## Code Map: ${reqId}\n\n`)
    stream.markdown(`**${mapping.requirementSummary || 'No summary'}**\n\n`)
    stream.markdown(`| File | Relevance | Symbols |\n|------|-----------|--------|\n`)

    for (const file of mapping.codeFiles) {
      const syms = file.symbols.map(s => `\`${s.name}\``).join(', ')
      stream.markdown(`| \`${file.path}\` | ${file.relevance} | ${syms} |\n`)
    }
    return
  }

  // Check if user is asking about the current file
  const editor = vscode.window.activeTextEditor
  if (query.includes('this file') || query.includes('current file') || query === 'codemap') {
    if (editor) {
      const filePath = path.relative(workspaceRoot, editor.document.fileName)
      const reqIds = codeMap.fileIndex[filePath]

      if (reqIds && reqIds.length > 0) {
        stream.markdown(`## Requirements mapped to \`${filePath}\`\n\n`)
        for (const id of reqIds) {
          const mapping = codeMap.mappings.find(m => m.requirementId === id)
          stream.markdown(`- **${id}**: ${mapping?.requirementSummary || 'No summary'}\n`)
        }
      } else {
        stream.markdown(`No requirements mapped to \`${filePath}\`. Run **aibrd: Scan Codebase** to update.`)
      }
      return
    }
  }

  // Show overview
  stream.markdown('## Code Map Overview\n\n')
  stream.markdown(`**${codeMap.mappings.length}** requirements mapped to **${Object.keys(codeMap.fileIndex).length}** files\n\n`)
  stream.markdown(`Last updated: ${codeMap.lastUpdated}\n\n`)

  for (const mapping of codeMap.mappings.slice(0, 20)) {
    stream.markdown(`- **${mapping.requirementId}** → ${mapping.codeFiles.map(f => `\`${f.path}\``).join(', ')}\n`)
  }

  if (codeMap.mappings.length > 20) {
    stream.markdown(`\n...and ${codeMap.mappings.length - 20} more. Use \`@aibrd codemap <ID>\` to query specific requirements.`)
  }
}
