import * as vscode from 'vscode'
import { callLLM } from '../../llm/client'
import { buildQueryPrompt } from '../../llm/context_builder'
import { loadContextForQuery } from '../../workspace/reader'
import { getAibrdDir, detectMode } from '../../workspace/detector'

export async function handleTasks(
  request: vscode.ChatRequest,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<void> {
  const aibrdDir = getAibrdDir()
  const mode = detectMode(aibrdDir)
  const { content } = loadContextForQuery(aibrdDir, mode)

  if (!content.trim()) {
    stream.markdown('No `.aibrd/` context found. Run **aibrd: Initialize from BRD** first.')
    return
  }

  const SYSTEM = `You are a tech lead breaking down business requirements into developer tasks.
Given the CONTEXT.md, list the next actionable development tasks.
Format each task as: **[ID] Task title** — brief description, acceptance criteria to satisfy.
Group by module if modular. Prioritize by dependency order.`

  const query = request.prompt.replace(/^tasks\s*/i, '').trim() || 'What should I work on next?'
  const prompt = buildQueryPrompt(query, content)

  stream.markdown('## Developer Tasks\n\n')
  const response = await callLLM(prompt, SYSTEM, token)
  stream.markdown(response.text)
}
