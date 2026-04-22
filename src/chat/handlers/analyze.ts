import * as vscode from 'vscode'
import { callLLM } from '../../llm/client'
import { buildQueryPrompt } from '../../llm/context_builder'
import { loadContextForQuery } from '../../workspace/reader'
import { getAibrdDir, detectMode } from '../../workspace/detector'

export async function handleAnalyze(
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

  const SYSTEM = `You are a business analyst. Answer questions about business requirements using the provided CONTEXT.md.
Reference requirement IDs (BF-XXX, BR-XXX, AC-XXX) in your answers. Be concise and precise.`

  const prompt = buildQueryPrompt(request.prompt, content)

  stream.markdown('Analyzing requirements...\n\n')
  const response = await callLLM(prompt, SYSTEM, token)
  stream.markdown(response.text)
}
