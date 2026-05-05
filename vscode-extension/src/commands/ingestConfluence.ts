import * as vscode from 'vscode'
import * as path from 'path'
import { ingestConfluencePage, ConfluenceConfig } from '../core/parsers/confluence'
import { getAibrdDir, isInitialized } from '../workspace/detector'
import { chunkBRD } from '../core/chunker'
import { detectModules } from '../core/extractors/module_detector'
import { extractActors } from '../core/extractors/actors'
import { extractFlows } from '../core/extractors/flows'
import { extractRules } from '../core/extractors/rules'
import { extractAcceptanceCriteria } from '../core/extractors/acceptance_criteria'
import { readRegistry, registerModule, nextId, writeRegistry } from '../core/registry'
import { generateContextMd } from '../core/generators/context_md'
import { writeContextMd, initModuleStructure } from '../workspace/writer'
import { linkRelations } from '../core/resolver'

export async function commandIngestConfluence(): Promise<void> {
  const aibrdDir = getAibrdDir()
  if (!isInitialized(aibrdDir)) {
    vscode.window.showErrorMessage('aibrd: Run "aibrd: Initialize" first before ingesting Confluence pages.')
    return
  }

  // Collect connection details
  const baseUrl = await vscode.window.showInputBox({
    prompt: 'Confluence base URL',
    placeHolder: 'https://yourorg.atlassian.net',
    value: vscode.workspace.getConfiguration('aibrd').get('confluenceBaseUrl', '')
  })
  if (!baseUrl) return

  const spaceKey = await vscode.window.showInputBox({
    prompt: 'Confluence space key',
    placeHolder: 'ENG'
  })
  if (!spaceKey) return

  const pageTitle = await vscode.window.showInputBox({
    prompt: 'Page title to ingest (exact match)',
    placeHolder: 'Payment Processing BRD'
  })
  if (!pageTitle) return

  const token = await vscode.window.showInputBox({
    prompt: 'Confluence API token (stored in memory only, never written to disk)',
    password: true
  })
  if (!token) return

  const email = await vscode.window.showInputBox({
    prompt: 'Confluence email (Atlassian Cloud only — leave blank for Server/DC)'
  })

  const cfg: ConfluenceConfig = { baseUrl, spaceKey, pageTitle, token, email: email || undefined }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aibrd: Ingesting Confluence page...', cancellable: true },
    async (progress, token_cancel) => {
      progress.report({ message: 'Fetching page content...' })
      let rawBrd
      try {
        rawBrd = await ingestConfluencePage(cfg)
      } catch (err: unknown) {
        vscode.window.showErrorMessage(`aibrd: Confluence fetch failed — ${(err as Error).message}`)
        return
      }

      progress.report({ message: 'Detecting modules...' })
      const chunks = chunkBRD(rawBrd)
      const modules = await detectModules(rawBrd.text, token_cancel)
      const registry = readRegistry(aibrdDir)

      for (const mod of modules) {
        progress.report({ message: `Extracting: ${mod.name}...` })
        if (token_cancel.isCancellationRequested) return

        const moduleRegistry = registerModule(registry, mod.name)
        const relevantChunks = chunks.filter(c =>
          c.text.toLowerCase().includes(mod.name.toLowerCase())
        )
        const text = relevantChunks.map(c => c.text).join('\n\n')

        const [actors, flows, rules, criteria] = await Promise.all([
          extractActors(text, token_cancel),
          extractFlows(text, token_cancel),
          extractRules(text, token_cancel),
          extractAcceptanceCriteria(text, token_cancel),
        ])

        // Assign IDs
        const slug = moduleRegistry.slug
        flows.forEach(f => { f.id = nextId(registry, slug, 'BF') })
        rules.forEach(r => { r.id = nextId(registry, slug, 'BR') })
        criteria.forEach(ac => { ac.id = nextId(registry, slug, 'AC') })

        const content = { moduleSlug: slug, actors, flows, rules, criteria, features: [] }
        linkRelations(content)

        initModuleStructure(aibrdDir, slug)
        const md = generateContextMd(content, '1.0.0')
        writeContextMd(path.join(aibrdDir, 'modules', slug), md)
      }

      writeRegistry(aibrdDir, registry)

      vscode.window.showInformationMessage(
        `aibrd: Confluence page "${pageTitle}" ingested across ${modules.length} module(s).`
      )
    }
  )
}
