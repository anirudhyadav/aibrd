import * as fs from 'fs'
import * as path from 'path'

export interface ValidationIssue {
  severity: 'error' | 'warning'
  file: string
  message: string
  id?: string
}

export interface ValidationResult {
  issues: ValidationIssue[]
  passed: boolean
}

const ID_PATTERN = /[A-Z]+-?(?:BF|BR|AC|FT|TC|RN|ACT|GBR)-\d+|(?:BF|BR|AC|FT|TC|RN|ACT|GBR)-\d+/g

function extractIds(text: string): Set<string> {
  return new Set(text.match(ID_PATTERN) ?? [])
}

function readIfExists(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : ''
}

export function validateAibrdDir(aibrdDir: string): ValidationResult {
  const issues: ValidationIssue[] = []

  // 1. registry.json must exist
  const registryPath = path.join(aibrdDir, 'registry.json')
  if (!fs.existsSync(registryPath)) {
    issues.push({ severity: 'error', file: 'registry.json', message: 'registry.json not found. Run aibrd: Initialize first.' })
    return { issues, passed: false }
  }

  let registry: Record<string, unknown>
  try {
    registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'))
  } catch {
    issues.push({ severity: 'error', file: 'registry.json', message: 'registry.json is malformed JSON.' })
    return { issues, passed: false }
  }

  const mode = (registry.mode as string) ?? 'flat'

  // 2. collect all CONTEXT.md files
  const contextFiles: string[] = []
  if (mode === 'flat') {
    const ctx = path.join(aibrdDir, 'CONTEXT.md')
    if (fs.existsSync(ctx)) contextFiles.push(ctx)
    else issues.push({ severity: 'error', file: 'CONTEXT.md', message: 'CONTEXT.md not found in flat mode.' })
  } else {
    const modulesDir = path.join(aibrdDir, 'modules')
    if (fs.existsSync(modulesDir)) {
      for (const slug of fs.readdirSync(modulesDir)) {
        const ctx = path.join(modulesDir, slug, 'CONTEXT.md')
        if (fs.existsSync(ctx)) contextFiles.push(ctx)
        else issues.push({ severity: 'warning', file: `modules/${slug}/CONTEXT.md`, message: `Module "${slug}" has no CONTEXT.md.` })
      }
    }
  }

  // 3. collect all IDs defined across CONTEXT files
  const definedIds = new Set<string>()
  for (const f of contextFiles) {
    const text = readIfExists(f)
    const headingIds = [...text.matchAll(/^###\s+([A-Z]+-?(?:BF|BR|AC|FT|TC|RN)-\d+)/gm)]
      .map(m => m[1])
    headingIds.forEach(id => definedIds.add(id))
  }

  // 4. check cross-references in each CONTEXT.md
  for (const f of contextFiles) {
    const text = readIfExists(f)
    const shortFile = f.replace(aibrdDir + path.sep, '')

    // find referenced IDs in _Rules: / _Flows: / _AC: / _Flow: lines
    const refs = [...text.matchAll(/_(?:Rules|Flows|AC|Flow):\s*([^\n_]+)/g)]
    for (const ref of refs) {
      const referenced = ref[1].split(',').map(s => s.trim()).filter(Boolean)
      for (const id of referenced) {
        if (id && !definedIds.has(id)) {
          issues.push({
            severity: 'warning', file: shortFile,
            message: `Cross-reference to "${id}" not found in any CONTEXT.md.`, id
          })
        }
      }
    }

    // check for duplicate IDs within the same file
    const allIds = [...text.matchAll(/^###\s+([A-Z]+-?(?:BF|BR|AC|FT|TC|RN)-\d+)/gm)].map(m => m[1])
    const seen = new Set<string>()
    for (const id of allIds) {
      if (seen.has(id)) {
        issues.push({ severity: 'error', file: shortFile, message: `Duplicate ID "${id}" found.`, id })
      }
      seen.add(id)
    }

    // check changelog exists
    if (!text.includes('## Changelog')) {
      issues.push({ severity: 'warning', file: shortFile, message: 'Missing ## Changelog section.' })
    }
  }

  // 5. check index.md exists for modular
  if (mode === 'modular' && !fs.existsSync(path.join(aibrdDir, 'index.md'))) {
    issues.push({ severity: 'warning', file: 'index.md', message: 'index.md (RTM) not found. Run aibrd: Show Traceability Matrix.' })
  }

  return {
    issues,
    passed: issues.filter(i => i.severity === 'error').length === 0
  }
}

export function formatValidationReport(result: ValidationResult, aibrdDir: string): string {
  const lines = [
    '# CONTEXT.md Validation Report',
    `_Generated: ${new Date().toISOString().split('T')[0]}_`,
    `_Directory: ${aibrdDir}_`,
    ''
  ]

  if (result.passed && result.issues.length === 0) {
    lines.push('✅ All checks passed. No issues found.')
    return lines.join('\n')
  }

  const errors = result.issues.filter(i => i.severity === 'error')
  const warnings = result.issues.filter(i => i.severity === 'warning')

  lines.push(`**${errors.length} error(s) · ${warnings.length} warning(s)**`, '')

  if (errors.length > 0) {
    lines.push('## ❌ Errors', '')
    for (const e of errors) {
      lines.push(`- **${e.file}**: ${e.message}`)
    }
    lines.push('')
  }

  if (warnings.length > 0) {
    lines.push('## ⚠️ Warnings', '')
    for (const w of warnings) {
      lines.push(`- **${w.file}**: ${w.message}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
