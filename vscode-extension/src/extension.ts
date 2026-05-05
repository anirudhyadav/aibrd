import * as vscode from 'vscode'
import * as path from 'path'
import { commandInit } from './commands/init'
import { commandUpdate } from './commands/update'
import { commandScanCodebase } from './commands/scanCodebase'
import { commandImpactAdvisor } from './commands/impactAdvisor'
import { commandShowCodeMap } from './commands/showCodeMap'
import { commandGenerateTests } from './commands/generateTests'
import { commandReleaseNotes } from './commands/releaseNotes'
import { commandChangeImpact } from './commands/changeImpact'
import { commandValidateContext } from './commands/validateContext'
import { commandPrDraft } from './commands/prDraft'
import { commandSprintFeed } from './commands/sprintFeed'
import { commandApiContracts } from './commands/apiContracts'
import { commandPoReport } from './commands/poReport'
import { commandComplianceMapper } from './commands/complianceMapper'
import { commandIngestConfluence } from './commands/ingestConfluence'
import { commandStaleDetector } from './commands/staleDetector'
import { commandTestLinkage } from './commands/testLinkage'
import { registerChatParticipant } from './chat/participant'
import { RtmTreeProvider } from './views/RtmTreeProvider'
import { CodeMapTreeProvider } from './views/CodeMapTreeProvider'
import { showGapReport } from './views/GapReportView'
import { updateCodeMapForFiles } from './core/codemap/engine'
import { readCodeMap, writeCodeMap, codeMapExists } from './core/codemap/store'
import { loadContextForQuery } from './workspace/reader'
import { getAibrdDir, getWorkspaceRoot, detectMode } from './workspace/detector'

let codeMapWatcher: vscode.FileSystemWatcher | undefined
let debouncedFiles: Set<string> = new Set()
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let isUpdatingCodeMap = false
let pendingUpdateFiles: Set<string> = new Set()

export function activate(context: vscode.ExtensionContext): void {
  const rtmProvider = new RtmTreeProvider()
  const codeMapProvider = new CodeMapTreeProvider()

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('aibrd.rtmView', rtmProvider),
    vscode.window.registerTreeDataProvider('aibrd.codeMapView', codeMapProvider),

    // ── Core ──────────────────────────────────────────────────────────────
    vscode.commands.registerCommand('aibrd.init',          () => commandInit(context)),
    vscode.commands.registerCommand('aibrd.update',        () => commandUpdate()),
    vscode.commands.registerCommand('aibrd.generateTests', () => commandGenerateTests()),
    vscode.commands.registerCommand('aibrd.releaseNotes',  () => commandReleaseNotes()),
    vscode.commands.registerCommand('aibrd.showRtm',       () => rtmProvider.refresh()),
    vscode.commands.registerCommand('aibrd.showGaps', () => {
      const tokenSource = new vscode.CancellationTokenSource()
      return showGapReport(tokenSource.token)
    }),

    // ── Code Map (NEW) ──────────────────────────────────────────────────
    vscode.commands.registerCommand('aibrd.scanCodebase',  () => commandScanCodebase().then(() => codeMapProvider.refresh())),
    vscode.commands.registerCommand('aibrd.impactAdvisor', () => commandImpactAdvisor()),
    vscode.commands.registerCommand('aibrd.showCodeMap',   () => commandShowCodeMap()),

    // ── Analysis & Quality ────────────────────────────────────────────────
    vscode.commands.registerCommand('aibrd.changeImpact',     () => commandChangeImpact(context)),
    vscode.commands.registerCommand('aibrd.validateContext',  () => commandValidateContext()),
    vscode.commands.registerCommand('aibrd.prDraft',          () => commandPrDraft()),

    // ── Delivery Tools ────────────────────────────────────────────────────
    vscode.commands.registerCommand('aibrd.sprintFeed',       () => commandSprintFeed()),
    vscode.commands.registerCommand('aibrd.apiContracts',     () => commandApiContracts()),
    vscode.commands.registerCommand('aibrd.poReport',         () => commandPoReport()),
    vscode.commands.registerCommand('aibrd.complianceMapper', () => commandComplianceMapper()),

    // ── Ingestion & Traceability ──────────────────────────────────────────
    vscode.commands.registerCommand('aibrd.ingestConfluence', () => commandIngestConfluence()),
    vscode.commands.registerCommand('aibrd.staleDetector',    () => commandStaleDetector()),
    vscode.commands.registerCommand('aibrd.testLinkage',      () => commandTestLinkage()),

    // ── Auto-refresh tree views on .aibrd changes ────────────────────────
    vscode.workspace.onDidSaveTextDocument(doc => {
      if (doc.fileName.includes('.aibrd')) {
        rtmProvider.refresh()
        codeMapProvider.refresh()
      }
    })
  )

  registerChatParticipant(context)
  setupCodeMapFileWatcher(context, codeMapProvider)
}

