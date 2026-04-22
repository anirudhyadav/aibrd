import { BRDChunk } from '../core/models/brd'

const TOKEN_BUDGET = 6000
const CHARS_PER_TOKEN = 4

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

function truncate(text: string, maxTokens: number): string {
  const maxChars = maxTokens * CHARS_PER_TOKEN
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + '\n\n[...truncated for context window]'
}

export function buildExtractionPrompt(chunk: BRDChunk): string {
  const header = chunk.total > 1
    ? `[Chunk ${chunk.index + 1} of ${chunk.total}]\n\n`
    : ''
  return header + chunk.text
}

export function buildQueryPrompt(
  userQuery: string,
  context: string
): string {
  const budget = TOKEN_BUDGET - estimateTokens(userQuery) - 200
  return `CONTEXT:\n${truncate(context, budget)}\n\nQUESTION:\n${userQuery}`
}

export function buildUpdatePrompt(
  newRequirement: string,
  existingContext: string
): string {
  const budget = TOKEN_BUDGET - estimateTokens(newRequirement) - 300
  return `EXISTING CONTEXT:\n${truncate(existingContext, budget)}\n\nNEW REQUIREMENT:\n${newRequirement}`
}

export function buildGapPrompt(
  context: string,
  codeSnippets: string
): string {
  const half = Math.floor((TOKEN_BUDGET - 200) / 2)
  return `REQUIREMENTS:\n${truncate(context, half)}\n\nCODE:\n${truncate(codeSnippets, half)}`
}

export function buildReleaseNotesPrompt(
  context: string,
  gitDiff: string
): string {
  const half = Math.floor((TOKEN_BUDGET - 200) / 2)
  return `REQUIREMENTS:\n${truncate(context, half)}\n\nGIT DIFF:\n${truncate(gitDiff, half)}`
}
