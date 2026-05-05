import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

export interface WorkspaceFile {
  path: string
  relativePath: string
  content: string
  language: string
  symbols: SymbolInfo[]
}

export interface SymbolInfo {
  name: string
  kind: string
  line: number
  detail: string
}

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript', '.tsx': 'typescriptreact',
  '.js': 'javascript', '.jsx': 'javascriptreact',
  '.py': 'python', '.java': 'java', '.cs': 'csharp',
  '.go': 'go', '.rs': 'rust', '.rb': 'ruby',
  '.php': 'php', '.swift': 'swift', '.kt': 'kotlin',
  '.cpp': 'cpp', '.c': 'c', '.h': 'c',
  '.vue': 'vue', '.svelte': 'svelte',
}

/**
 * Discovers workspace files using VS Code's native findFiles API.
 * Respects the user's include/exclude patterns from settings.
 */
export async function discoverWorkspaceFiles(
  workspaceRoot: string
): Promise<string[]> {
  const config = vscode.workspace.getConfiguration('aibrd')
  const includePatterns: string[] = config.get('codeMapIncludePatterns') ?? [
    '**/*.ts', '**/*.js', '**/*.py', '**/*.java', '**/*.cs',
    '**/*.go', '**/*.rs', '**/*.tsx', '**/*.jsx'
  ]
  const excludePatterns: string[] = config.get('codeMapExcludePatterns') ?? [
    '**/node_modules/**', '**/dist/**', '**/out/**', '**/.git/**'
  ]

  const excludeGlob = `{${excludePatterns.join(',')}}`
  const allFiles: string[] = []

  for (const pattern of includePatterns) {
    const uris = await vscode.workspace.findFiles(pattern, excludeGlob, 500)
    for (const uri of uris) {
      const rel = path.relative(workspaceRoot, uri.fsPath)
      if (!allFiles.includes(rel)) {
        allFiles.push(rel)
      }
    }
  }

  return allFiles.sort()
}

/**
 * Reads a file and extracts symbol information using VS Code's
 * native document symbol provider (Copilot-powered).
 */
export async function loadFileWithSymbols(
  workspaceRoot: string,
  relativePath: string
): Promise<WorkspaceFile> {
  const fullPath = path.join(workspaceRoot, relativePath)
  const content = fs.readFileSync(fullPath, 'utf-8')
  const ext = path.extname(relativePath).toLowerCase()
  const language = LANGUAGE_MAP[ext] ?? 'plaintext'

  const symbols: SymbolInfo[] = []

  try {
    const uri = vscode.Uri.file(fullPath)
    const docSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
      'vscode.executeDocumentSymbolProvider', uri
    )

    if (docSymbols) {
      flattenSymbols(docSymbols, symbols)
    }
  } catch {
    // Symbol provider not available for this file type — use regex fallback
    extractSymbolsFromText(content, language, symbols)
  }

  return {
    path: fullPath,
    relativePath,
    content,
    language,
    symbols
  }
}

function flattenSymbols(
  docSymbols: vscode.DocumentSymbol[],
  out: SymbolInfo[],
  depth = 0
): void {
  for (const sym of docSymbols) {
    out.push({
      name: sym.name,
      kind: vscode.SymbolKind[sym.kind] ?? 'Unknown',
      line: sym.range.start.line + 1,
      detail: sym.detail ?? ''
    })
    if (sym.children && depth < 2) {
      flattenSymbols(sym.children, out, depth + 1)
    }
  }
}

/**
 * Regex-based symbol extraction fallback when VS Code symbol
 * provider is unavailable.
 */
function extractSymbolsFromText(
  content: string,
  language: string,
  out: SymbolInfo[]
): void {
  const lines = content.split('\n')

  const patterns: Record<string, RegExp[]> = {
    typescript: [
      /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
      /^\s*(?:export\s+)?class\s+(\w+)/,
      /^\s*(?:export\s+)?interface\s+(\w+)/,
      /^\s*(?:export\s+)?type\s+(\w+)/,
      /^\s*(?:export\s+)?const\s+(\w+)\s*=/,
    ],
    python: [
      /^\s*def\s+(\w+)/,
      /^\s*class\s+(\w+)/,
      /^\s*(\w+)\s*=\s*/,
    ],
    java: [
      /^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:class|interface|enum)\s+(\w+)/,
      /^\s*(?:public|private|protected)?\s*(?:static\s+)?[\w<>[\]]+\s+(\w+)\s*\(/,
    ],
    go: [
      /^func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)/,
      /^type\s+(\w+)\s+struct/,
      /^type\s+(\w+)\s+interface/,
    ]
  }

  const langPatterns = patterns[language] ??
    patterns[language.replace('react', '')] ??
    patterns.typescript

  for (let i = 0; i < lines.length; i++) {
    for (const pat of langPatterns) {
      const match = lines[i].match(pat)
      if (match?.[1]) {
        const kind = inferKind(lines[i])
        out.push({
          name: match[1],
          kind,
          line: i + 1,
          detail: lines[i].trim().slice(0, 80)
        })
        break
      }
    }
  }
}

function inferKind(line: string): string {
  if (/\bclass\b/.test(line)) return 'Class'
  if (/\binterface\b/.test(line)) return 'Interface'
  if (/\btype\b/.test(line)) return 'TypeAlias'
  if (/\bfunction\b|\bdef\b|\bfunc\b/.test(line)) return 'Function'
  if (/\bconst\b|\blet\b|\bvar\b/.test(line)) return 'Variable'
  return 'Variable'
}

/**
 * Builds a summary of the workspace suitable for sending as
 * context to the Copilot LLM alongside requirements.
 */
export function buildWorkspaceSummary(
  files: WorkspaceFile[]
): string {
  const lines: string[] = ['# Workspace Code Summary\n']

  for (const file of files) {
    lines.push(`## ${file.relativePath} (${file.language})`)
    if (file.symbols.length > 0) {
      for (const sym of file.symbols) {
        lines.push(`  - ${sym.kind}: ${sym.name} (line ${sym.line})`)
      }
    } else {
      lines.push(`  (no symbols extracted)`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
