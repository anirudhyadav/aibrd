import * as vscode from 'vscode'
import { callLLMJson } from '../../llm/client'
import { BusinessFlow } from '../models/outputs'

const SYSTEM = `You are a business analyst extracting business flows from a BRD.
A business flow is an end-to-end process or user journey.
Return JSON: {
  "flows": [{
    "name": "...",
    "description": "...",
    "actors": ["actor name"],
    "steps": [{ "order": 1, "description": "...", "actor": "..." }]
  }]
}`

export async function extractFlows(
  brdText: string,
  token?: vscode.CancellationToken
): Promise<Omit<BusinessFlow, 'id' | 'relatedRules' | 'relatedAC'>[]> {
  const result = await callLLMJson<{
    flows: Omit<BusinessFlow, 'id' | 'relatedRules' | 'relatedAC'>[]
  }>(brdText, SYSTEM, token)
  return result.flows
}
