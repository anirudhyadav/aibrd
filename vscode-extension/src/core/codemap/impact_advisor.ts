import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { callLLMJson } from '../../llm/client'
import { buildImpactPrompt } from '../../llm/context_builder'
import { CodeMap, ImpactAdvice } from '../models/codemap'

interface LLMImpactResult {
  impacts: Array<{
    requirementId: string
    requirementSummary: string
    changeDescription: string
    affectedFiles: Array<{
      path: string
      relevance: 'primary' | 'secondary' | 'test'
      symbols: string[]
      suggestedAction: string
    }>
    effort: 'low' | 'medium' | 'high'
    priority: 'critical' | 'important' | 'minor'
  }>
}

const SYSTEM = `You are a change impact analyst. Given a changed BRD requirement and the existing code map,
determine which code files need to be updated and what changes are needed.

For each affected file, provide:
- The file path from the code map
- Whether it's primary, secondary, or test impact
- Which symbols (functions, classes) need changes
- A specific suggested action (e.g. "Update validation logic in validateUser()")
- Overall effort estimate (low/medium/high)
- Priority (critical = breaks existing features, important = needed for correctness, minor = cosmetic/docs)

Return JSON: {
  "impacts": [{
    "requirementId": "BF-001",
    "requirementSummary": "...",
    "changeDescription": "what changed in this requirement",
    "affectedFiles": [{
      "path": "src/auth/login.ts",
      "relevance": "primary",
      "symbols": ["loginUser"],
      "suggestedAction": "Update loginUser() to handle new OTP flow"
    }],
    "effort": "medium",
    "priority": "critical"
  }]
}`

/**
 * Analyzes a changed BRD requirement against the code map to produce
 * a list of files that need updating, along with specific guidance.
 */
export async function analyzeImpact(
  changedRequirement: string,
  codeMap: CodeMap,
  workspaceRoot: string,
  token?: vscode.CancellationToken
): Promise<ImpactAdvice[]> {
  const codeMapSummary = buildCodeMapSummary(codeMap)
  const codeSnippets = gatherRelevantCode(codeMap, workspaceRoot)

  const prompt = buildImpactPrompt(changedRequirement, codeMapSummary, codeSnippets)
  const result = await callLLMJson<LLMImpactResult>(prompt, SYSTEM, token)
  return result.impacts
}

/**
 * Formats impact advice into a readable markdown report.
 */
export function formatImpactReport(impacts: ImpactAdvice[]): string {
  const lines: string[] = [
    '# Impact Advisor Report',
    `_Generated: ${new Date().toISOString().split('T')[0]}_`,
    ''
  ]

  if (impacts.length === 0) {
    lines.push('No code impact detected for this change.')
    return lines.join('\n')
  }

  const critical = impacts.filter(i => i.priority === 'critical')
  const important = impacts.filter(i => i.priority === 'important')
  const minor = impacts.filter(i => i.priority === 'minor')

  const totalFiles = impacts.reduce((sum, i) => sum + i.affectedFiles.length, 0)
  lines.push(`**Summary:** ${impacts.length} requirements affected, ${totalFiles} files to update`, '')

  if (critical.length > 0) {
    lines.push('## Critical Impact', '')
    for (const impact of critical) {
      lines.push(formatSingleImpact(impact))
    }
  }

  if (important.length > 0) {
    lines.push('## Important Changes', '')
    for (const impact of important) {
      lines.push(formatSingleImpact(impact))
    }
  }

  if (minor.length > 0) {
    lines.push('## Minor Updates', '')
    for (const impact of minor) {
      lines.push(formatSingleImpact(impact))
    }
  }

  return lines.join('\n')
}

function formatSingleImpact(impact: ImpactAdvice): string {
  const lines: string[] = [
    `### ${impact.requirementId}: ${impact.requirementSummary}`,
    `> ${impact.changeDescription}`,
    `> Effort: **${impact.effort}** | Priority: **${impact.priority}**`,
    '',
    '| File | Relevance | Symbols | Action |',
    '|------|-----------|---------|--------|'
  ]

  for (const file of impact.affectedFiles) {
    lines.push(`| \`${file.path}\` | ${file.relevance} | ${file.symbols.join(', ')} | ${file.suggestedAction} |`)
  }

  lines.push('')
  return lines.join('\n')
}

function buildCodeMapSummary(codeMap: CodeMap): string {
  const lines: string[] = ['# Code Map Summary\n']

  for (const mapping of codeMap.mappings) {
    lines.push(`## ${mapping.requirementId}: ${mapping.requirementSummary}`)
    for (const file of mapping.codeFiles) {
      const syms = file.symbols.map(s => s.name).join(', ')
      lines.push(`  - ${file.path} (${file.relevance}) — ${syms}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

function gatherRelevantCode(codeMap: CodeMap, workspaceRoot: string): string {
  const snippets: string[] = []
  const seen = new Set<string>()

  for (const mapping of codeMap.mappings) {
    for (const file of mapping.codeFiles) {
      if (seen.has(file.path)) continue
      seen.add(file.path)

      const fullPath = path.join(workspaceRoot, file.path)
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8')
        snippets.push(`--- ${file.path} ---\n${content.slice(0, 800)}`)
      }

      if (snippets.length >= 15) return snippets.join('\n\n')
    }
  }

  return snippets.join('\n\n')
}
