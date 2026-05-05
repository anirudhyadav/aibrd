import * as vscode from 'vscode'
import { callLLMJson } from '../../llm/client'
import { BusinessRule } from '../models/outputs'

const SYSTEM = `You are a business analyst extracting business rules from a BRD.
A business rule is a constraint, policy, or condition the system must enforce.
Return JSON: {
  "rules": [{ "description": "...", "rationale": "..." }]
}`

export async function extractRules(
  brdText: string,
  token?: vscode.CancellationToken
): Promise<Omit<BusinessRule, 'id' | 'relatedFlows'>[]> {
  const result = await callLLMJson<{
    rules: Omit<BusinessRule, 'id' | 'relatedFlows'>[]
  }>(brdText, SYSTEM, token)
  return result.rules
}
