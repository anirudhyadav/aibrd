import * as vscode from 'vscode'
import * as path from 'path'
import { matchOrCreateModule } from '../core/extractors/module_detector'
import { extractFlows } from '../core/extractors/flows'
import { extractRules } from '../core/extractors/rules'
import { extractAcceptanceCriteria } from '../core/extractors/acceptance_criteria'
import { generateChangelogEntry } from '../core/generators/context_md'
import { readRegistry, writeRegistry, registerModule, nextId } from '../core/registry'
import { getAibrdDir, detectMode } from '../workspace/detector'
import { loadContextForQuery, listModules } from '../workspace/reader'
import { updateContextMd, initModuleStructure } from '../workspace/writer'
import { DetectedModule } from '../core/models/module'

export async function commandUpdate(): Promise<void> {
  const aibrdDir = getAibrdDir()
  const mode = detectMode(aibrdDir)

  const input = await vscode.window.showInputBox({
    prompt: 'Enter new requirement from PO (plain text)',
    placeHolder: 'e.g. Users must be able to reset password via SMS OTP within 60 seconds',
    ignoreFocusOut: true
  })
  if (!input?.trim()) return

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aibrd: Processing requirement...', cancellable: true },
    async (progress, token) => {
      let registry = readRegistry(aibrdDir)

      let moduleSlug: string | undefined
      let mod: DetectedModule | undefined

      if (mode === 'modular') {
        progress.report({ message: 'Matching to module...' })
        const existingModules = Object.entries(registry.modules).map(([slug, cfg]) => ({
          slug,
          displayName: cfg.displayName,
          prefix: cfg.prefix,
          confidence: 'high' as const
        }))

        mod = await matchOrCreateModule(input, existingModules, token)
        moduleSlug = mod.slug

        if (!registry.modules[moduleSlug]) {
          registry = registerModule(registry, mod)
          initModuleStructure(aibrdDir, moduleSlug)
        }
      }

      progress.report({ message: 'Extracting requirements...' })
      const [rawFlows, rawRules, rawCriteria] = await Promise.all([
        extractFlows(input, token),
        extractRules(input, token),
        extractAcceptanceCriteria(input, token)
      ])

      const newLines: string[] = []

      for (const f of rawFlows) {
        const { id, registry: r } = nextId(registry, 'BF', moduleSlug)
        registry = r
        newLines.push(`\n### ${id}: ${f.name}\n${f.description}\n`)
      }

      for (const r of rawRules) {
        const { id, registry: reg } = nextId(registry, 'BR', moduleSlug)
        registry = reg
        newLines.push(`\n### ${id}\n${r.description}\n`)
      }

      for (const ac of rawCriteria) {
        const { id, registry: r } = nextId(registry, 'AC', moduleSlug)
        registry = r
        newLines.push(`\n### ${id}\n- **Given** ${ac.given}\n- **When** ${ac.when}\n- **Then** ${ac.then}\n`)
      }

      const contextPath = moduleSlug
        ? path.join(aibrdDir, 'modules', moduleSlug, 'CONTEXT.md')
        : path.join(aibrdDir, 'CONTEXT.md')

      const newVersion = bumpVersion(contextPath)
      const entry = generateChangelogEntry(newVersion, `Added from PO requirement: "${input.slice(0, 60)}"`)
      newLines.push(`\n${entry}`)

      updateContextMd(contextPath, 'update', newLines.join('\n'))
      writeRegistry(aibrdDir, registry)

      const moduleName = mod ? ` in module: ${mod.displayName}` : ''
      vscode.window.showInformationMessage(
        `aibrd: Added ${rawFlows.length} flows, ${rawRules.length} rules, ${rawCriteria.length} AC${moduleName}`
      )
    }
  )
}

function bumpVersion(contextPath: string): string {
  const fs = require('fs') as typeof import('fs')
  if (!fs.existsSync(contextPath)) return '1.1'
  const content = fs.readFileSync(contextPath, 'utf-8')
  const match = content.match(/v(\d+)\.(\d+)/)
  if (!match) return '1.1'
  return `${match[1]}.${Number(match[2]) + 1}`
}