/**
 * Sets up a file watcher that incrementally updates the code map
 * when source files change. Uses debouncing to batch rapid edits.
 */
function setupCodeMapFileWatcher(
  context: vscode.ExtensionContext,
  codeMapProvider: CodeMapTreeProvider
): void {
  const config = vscode.workspace.getConfiguration('aibrd')
  const autoUpdate: boolean = config.get('codeMapAutoUpdate') ?? true

  if (!autoUpdate) return

  const includePatterns: string[] = config.get('codeMapIncludePatterns') ?? [
    '**/*.ts', '**/*.js', '**/*.py'
  ]

  // Watch for changes in source files
  for (const pattern of includePatterns) {
    const watcher = vscode.workspace.createFileSystemWatcher(pattern)

    watcher.onDidChange(uri => queueCodeMapUpdate(uri, codeMapProvider))
    watcher.onDidCreate(uri => queueCodeMapUpdate(uri, codeMapProvider))
    watcher.onDidDelete(uri => queueCodeMapUpdate(uri, codeMapProvider))

    context.subscriptions.push(watcher)
  }

  // Also watch CONTEXT.md for BRD changes
  const contextWatcher = vscode.workspace.createFileSystemWatcher('**/.aibrd/CONTEXT.md')
  contextWatcher.onDidChange(() => {
    vscode.window.showInformationMessage(
      'aibrd: CONTEXT.md changed. Run "aibrd: Scan Codebase" to update the code map, ' +
      'or "aibrd: Impact Advisor" to see which files need updating.'
    )
  })
  context.subscriptions.push(contextWatcher)
}

function queueCodeMapUpdate(
  uri: vscode.Uri,
  codeMapProvider: CodeMapTreeProvider
): void {
  try {
    const workspaceRoot = getWorkspaceRoot()
    const aibrdDir = getAibrdDir(workspaceRoot)

    if (!codeMapExists(aibrdDir)) return

    const relativePath = path.relative(workspaceRoot, uri.fsPath)
    debouncedFiles.add(relativePath)

    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      const files = Array.from(debouncedFiles)
      debouncedFiles = new Set()

      if (isUpdatingCodeMap) {
        for (const f of files) pendingUpdateFiles.add(f)
        return
      }

      isUpdatingCodeMap = true
      try {
        const mode = detectMode(aibrdDir)
        const { content } = loadContextForQuery(aibrdDir, mode)
        if (!content.trim()) return

        const codeMap = readCodeMap(aibrdDir, workspaceRoot)
        const updated = await updateCodeMapForFiles(codeMap, files, content, workspaceRoot)
        writeCodeMap(aibrdDir, updated)
        codeMapProvider.refresh()

        if (pendingUpdateFiles.size > 0) {
          const pending = Array.from(pendingUpdateFiles)
          pendingUpdateFiles = new Set()
          for (const f of pending) debouncedFiles.add(f)
          queueCodeMapUpdate(vscode.Uri.file(path.join(workspaceRoot, pending[0])), codeMapProvider)
        }
      } finally {
        isUpdatingCodeMap = false
      }
    }, 5000)
  } catch {
    // workspace not ready
  }
}

export function deactivate(): void {
  if (codeMapWatcher) {
    codeMapWatcher.dispose()
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
}
