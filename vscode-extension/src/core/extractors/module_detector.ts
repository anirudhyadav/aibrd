import * as vscode from 'vscode'
import { callLLMJson } from '../../llm/client'
import { DetectedModule } from '../models/module'

interface RawDetected {
  modules: Array<{
    displayName: string
    slug: string
    confidence: 'high' | 'low'
  }>
}

const SYSTEM = `You are a business analyst. Detect the major business domains/modules in this BRD text.
Rules:
- A module is a distinct business capability (e.g. "Payment Processing", "User Authentication")
- Ignore generic sections like "Introduction", "Glossary", "Appendix"
- Use short, clear display names (2-3 words max)
- Slugs must be lowercase, hyphen-separated, no spaces
- Return 1 module for small/single-domain BRDs`

export async function detectModules(
  brdText: string,
  token?: vscode.CancellationToken
): Promise<DetectedModule[]> {
  const raw = await callLLMJson<RawDetected>(
    brdText.slice(0, 12000),
    SYSTEM,
    token
  )

  const prefixesSeen: string[] = []
  return raw.modules.map(m => {
    const prefix = derivePrefix(m.slug, prefixesSeen)
    prefixesSeen.push(prefix)
    return { displayName: m.displayName, slug: m.slug, prefix, confidence: m.confidence }
  })
}

export async function matchOrCreateModule(
  requirementText: string,
  existingModules: DetectedModule[],
  token?: vscode.CancellationToken
): Promise<DetectedModule> {
  if (existingModules.length === 0) {
    const detected = await detectModules(requirementText, token)
    return detected[0] ?? { displayName: 'General', slug: 'general', prefix: 'GEN', confidence: 'low' }
  }

  const moduleList = existingModules.map(m => `${m.slug}: ${m.displayName}`).join('\n')
  const prompt = `Existing modules:\n${moduleList}\n\nNew requirement:\n${requirementText}\n\nWhich existing module does this belong to? If none fit, suggest a new one.`
  const MATCH_SYSTEM = `You are a business analyst. Return JSON: { "slug": "existing-slug-or-new", "displayName": "...", "isNew": true|false, "confidence": "high"|"low" }`

  interface MatchResult { slug: string; displayName: string; isNew: boolean; confidence: 'high' | 'low' }
  const result = await callLLMJson<MatchResult>(prompt, MATCH_SYSTEM, token)

  if (!result.isNew) {
    return existingModules.find(m => m.slug === result.slug) ?? existingModules[0]
  }

  const prefixesSeen = existingModules.map(m => m.prefix)
  const prefix = derivePrefix(result.slug, prefixesSeen)
  return { displayName: result.displayName, slug: result.slug, prefix, confidence: result.confidence }
}

function derivePrefix(slug: string, existing: string[]): string {
  const words = slug.replace(/-/g, ' ').split(' ').filter(Boolean)
  const candidates = [
    words[0].slice(0, 3).toUpperCase(),
    words.map(w => w[0]).join('').toUpperCase(),
    words[0].slice(0, 4).toUpperCase()
  ]
  for (const c of candidates) {
    if (!existing.includes(c)) return c
  }
  let n = 2
  while (existing.includes(candidates[0] + n)) n++
  return candidates[0] + n
}
