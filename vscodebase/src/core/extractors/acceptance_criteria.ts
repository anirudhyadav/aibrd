import * as vscode from 'vscode'
import { callLLMJson } from '../../llm/client'
import { AcceptanceCriteria } from '../models/outputs'

const SYSTEM = `You are a QA analyst extracting acceptance criteria from a BRD in Given/When/Then format.
For each business flow or feature, derive the key acceptance criteria.
Return JSON: {
  "criteria": [{ "given": "...", "when": "...", "then": "..." }]
}`

export async function extractAcceptanceCriteria(
  brdText: string,
  token?: vscode.CancellationToken
): Promise<Omit<AcceptanceCriteria, 'id' | 'relatedFlow' | 'relatedRules'>[]> {
  const result = await callLLMJson<{
    criteria: Omit<AcceptanceCriteria, 'id' | 'relatedFlow' | 'relatedRules'>[]
  }>(brdText, SYSTEM, token)
  return result.criteria
}
