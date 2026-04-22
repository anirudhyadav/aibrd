import * as vscode from 'vscode'
import { callLLM } from '../llm/client'
import { buildReleaseNotesPrompt } from '../llm/context_builder'
import { loadContextForQuery } from '../workspace/reader'
import { getAibrdDir, detectMode } from '../workspace/detector'
import { writeRelease } from '../workspace/writer'
import { readRegistry, nextId, writeRegistry } from '../core/registry'
import { execSync } from 'child_process'

export async function commandReleaseNotes(): Promise<void> {
  const aibrdDir = getAibrdDir()
  const mode = detectMode(aibrdDir)

  const version = await vscode.window.showInputBox({
    prompt: 'Release version',
    placeHolder: 'e.g. v2.3.0',
    ignoreFocusOut: true
  })
  if (!version?.trim()) return

  const branch = await vscode.window.showInputBox({
    prompt: 'Branch or commit range to diff',
    placeHolder: 'e.g. main...release/v2.3 or HEAD~10..HEAD',
    value: 'HEAD~20..HEAD',
    ignoreFocusOut: true
  })
  if (!branch?.trim()) return

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'aibrd: Generating release notes...', cancellable: true },
    async (progress, token) => {
      progress.report({ message: 'Reading git diff...' })
      let gitDiff = ''
      try {
        gitDiff = execSync(`git diff ${branch} --stat --diff-filter=AM`, {
          cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath,
          maxBuffer: 1024 * 1024
        }).toString()
      } catch {
        vscode.window.showWarningMessage('aibrd: Could not read git diff. Ensure you are in a git repo.')
        return
      }

      progress.report({ message: 'Building context...' })
      const { content: contextContent } = loadContextForQuery(aibrdDir, mode)

      progress.report({ message: 'Generating release notes...' })
      const prompt = buildReleaseNotesPrompt(contextContent, gitDiff)
      const SYSTEM = `You are a technical writer. Generate release notes that map code changes to business requirements.
Format as markdown with sections: ## Summary, ## What Changed (mapped to requirement IDs), ## Known Gaps.
Reference requirement IDs (BF-XXX, BR-XXX) wherever possible.`

      const response = await callLLM(prompt, SYSTEM, token)

      let registry = readRegistry(aibrdDir)
      const { id, registry: r } = nextId(registry, 'RN')
      registry = r
      writeRegistry(aibrdDir, registry)

      const releaseContent = `# Release Notes — ${version}\n_${id} | Generated: ${new Date().toISOString().split('T')[0]}_\n\n${response.text}`
      writeRelease(aibrdDir, version, releaseContent)

      const doc = await vscode.workspace.openTextDocument({
        content: releaseContent,
        language: 'markdown'
      })
      await vscode.window.showTextDocument(doc)

      vscode.window.showInformationMessage(`aibrd: Release notes saved to .aibrd/releases/${version}.md`)
    }
  )
}
