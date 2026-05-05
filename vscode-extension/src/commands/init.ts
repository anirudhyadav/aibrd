import * as vscode from 'vscode'
import * as path from 'path'
import { parsePdf } from '../core/parsers/pdf'
import { parseDocx } from '../core/parsers/docx'
import { parseMarkdown } from '../core/parsers/markdown'
import { chunkBRD } from '../core/chunker'
import { detectModules } from '../core/extractors/module_detector'
import { extractActors } from '../core/extractors/actors'
import { extractFlows } from '../core/extractors/flows'
import { extractRules } from '../core/extractors/rules'
import { extractAcceptanceCriteria } from '../core/extractors/acceptance_criteria'
import { detectAmbiguities, formatAmbiguityReport } from '../core/generators/ambiguity_report'
import { detectConflicts, formatConflictReport } from '../core/generators/conflict_detector'
import { generateContextMd } from '../core/generators/context_md'
import { generateRTM } from '../core/generators/rtm'
import { readRegistry, writeRegistry, registerModule, nextSharedId, nextId, setMode } from '../core/registry'
import { linkRelations } from '../core/resolver'
import { getAibrdDir, getWorkspaceRoot, inferModeFromBRD } from '../workspace/detector'
import { initAibrdStructure, initModuleStructure, writeContextMd, writeFile } from '../workspace/writer'
import { BRDContent } from '../core/models/outputs'
import { BrdAnalysisPanel } from '../views/BrdAnalysisPanel'

export async function commandInit(context: vscode.ExtensionContext): Promise<void> {
  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: { 'BRD Documents': ['pdf', 'docx', 'doc', 'md'] },
    title: 'Select BRD document to initialize aibrd'
  })
  if (!uris || uris.length === 0) return

  const filePath = uris[0].fsPath
  const ext = path.extname(filePath).toLowerCase()

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aibrd: Initializing...', cancellable: true },
    async (progress, token) => {
      progress.report({ message: 'Parsing document...' })

      const rawBRD =
        ext === '.pdf' ? await parsePdf(filePath) :
        ext === '.md' ? parseMarkdown(filePath) :
        await parseDocx(filePath)

      const chunks = chunkBRD(rawBRD)
      const workspaceRoot = getWorkspaceRoot()
      const aibrdDir = getAibrdDir(workspaceRoot)
      const projectName = path.basename(workspaceRoot)

      const mode = inferModeFromBRD(rawBRD.text)
      let registry = readRegistry(aibrdDir)
      registry = setMode(registry, mode)

      initAibrdStructure(aibrdDir, mode === 'modular')

      const allContents: BRDContent[] = []

      if (mode === 'modular') {
        progress.report({ message: 'Detecting modules...' })
        const detectedModules = await detectModules(rawBRD.text, token)

        for (const mod of detectedModules) {
          if (token.isCancellationRequested) return
          registry = registerModule(registry, mod)
          initModuleStructure(aibrdDir, mod.slug)

          progress.report({ message: `Extracting: ${mod.displayName}...` })
          const moduleChunks = chunks

          const [rawActors, rawFlows, rawRules, rawCriteria] = await Promise.all([
            extractActors(moduleChunks[0].text, token),
            extractFlows(moduleChunks[0].text, token),
            extractRules(moduleChunks[0].text, token),
            extractAcceptanceCriteria(moduleChunks[0].text, token)
          ])

          const content: BRDContent = {
            moduleSlug: mod.slug,
            modulePrefix: mod.prefix,
            actors: [],
            flows: [],
            rules: [],
            criteria: [],
            features: []
          }

          for (const a of rawActors) {
            const { id, registry: r } = nextSharedId(registry, 'ACT')
            registry = r
            content.actors.push({ ...a, id })
          }
          for (const f of rawFlows) {
            const { id, registry: r } = nextId(registry, 'BF', mod.slug)
            registry = r
            content.flows.push({ ...f, id, relatedRules: [], relatedAC: [] })
          }
          for (const r of rawRules) {
            const { id, registry: reg } = nextId(registry, 'BR', mod.slug)
            registry = reg
            content.rules.push({ ...r, id, relatedFlows: [] })
          }
          for (const ac of rawCriteria) {
            const { id, registry: r } = nextId(registry, 'AC', mod.slug)
            registry = r
            content.criteria.push({ ...ac, id, relatedFlow: '', relatedRules: [] })
          }

          allContents.push(content)
        }
      } else {
        progress.report({ message: 'Extracting requirements...' })
        const [rawActors, rawFlows, rawRules, rawCriteria] = await Promise.all([
          extractActors(chunks[0].text, token),
          extractFlows(chunks[0].text, token),
          extractRules(chunks[0].text, token),
          extractAcceptanceCriteria(chunks[0].text, token)
        ])

        const content: BRDContent = { actors: [], flows: [], rules: [], criteria: [], features: [] }

        for (const a of rawActors) {
          const { id, registry: r } = nextSharedId(registry, 'ACT')
          registry = r
          content.actors.push({ ...a, id })
        }
        for (const f of rawFlows) {
          const { id, registry: r } = nextId(registry, 'BF')
          registry = r
          content.flows.push({ ...f, id, relatedRules: [], relatedAC: [] })
        }
        for (const r of rawRules) {
          const { id, registry: reg } = nextId(registry, 'BR')
          registry = reg
          content.rules.push({ ...r, id, relatedFlows: [] })
        }
        for (const ac of rawCriteria) {
          const { id, registry: r } = nextId(registry, 'AC')
          registry = r
          content.criteria.push({ ...ac, id, relatedFlow: '', relatedRules: [] })
        }

        allContents.push(content)
      }

      const linked = linkRelations(allContents)

      progress.report({ message: 'Generating outputs...' })

      for (const content of linked) {
        const contextMd = generateContextMd(content, '1.0')
        writeContextMd(aibrdDir, contextMd, content.moduleSlug)
      }

      const rtm = generateRTM(linked, projectName)
      writeFile(`${aibrdDir}/index.md`, rtm)

      progress.report({ message: 'Running quality checks...' })
      const allRules = linked.flatMap(c => c.rules)
      const [ambiguities, conflicts] = await Promise.all([
        detectAmbiguities(chunks[0].text, token),
        detectConflicts(allRules, token)
      ])

      let idCounter = 1
      const ambiguitiesWithIds = ambiguities.map(a => ({ ...a, id: `AMB-${String(idCounter++).padStart(3, '0')}` }))
      writeFile(`${aibrdDir}/ambiguity-report.md`, formatAmbiguityReport(ambiguitiesWithIds))
      writeFile(`${aibrdDir}/conflict-report.md`, formatConflictReport(conflicts))

      writeRegistry(aibrdDir, registry)

      BrdAnalysisPanel.show(context, {
        modules: linked.map(c => c.moduleSlug ?? 'default'),
        flowCount: linked.flatMap(c => c.flows).length,
        ruleCount: linked.flatMap(c => c.rules).length,
        actorCount: linked.flatMap(c => c.actors).length,
        acCount: linked.flatMap(c => c.criteria).length,
        ambiguityCount: ambiguitiesWithIds.length,
        conflictCount: conflicts.length,
        aibrdDir
      })

      vscode.window.showInformationMessage(`aibrd: Initialized successfully in .aibrd/`)
    }
  )
}
