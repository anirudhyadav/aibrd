import * as vscode from 'vscode'
import { callLLM } from '../../llm/client'
import { BRDContent } from '../models/outputs'

const SYSTEM = `You are a delivery manager writing a progress report for a non-technical Product Owner.
Compare what was asked for (requirements) against what was built (git changes).
Write in plain English — no requirement IDs visible to the reader, no technical jargon.
Use these sections:
## What Was Asked For
(plain English summary of all requirements)
## What Was Built
(plain English summary of what the git changes delivered)
## Still To Do
(plain English list of outstanding items)
## Risks & Notes
(anything the PO should know before sign-off)`

export async function generatePOReport(
  contents: BRDContent[],
  gitSummary: string,
  version: string,
  token?: vscode.CancellationToken
): Promise<string> {
  const reqSummary = contents.flatMap(c => [
    ...c.flows.map(f => `- ${f.name}: ${f.description}`),
    ...c.rules.map(r => `- Rule: ${r.description}`)
  ]).join('\n')

  const prompt = `REQUIREMENTS (for reference only — do not expose IDs in output):\n${reqSummary.slice(0, 3000)}\n\nGIT CHANGES SUMMARY:\n${gitSummary.slice(0, 2000)}\n\nRELEASE VERSION: ${version}`
  const response = await callLLM(prompt, SYSTEM, token)

  const today = new Date().toISOString().split('T')[0]
  return `# PO Progress Report — ${version}\n_Generated: ${today}_\n\n${response.text}`
}
