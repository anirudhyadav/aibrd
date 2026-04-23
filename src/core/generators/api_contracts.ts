import * as vscode from 'vscode'
import { callLLMJson } from '../../llm/client'
import { BRDContent } from '../models/outputs'

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  summary: string
  requirementId: string
  requestBody?: Record<string, unknown>
  responses: Record<string, { description: string; schema?: Record<string, unknown> }>
}

const SYSTEM = `You are a solution architect deriving REST API contracts from business flows.
For each business flow, infer the likely REST endpoint(s) required.
Return JSON: { "endpoints": [{
  "method": "POST",
  "path": "/api/v1/payments",
  "summary": "Initiate a payment",
  "requirementId": "PAY-BF-001",
  "requestBody": { "amount": "number", "currency": "string", "paymentMethod": "string" },
  "responses": { "200": { "description": "Payment accepted" }, "400": { "description": "Invalid payload" } }
}]}`

export async function deriveApiContracts(
  content: BRDContent,
  token?: vscode.CancellationToken
): Promise<ApiEndpoint[]> {
  const flowSummary = content.flows
    .map(f => `${f.id}: ${f.name}\n${f.description}\nSteps: ${f.steps.map(s => s.description).join(' → ')}`)
    .join('\n\n')

  if (!flowSummary.trim()) return []
  const raw = await callLLMJson<{ endpoints: ApiEndpoint[] }>(flowSummary, SYSTEM, token)
  return raw.endpoints
}

export function formatApiContractsAsOpenApi(
  endpoints: ApiEndpoint[],
  projectName: string,
  moduleSlug?: string
): string {
  const title = moduleSlug ? `${projectName} — ${moduleSlug}` : projectName
  const lines = [
    `openapi: "3.0.3"`,
    `info:`,
    `  title: "${title} API (aibrd draft)"`,
    `  version: "0.1.0"`,
    `  description: "Auto-derived from BRD requirements. Review before implementation."`,
    `paths:`
  ]

  const grouped: Record<string, ApiEndpoint[]> = {}
  for (const ep of endpoints) {
    grouped[ep.path] = grouped[ep.path] ?? []
    grouped[ep.path].push(ep)
  }

  for (const [epPath, eps] of Object.entries(grouped)) {
    lines.push(`  "${epPath}":`)
    for (const ep of eps) {
      lines.push(`    ${ep.method.toLowerCase()}:`)
      lines.push(`      summary: "${ep.summary}"`)
      lines.push(`      description: "Traces: ${ep.requirementId}"`)
      lines.push(`      operationId: "${ep.method.toLowerCase()}${epPath.replace(/\//g, '_').replace(/[{}]/g, '')}"`)

      if (ep.requestBody && ['POST', 'PUT', 'PATCH'].includes(ep.method)) {
        lines.push(`      requestBody:`)
        lines.push(`        required: true`)
        lines.push(`        content:`)
        lines.push(`          application/json:`)
        lines.push(`            schema:`)
        lines.push(`              type: object`)
        lines.push(`              properties:`)
        for (const [k, v] of Object.entries(ep.requestBody)) {
          lines.push(`                ${k}:`)
          lines.push(`                  type: ${v}`)
        }
      }

      lines.push(`      responses:`)
      for (const [code, resp] of Object.entries(ep.responses)) {
        lines.push(`        "${code}":`)
        lines.push(`          description: "${resp.description}"`)
      }
    }
  }

  return lines.join('\n')
}

export function formatApiContractsAsMarkdown(endpoints: ApiEndpoint[]): string {
  const today = new Date().toISOString().split('T')[0]
  const lines = [
    '# API Contracts (aibrd draft)',
    `_Generated: ${today} — Review before implementation_`,
    ''
  ]

  for (const ep of endpoints) {
    lines.push(`## \`${ep.method} ${ep.path}\``)
    lines.push(`**${ep.summary}**`)
    lines.push(`_Traces: ${ep.requirementId}_`, '')

    if (ep.requestBody) {
      lines.push('**Request Body:**')
      lines.push('```json')
      lines.push(JSON.stringify(ep.requestBody, null, 2))
      lines.push('```', '')
    }

    lines.push('**Responses:**')
    for (const [code, resp] of Object.entries(ep.responses)) {
      lines.push(`- \`${code}\`: ${resp.description}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
