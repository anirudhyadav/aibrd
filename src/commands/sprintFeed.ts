import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import { generateSprintFeed, formatSprintFeed } from '../core/generators/sprint_feed'
import { getAibrdDir, detectMode } from '../workspace/detector'
import { listModules } from '../workspace/reader'
import { writeFile } from '../workspace/writer'
import { BRDContent, AcceptanceCriteria, BusinessFlow, BusinessRule, FlowStep } from '../core/models/outputs'

export async function commandSprintFeed(): Promise<void> {
  const aibrdDir = getAibrdDir()
  const mode = detectMode(aibrdDir)
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? ''
  const projectName = path.basename(workspaceRoot)

  let moduleSlug: string | undefined
  if (mode === 'modular') {
    const modules = listModules(aibrdDir)
    const picked = await vscode.window.showQuickPick(['All modules', ...modules], {
      placeHolder: 'Generate sprint tasks for which module?'
    })
    if (!picked) return
    if (picked !== 'All modules') moduleSlug = picked
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aibrd: Generating sprint feed...', cancellable: true },
    async (_, token) => {
      const slugs = moduleSlug
        ? [moduleSlug]
        : (mode === 'modular' ? listModules(aibrdDir) : [undefined])

      const allTasks = []
      for (const slug of slugs) {
        const ctxPath = slug
          ? path.join(aibrdDir, 'modules', slug, 'CONTEXT.md')
          : path.join(aibrdDir, 'CONTEXT.md')
        const content = parseContextToContent(ctxPath, slug)
        const tasks = await generateSprintFeed(content, token)
        allTasks.push(...tasks)
      }

      const report = formatSprintFeed(allTasks, projectName)
      writeFile(`${aibrdDir}/sprint-feed.md`, report)

      const doc = await vscode.workspace.openTextDocument({ content: report, language: 'markdown' })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)
      vscode.window.showInformationMessage(`aibrd: Sprint feed generated — ${allTasks.length} tasks. Saved to .aibrd/sprint-feed.md`)
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
    flows.push({ id: m[1], name: m[2], description: '', actors: [], steps: [], relatedRules: [], relatedAC: [] })
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
