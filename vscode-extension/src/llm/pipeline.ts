import * as vscode from 'vscode'

export interface PipelineResult {
  classification: string
  analysis: string
  synthesis: string
}

export interface StageResult {
  text: string
  model: string
  stage: 'classify' | 'analyze' | 'synthesize'
}

const MODEL_TIERS = {
  classify:   ['claude-haiku', 'gpt-4o-mini', 'copilot-gpt-3.5-turbo'],
  analyze:    ['claude-sonnet', 'gpt-4o', 'copilot-gpt-4o'],
  synthesize: ['claude-opus', 'claude-sonnet', 'gpt-4o', 'copilot-gpt-4']
} as const

async function selectModel(tier: keyof typeof MODEL_TIERS): Promise<vscode.LanguageModelChat | null> {
  const preferences = MODEL_TIERS[tier]
  for (const family of preferences) {
    const models = await vscode.lm.selectChatModels({ family })
    if (models.length > 0) return models[0]
  }
  const fallback = await vscode.lm.selectChatModels()
  return fallback.length > 0 ? fallback[0] : null
}

async function callStage(
  model: vscode.LanguageModelChat,
  systemPrompt: string,
  userPrompt: string,
  token: vscode.CancellationToken
): Promise<string> {
  const messages = [
    vscode.LanguageModelChatMessage.User(systemPrompt),
    vscode.LanguageModelChatMessage.User(userPrompt)
  ]
  const response = await model.sendRequest(messages, {}, token)
  let text = ''
  for await (const chunk of response.text) { text += chunk }
  return text
}

export async function runThreeStagePipeline(
  brdContext: string,
  inputText: string,
  token: vscode.CancellationToken,
  onProgress?: (stage: string) => void
): Promise<PipelineResult> {
  // Stage 1 — Classify (fast model)
  onProgress?.('Stage 1: Classifying requirements...')
  const classifyModel = await selectModel('classify')
  if (!classifyModel) throw new Error('aibrd: No LLM model available for classification.')

  const classifySystem = `You are a requirements classifier. Given business requirements and source code,
classify each requirement as COVERED, MISSING, or PARTIAL. Return a JSON array:
[{"reqId": "BF-XXX", "verdict": "COVERED|MISSING|PARTIAL", "confidence": 0.0-1.0, "reason": "brief"}]
Only flag MISSING when confident the requirement has no implementation.`

  const classification = await callStage(
    classifyModel,
    classifySystem,
    `REQUIREMENTS:\n${brdContext.slice(0, 4000)}\n\nSOURCE CODE:\n${inputText.slice(0, 4000)}`,
    token
  )

  // Stage 2 — Analyze (medium model, MISSING/PARTIAL only)
  onProgress?.('Stage 2: Deep analysis of gaps...')
  const analyzeModel = await selectModel('analyze')
  if (!analyzeModel) throw new Error('aibrd: No LLM model available for analysis.')

  const analyzeSystem = `You are a senior requirements analyst. Given classifier results showing MISSING or PARTIAL coverage,
perform deep analysis. For each gap: cite the exact requirement text, describe what's missing in the code,
suggest specific implementation steps. Return markdown with one ## section per gap.`

  const analysis = await callStage(
    analyzeModel,
    analyzeSystem,
    `REQUIREMENTS:\n${brdContext.slice(0, 3000)}\n\nCLASSIFIER RESULTS:\n${classification}\n\nSOURCE CODE:\n${inputText.slice(0, 2000)}`,
    token
  )

  // Stage 3 — Synthesize (strongest model, executive summary)
  onProgress?.('Stage 3: Synthesizing coverage report...')
  const synthesizeModel = await selectModel('synthesize')
  if (!synthesizeModel) throw new Error('aibrd: No LLM model available for synthesis.')

  const synthesizeSystem = `You are a delivery lead. Given requirements classification and gap analysis,
produce an executive coverage summary. Include: coverage percentage, critical gaps, risk assessment,
recommended priority order for implementation. Format as markdown.`

  const synthesis = await callStage(
    synthesizeModel,
    synthesizeSystem,
    `CLASSIFICATION:\n${classification}\n\nANALYSIS:\n${analysis}`,
    token
  )

  return { classification, analysis, synthesis }
}
