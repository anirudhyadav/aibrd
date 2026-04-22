import * as vscode from 'vscode'
import { handleAnalyze } from './handlers/analyze'
import { handleCoverage } from './handlers/coverage'
import { handleTasks } from './handlers/tasks'
import { handleRtm } from './handlers/rtm'

const HELP = `**@aibrd commands:**
- \`analyze <id>\` — explain a requirement (BF-001, BR-002, AC-003)
- \`tasks\` — what should I work on next?
- \`coverage\` — gap report for current file or module
- \`rtm\` — show traceability matrix summary`

export function registerChatParticipant(context: vscode.ExtensionContext): void {
  const participant = vscode.chat.createChatParticipant(
    'aibrd.assistant',
    async (request, chatContext, stream, token) => {
      const query = request.prompt.trim().toLowerCase()

      if (!query || query === 'help') {
        stream.markdown(HELP)
        return
      }

      if (query.startsWith('analyze') || query.match(/^[a-z]+-?(bf|br|ac|ft|act)-\d+/i)) {
        await handleAnalyze(request, stream, token)
      } else if (query.startsWith('coverage')) {
        await handleCoverage(request, stream, token)
      } else if (query.startsWith('tasks')) {
        await handleTasks(request, stream, token)
      } else if (query.startsWith('rtm')) {
        await handleRtm(request, stream, token)
      } else {
        await handleAnalyze(request, stream, token)
      }
    }
  )

  participant.iconPath = new vscode.ThemeIcon('book')
  context.subscriptions.push(participant)
}
