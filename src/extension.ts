import * as vscode from 'vscode'
import { commandInit } from './commands/init'
import { commandUpdate } from './commands/update'
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
import { showGapReport } from './views/GapReportView'

export function activate(context: vscode.ExtensionContext): void {
  const rtmProvider = new RtmTreeProvider()

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('aibrd.rtmView', rtmProvider),

    // ── Core ──────────────────────────────────────────────────────────────────
    vscode.commands.registerCommand('aibrd.init',          () => commandInit(context)),
    vscode.commands.registerCommand('aibrd.update',        () => commandUpdate()),
    vscode.commands.registerCommand('aibrd.generateTests', () => commandGenerateTests()),
    vscode.commands.registerCommand('aibrd.releaseNotes',  () => commandReleaseNotes()),
    vscode.commands.registerCommand('aibrd.showRtm',       () => rtmProvider.refresh()),
    vscode.commands.registerCommand('aibrd.showGaps', () => {
      const tokenSource = new vscode.CancellationTokenSource()
      return showGapReport(tokenSource.token)
    }),

    // ── Batch 1: Analysis & Quality ───────────────────────────────────────────
    vscode.commands.registerCommand('aibrd.changeImpact',     () => commandChangeImpact(context)),
    vscode.commands.registerCommand('aibrd.validateContext',  () => commandValidateContext()),
    vscode.commands.registerCommand('aibrd.prDraft',          () => commandPrDraft()),

    // ── Batch 2: Delivery Tools ───────────────────────────────────────────────
    vscode.commands.registerCommand('aibrd.sprintFeed',       () => commandSprintFeed()),
    vscode.commands.registerCommand('aibrd.apiContracts',     () => commandApiContracts()),
    vscode.commands.registerCommand('aibrd.poReport',         () => commandPoReport()),
    vscode.commands.registerCommand('aibrd.complianceMapper', () => commandComplianceMapper()),

    // ── Batch 3: Ingestion & Traceability ─────────────────────────────────────
    vscode.commands.registerCommand('aibrd.ingestConfluence', () => commandIngestConfluence()),
    vscode.commands.registerCommand('aibrd.staleDetector',    () => commandStaleDetector()),
    vscode.commands.registerCommand('aibrd.testLinkage',      () => commandTestLinkage()),

    vscode.workspace.onDidSaveTextDocument(doc => {
      if (doc.fileName.includes('.aibrd')) {
        rtmProvider.refresh()
      }
    })
  )

  registerChatParticipant(context)
}

export function deactivate(): void {}
