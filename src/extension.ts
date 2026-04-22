import * as vscode from 'vscode'
import { commandInit } from './commands/init'
import { commandUpdate } from './commands/update'
import { commandGenerateTests } from './commands/generateTests'
import { commandReleaseNotes } from './commands/releaseNotes'
import { registerChatParticipant } from './chat/participant'
import { RtmTreeProvider } from './views/RtmTreeProvider'
import { showGapReport } from './views/GapReportView'

export function activate(context: vscode.ExtensionContext): void {
  const rtmProvider = new RtmTreeProvider()

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('aibrd.rtmView', rtmProvider),

    vscode.commands.registerCommand('aibrd.init', () => commandInit(context)),
    vscode.commands.registerCommand('aibrd.update', () => commandUpdate()),
    vscode.commands.registerCommand('aibrd.generateTests', () => commandGenerateTests()),
    vscode.commands.registerCommand('aibrd.releaseNotes', () => commandReleaseNotes()),
    vscode.commands.registerCommand('aibrd.showRtm', () => rtmProvider.refresh()),
    vscode.commands.registerCommand('aibrd.showGaps', () => {
      const tokenSource = new vscode.CancellationTokenSource()
      return showGapReport(tokenSource.token)
    }),

    vscode.workspace.onDidSaveTextDocument(doc => {
      if (doc.fileName.includes('.aibrd')) {
        rtmProvider.refresh()
      }
    })
  )

  registerChatParticipant(context)
}

export function deactivate(): void {}
