import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

export interface StaleRequirement {
  requirementId: string
  requirementTitle: string
  lastContextUpdate: string     // ISO date from git log on CONTEXT.md
  lastCodeTouch: string         // ISO date from git log on matched files
  daysDrift: number
  matchedFiles: string[]
  verdict: 'stale' | 'drifted' | 'ok'
}

export interface StalenessReport {
  staleCount: number
  driftedCount: number
  okCount: number
  items: StaleRequirement[]
}

const STALE_DAYS = 30      // requirement not touched in code for >30 days → stale
const DRIFT_DAYS = 14      // 14–30 days without a code touch → drifting

/**
 * For each BF-XXX / AC-XXX in CONTEXT.md, check the last time matching
 * source files were modified vs the last time the context doc was updated.
 */
export function detectStaleRequirements(
  aibrdDir: string,
  workspaceRoot: string,
  slug?: string
): StaleRequirement[] {
  const ctxPath = slug
    ? path.join(aibrdDir, 'modules', slug, 'CONTEXT.md')
    : path.join(aibrdDir, 'CONTEXT.md')

  if (!fs.existsSync(ctxPath)) return []

  const text = fs.readFileSync(ctxPath, 'utf-8')
  const results: StaleRequirement[] = []
  const now = Date.now()

  // Find context doc's last git touch
  let ctxLastUpdated = new Date().toISOString()
  try {
    ctxLastUpdated = execSync(
      `git -C "${workspaceRoot}" log -1 --format="%aI" -- "${path.relative(workspaceRoot, ctxPath)}"`,
      { encoding: 'utf-8' }
    ).trim() || new Date().toISOString()
  } catch { /* not a git repo */ }

  // Parse requirement IDs + titles
  const reqRegex = /###\s+((?:[A-Z]+-)?BF-\d+):\s*(.+)/g
  for (const m of text.matchAll(reqRegex)) {
    const id = m[1], title = m[2].trim()

    // Grep source files referencing this ID
    let matchedFiles: string[] = []
    try {
      const grepOutput = execSync(
        `git -C "${workspaceRoot}" grep -rl "${id}" -- '*.ts' '*.tsx' '*.js' '*.py' '*.java' 2>/dev/null || true`,
        { encoding: 'utf-8' }
      ).trim()
      matchedFiles = grepOutput ? grepOutput.split('\n').filter(Boolean) : []
    } catch { /* ignore */ }

    let lastCodeTouch = ctxLastUpdated
    if (matchedFiles.length) {
      try {
        const fileArgs = matchedFiles.map(f => `"${f}"`).join(' ')
        lastCodeTouch = execSync(
          `git -C "${workspaceRoot}" log -1 --format="%aI" -- ${fileArgs}`,
          { encoding: 'utf-8' }
        ).trim() || ctxLastUpdated
      } catch { /* ignore */ }
    }

    const daysDrift = Math.round((now - new Date(lastCodeTouch).getTime()) / 86_400_000)
    const verdict: StaleRequirement['verdict'] =
      daysDrift >= STALE_DAYS ? 'stale' :
      daysDrift >= DRIFT_DAYS ? 'drifted' : 'ok'

    results.push({ requirementId: id, requirementTitle: title, lastContextUpdate: ctxLastUpdated, lastCodeTouch, daysDrift, matchedFiles, verdict })
  }

  return results
}

export function buildStalenessReport(items: StaleRequirement[]): StalenessReport {
  return {
    staleCount: items.filter(i => i.verdict === 'stale').length,
    driftedCount: items.filter(i => i.verdict === 'drifted').length,
    okCount: items.filter(i => i.verdict === 'ok').length,
    items,
  }
}

export function formatStalenessReport(report: StalenessReport, slug?: string): string {
  const today = new Date().toISOString().split('T')[0]
  const scope = slug ? ` — ${slug}` : ''
  const lines = [
    `# Staleness Report${scope}`,
    `_Generated: ${today}_`,
    '',
    `> **${report.staleCount}** stale · **${report.driftedCount}** drifting · **${report.okCount}** ok`,
    '',
  ]

  const groups: Array<[StaleRequirement['verdict'], string]> = [
    ['stale', '🔴 Stale (>30 days no code activity)'],
    ['drifted', '🟡 Drifting (14–30 days)'],
    ['ok', '🟢 Up to date'],
  ]

  for (const [verdict, label] of groups) {
    const subset = report.items.filter(i => i.verdict === verdict)
    if (!subset.length) continue
    lines.push(`## ${label}`, '')
    lines.push('| Requirement | Last Code Touch | Days | Files Matched |')
    lines.push('|---|---|---|---|')
    for (const item of subset) {
      const files = item.matchedFiles.length ? item.matchedFiles.slice(0, 3).join(', ') + (item.matchedFiles.length > 3 ? '…' : '') : '_none_'
      lines.push(`| **${item.requirementId}**: ${item.requirementTitle.slice(0, 40)} | ${item.lastCodeTouch.slice(0, 10)} | ${item.daysDrift} | ${files} |`)
    }
    lines.push('')
  }

  if (report.staleCount) {
    lines.push('## Recommended Actions', '')
    lines.push('- Review stale requirements with your PO — have they been dropped?')
    lines.push('- If still valid, update CONTEXT.md or create tasks to implement missing code.')
    lines.push('- If implemented under a different ID reference, add inline `// aibrd: BF-XXX` comments.')
  }

  return lines.join('\n')
}
