import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import { generateTestCases } from '../core/generators/test_cases'
import { getAibrdDir, detectMode } from '../workspace/detector'
import { listModules, loadModuleContext } from '../workspace/reader'
import { writeTestCases } from '../workspace/writer'
import { readRegistry } from '../core/registry'
import { BRDContent } from '../core/models/outputs'

export async function commandGenerateTests(): Promise<void> {
  const aibrdDir = getAibrdDir()
  const mode = detectMode(aibrdDir)

  let moduleSlug: string | undefined
  let modulePrefix: string | undefined

  if (mode === 'modular') {
    const modules = listModules(aibrdDir)
    if (modules.length === 0) {
      vscode.window.showWarningMessage('aibrd: No modules found. Run aibrd: Initialize first.')
      return
    }

    const picked = await vscode.window.showQuickPick(
      ['All modules', ...modules],
      { placeHolder: 'Select module to generate tests for' }
    )
    if (!picked) return

    if (picked !== 'All modules') {
      moduleSlug = picked
      const registry = readRegistry(aibrdDir)
      modulePrefix = registry.modules[moduleSlug]?.prefix
    }
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aibrd: Generating test cases...', cancellable: false },
    async () => {
      const targetModules = moduleSlug ? [moduleSlug] : (mode === 'modular' ? listModules(aibrdDir) : [undefined])

      for (const slug of targetModules) {
        const contextMd = slug
          ? loadModuleContext(aibrdDir, slug)
          : readFlatContext(aibrdDir)

        const content = parseContextToContent(contextMd)
        const registry = readRegistry(aibrdDir)
        const prefix = slug ? registry.modules[slug]?.prefix : undefined
        const testMd = generateTestCases(content, prefix)
        writeTestCases(aibrdDir, testMd, slug)
      }

      vscode.window.showInformationMessage('aibrd: Test cases generated successfully.')
    }
  )
}

function readFlatContext(aibrdDir: string): string {
  const contextPath = path.join(aibrdDir, 'CONTEXT.md')
  return fs.existsSync(contextPath) ? fs.readFileSync(contextPath, 'utf-8') : ''
}

function parseContextToContent(contextMd: string): BRDContent {
  // lightweight parse — extract AC blocks from CONTEXT.md
  const criteria: BRDContent['criteria'] = []
  const rules: BRDContent['rules'] = []
  const acMatches = contextMd.matchAll(/###\s+(AC-\S+|[A-Z]+-AC-\d+)([\s\S]*?)(?=###|\n##|$)/g)
  for (const m of acMatches) {
    const id = m[1]
    const block = m[2]
    const given = block.match(/\*\*Given\*\*\s+(.+)/)?.[1] ?? ''
    const when = block.match(/\*\*When\*\*\s+(.+)/)?.[1] ?? ''
    const then = block.match(/\*\*Then\*\*\s+(.+)/)?.[1] ?? ''
    criteria.push({ id, given, when, then, relatedFlow: '', relatedRules: [] })
  }
  const ruleMatches = contextMd.matchAll(/###\s+(BR-\S+|[A-Z]+-BR-\d+)\n([^\n]+)/g)
  for (const m of ruleMatches) {
    rules.push({ id: m[1], description: m[2], relatedFlows: [] })
  }
  return { actors: [], flows: [], rules, criteria, features: [] }
}
