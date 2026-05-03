import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import { execSync } from 'child_process'
import { generatePOReport } from '../core/generators/po_report'
import { getAibrdDir, detectMode } from '../workspace/detector'
import { listModules } from '../workspace/reader'
import { writeFile } from '../workspace/writer'
import { BRDContent, BusinessFlow, BusinessRule } from '../core/models/outputs'

export async function commandPoReport(): Promise<void> {
  const aibrdDir = getAibrdDir()
  const mode = detectMode(aibrdDir)
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? ''

  const version = await vscode.window.showInputBox({
    prompt: 'Release version for PO report (e.g. v1.2.0)',
    placeHolder: 'v1.0.0'
  })
  if (!version) return

  const rangeInput = await vscode.window.showInputBox({
    prompt: 'Git range for changes (e.g. v1.1.0..HEAD or leave blank for last 20 commits)',
    placeHolder: 'HEAD~20..HEAD'
  })
  const gitRange = rangeInput?.trim() || 'HEAD~20..HEAD'

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aibrd: Generating PO report...', cancellable: true },
    async (_, token) => {
      // Gather git summary
      let gitSummary = ''
      try {
        gitSummary = execSync(`git -C "${workspaceRoot}" diff --stat ${gitRange}`, { encoding: 'utf-8' })
        const commitLog = execSync(`git -C "${workspaceRoot}" log --oneline ${gitRange}`, { encoding: 'utf-8' })
        gitSummary = `Commits:\n${commitLog}\n\nFiles changed:\n${gitSummary}`
      } catch {
        gitSummary = 'Git history unavailable.'
      }

      // Load all modules' content
      const slugs = mode === 'modular' ? listModules(aibrdDir) : [undefined]
      const contents: BRDContent[] = []
      for (const slug of slugs) {
        const ctxPath = slug
          ? path.join(aibrdDir, 'modules', slug, 'CONTEXT.md')
          : path.join(aibrdDir, 'CONTEXT.md')
        contents.push(parseContextToContent(ctxPath, slug))
      }

      const report = await generatePOReport(contents, gitSummary, version, token)
      const filename = `po-report-${version.replace(/[^a-zA-Z0-9]/g, '-')}.md`
      writeFile(path.join(aibrdDir, 'releases', filename), report)

      const doc = await vscode.workspace.openTextDocument({ content: report, language: 'markdown' })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)
      vscode.window.showInformationMessage(`aibrd: PO report generated. Saved to .aibrd/releases/${filename}`)
    }
  )
}

function parseContextToContent(ctxPath: string, slug?: string): BRDContent {
  if (!fs.existsSync(ctxPath)) return { actors: [], flows: [], rules: [], criteria: [], features: [] }
  const text = fs.readFileSync(ctxPath, 'utf-8')
  const flows: BusinessFlow[] = []
  const rules: BusinessRule[] = []

  for (const m of text.matchAll(/###\s+((?:[A-Z]+-)?BF-\d+):\s*(.+)/g)) {
    const descMatch = text.match(new RegExp(`###\\s+${m[1]}:[\\s\\S]{0,300}`))
    const desc = descMatch?.[0].split('\n').slice(1, 3).join(' ').trim() ?? ''
    flows.push({ id: m[1], name: m[2], description: desc, actors: [], steps: [], relatedRules: [], relatedAC: [] })
  }
  for (const m of text.matchAll(/###\s+((?:[A-Z]+-)?BR-\d+)\n([^\n]+)/g)) {
    rules.push({ id: m[1], description: m[2], relatedFlows: [] })
  }

  return { moduleSlug: slug, actors: [], flows, rules, criteria: [], features: [] }
}
