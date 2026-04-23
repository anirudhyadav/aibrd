import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import { mapCompliance, formatComplianceMap, ComplianceFramework } from '../core/generators/compliance_mapper'
import { getAibrdDir, detectMode } from '../workspace/detector'
import { listModules } from '../workspace/reader'
import { writeFile } from '../workspace/writer'
import { BRDContent, BusinessFlow, BusinessRule } from '../core/models/outputs'

const FRAMEWORKS: ComplianceFramework[] = ['GDPR', 'WCAG', 'HIPAA', 'SOX', 'PCI-DSS', 'ISO27001']

export async function commandComplianceMapper(): Promise<void> {
  const aibrdDir = getAibrdDir()
  const mode = detectMode(aibrdDir)

  // Let user pick frameworks
  const picked = await vscode.window.showQuickPick(
    FRAMEWORKS.map(f => ({ label: f, picked: false })),
    { placeHolder: 'Select compliance frameworks to check against', canPickMany: true }
  )
  if (!picked || !picked.length) return
  const frameworks = picked.map(p => p.label as ComplianceFramework)

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aibrd: Running compliance mapping...', cancellable: true },
    async (_, token) => {
      const slugs = mode === 'modular' ? listModules(aibrdDir) : [undefined]
      const contents: BRDContent[] = []
      for (const slug of slugs) {
        const ctxPath = slug
          ? path.join(aibrdDir, 'modules', slug, 'CONTEXT.md')
          : path.join(aibrdDir, 'CONTEXT.md')
        contents.push(parseContextToContent(ctxPath, slug))
      }

      const tags = await mapCompliance(contents, frameworks, token)
      const report = formatComplianceMap(tags)

      writeFile(path.join(aibrdDir, 'compliance-map.md'), report)

      const doc = await vscode.workspace.openTextDocument({ content: report, language: 'markdown' })
      await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside)

      const highCount = tags.filter(t => t.risk === 'high').length
      const msg = highCount
        ? `aibrd: ${tags.length} compliance tags found — ⚠️ ${highCount} high-risk items. Saved to .aibrd/compliance-map.md`
        : `aibrd: ${tags.length} compliance tags found. Saved to .aibrd/compliance-map.md`
      vscode.window.showInformationMessage(msg)
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
