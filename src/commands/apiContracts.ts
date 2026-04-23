import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import { deriveApiContracts, formatApiContractsAsOpenApi, formatApiContractsAsMarkdown } from '../core/generators/api_contracts'
import { getAibrdDir, detectMode } from '../workspace/detector'
import { listModules } from '../workspace/reader'
import { writeFile } from '../workspace/writer'
import { BRDContent, AcceptanceCriteria, BusinessFlow, BusinessRule } from '../core/models/outputs'

export async function commandApiContracts(): Promise<void> {
  const aibrdDir = getAibrdDir()
  const mode = detectMode(aibrdDir)
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? ''
  const projectName = path.basename(workspaceRoot)

  let moduleSlug: string | undefined
  if (mode === 'modular') {
    const modules = listModules(aibrdDir)
    const picked = await vscode.window.showQuickPick(modules, {
      placeHolder: 'Derive API contracts for which module?'
    })
    if (!picked) return
    moduleSlug = picked
  }

  const format = await vscode.window.showQuickPick(
    ['OpenAPI 3.0 (YAML)', 'Markdown (human-readable)'],
    { placeHolder: 'Output format?' }
  )
  if (!format) return

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aibrd: Deriving API contracts...', cancellable: true },
    async (_, token) => {
      const ctxPath = moduleSlug
        ? path.join(aibrdDir, 'modules', moduleSlug, 'CONTEXT.md')
        : path.join(aibrdDir, 'CONTEXT.md')

      const content = parseContextToContent(ctxPath, moduleSlug)
      const endpoints = await deriveApiContracts(content, token)

      if (!endpoints.length) {
        vscode.window.showWarningMessage('aibrd: No business flows found to derive API contracts from.')
        return
      }

      let report: string
      let filename: string

      if (format === 'OpenAPI 3.0 (YAML)') {
        report = formatApiContractsAsOpenApi(endpoints, projectName, moduleSlug)
        filename = moduleSlug ? `${moduleSlug}-openapi.yaml` : 'openapi.yaml'
      } else {
        report = formatApiContractsAsMarkdown(endpoints)
        filename = moduleSlug ? `${moduleSlug}-api-contracts.md` : 'api-contracts.md'
      }

      writeFile(path.join(aibrdDir, filename), report)

      const language = format.startsWith('OpenAPI') ? 'yaml' : 'markdown'
      const doc = await vscode.workspace.openTextDocument({ content: report, language })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)
      vscode.window.showInformationMessage(
        `aibrd: ${endpoints.length} API endpoints derived. Saved to .aibrd/${filename}`
      )
    }
  )
}

function parseContextToContent(ctxPath: string, slug?: string): BRDContent {
  if (!fs.existsSync(ctxPath)) return { actors: [], flows: [], rules: [], criteria: [], features: [] }
  const text = fs.readFileSync(ctxPath, 'utf-8')
  const flows: BusinessFlow[] = []
  const rules: BusinessRule[] = []
  const criteria: AcceptanceCriteria[] = []

  for (const m of text.matchAll(/###\s+((?:[A-Z]+-)?BF-\d+):\s*(.+)/g)) {
    const id = m[1], name = m[2]
    // extract steps if present
    const steps: import('../core/models/outputs').FlowStep[] = []
    const blockMatch = text.match(new RegExp(`###\\s+${id}:[\\s\\S]*?(?=###|\\n##|$)`))
    if (blockMatch) {
      for (const sm of blockMatch[0].matchAll(/\d+\.\s+(.+)/g)) {
        steps.push({ order: steps.length + 1, description: sm[1], actor: '' })
      }
    }
    flows.push({ id, name, description: name, actors: [], steps, relatedRules: [], relatedAC: [] })
  }
  for (const m of text.matchAll(/###\s+((?:[A-Z]+-)?BR-\d+)\n([^\n]+)/g)) {
    rules.push({ id: m[1], description: m[2], relatedFlows: [] })
  }
  for (const m of text.matchAll(/###\s+((?:[A-Z]+-)?AC-\d+)([\s\S]*?)(?=###|\n##|$)/g)) {
    const block = m[2]
    const given = block.match(/\*\*Given\*\*\s+(.+)/)?.[1] ?? ''
    const when  = block.match(/\*\*When\*\*\s+(.+)/)?.[1] ?? ''
    const then  = block.match(/\*\*Then\*\*\s+(.+)/)?.[1] ?? ''
    criteria.push({ id: m[1], given, when, then, relatedFlow: '', relatedRules: [] })
  }

  return { moduleSlug: slug, actors: [], flows, rules, criteria, features: [] }
}
