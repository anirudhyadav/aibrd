import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

export interface TestLink {
  requirementId: string
  requirementTitle: string
  testFiles: string[]
  testCount: number
  covered: boolean
}

export interface TestLinkageReport {
  coveredCount: number
  uncoveredCount: number
  totalTests: number
  links: TestLink[]
}

/** File extensions considered "test files" */
const TEST_PATTERNS = [
  /\.test\.(ts|tsx|js|jsx|py|java)$/,
  /\.spec\.(ts|tsx|js|jsx|py)$/,
  /Test\.(java|py)$/,
  /_test\.(py|go)$/,
]

function isTestFile(filePath: string): boolean {
  return TEST_PATTERNS.some(p => p.test(filePath))
}

/**
 * Scan the workspace for test files that reference each requirement ID.
 * Looks for inline `// aibrd: BF-001` comments OR the ID appearing in any string.
 */
export function linkTestFiles(
  aibrdDir: string,
  workspaceRoot: string,
  slug?: string
): TestLink[] {
  const ctxPath = slug
    ? path.join(aibrdDir, 'modules', slug, 'CONTEXT.md')
    : path.join(aibrdDir, 'CONTEXT.md')

  if (!fs.existsSync(ctxPath)) return []

  const text = fs.readFileSync(ctxPath, 'utf-8')
  const links: TestLink[] = []

  // Collect all test files in workspace
  let allTestFiles: string[] = []
  try {
    const output = execSync(
      `git -C "${workspaceRoot}" ls-files`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    )
    allTestFiles = output.split('\n').filter(f => f && isTestFile(f))
  } catch {
    // fallback: walk file system (capped at 2000 files)
    const walk = (dir: string, results: string[], depth = 0) => {
      if (depth > 5) return
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          walk(fullPath, results, depth + 1)
        } else if (entry.isFile() && isTestFile(fullPath)) {
          results.push(path.relative(workspaceRoot, fullPath))
          if (results.length >= 2000) return
        }
      }
    }
    walk(workspaceRoot, allTestFiles)
  }

  // For each requirement, find which test files mention it
  const reqRegex = /###\s+((?:[A-Z]+-)?(?:BF|AC|TC)-\d+):\s*(.+)/g
  for (const m of text.matchAll(reqRegex)) {
    const id = m[1], title = m[2].trim()
    const matched: string[] = []

    for (const testFile of allTestFiles) {
      const fullPath = path.join(workspaceRoot, testFile)
      try {
        const src = fs.readFileSync(fullPath, 'utf-8')
        if (src.includes(id)) matched.push(testFile)
      } catch { /* skip unreadable */ }
    }

    links.push({
      requirementId: id,
      requirementTitle: title,
      testFiles: matched,
      testCount: matched.length,
      covered: matched.length > 0,
    })
  }

  return links
}

export function buildTestLinkageReport(links: TestLink[]): TestLinkageReport {
  return {
    coveredCount: links.filter(l => l.covered).length,
    uncoveredCount: links.filter(l => !l.covered).length,
    totalTests: links.reduce((s, l) => s + l.testCount, 0),
    links,
  }
}

export function formatTestLinkageReport(report: TestLinkageReport, slug?: string): string {
  const today = new Date().toISOString().split('T')[0]
  const scope = slug ? ` — ${slug}` : ''
  const pct = report.links.length
    ? Math.round((report.coveredCount / report.links.length) * 100)
    : 0

  const lines = [
    `# Test Linkage Report${scope}`,
    `_Generated: ${today}_`,
    '',
    `> **${pct}% requirements covered** · ${report.coveredCount} covered · ${report.uncoveredCount} uncovered · ${report.totalTests} test file references`,
    '',
  ]

  const covered = report.links.filter(l => l.covered)
  const uncovered = report.links.filter(l => !l.covered)

  if (uncovered.length) {
    lines.push('## ❌ Not Covered by Tests', '')
    lines.push('| Requirement | Title |')
    lines.push('|---|---|')
    for (const l of uncovered) {
      lines.push(`| **${l.requirementId}** | ${l.requirementTitle.slice(0, 60)} |`)
    }
    lines.push('')
  }

  if (covered.length) {
    lines.push('## ✅ Covered', '')
    lines.push('| Requirement | Title | Test Files |')
    lines.push('|---|---|---|')
    for (const l of covered) {
      const files = l.testFiles.slice(0, 2).join(', ') + (l.testFiles.length > 2 ? ` +${l.testFiles.length - 2}` : '')
      lines.push(`| **${l.requirementId}** | ${l.requirementTitle.slice(0, 50)} | ${files} |`)
    }
    lines.push('')
  }

  if (uncovered.length) {
    lines.push('## Recommended Actions', '')
    lines.push('- Add `// aibrd: <REQ-ID>` comments in test files to improve traceability.')
    lines.push('- Create test cases for uncovered requirements using `aibrd: Generate Tests`.')
  }

  return lines.join('\n')
}
