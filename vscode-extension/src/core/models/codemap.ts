/**
 * DOM-like mapping between BRD requirements and code files.
 *
 * codemap.json lives in .aibrd/ and maintains a bidirectional index:
 *   requirement ID  →  code files that implement it
 *   code file path  →  requirement IDs it implements
 *
 * When a BRD requirement changes, the code map advises which files to update.
 * When a code file changes, it can flag which requirements may be affected.
 */

export interface CodeSymbol {
  name: string
  kind: 'function' | 'class' | 'method' | 'variable' | 'interface' | 'type' | 'component' | 'route' | 'other'
  line: number
}

export interface CodeFileMapping {
  path: string
  relevance: 'primary' | 'secondary' | 'test'
  symbols: CodeSymbol[]
  snippet: string
  lastVerified: string
}

export interface RequirementMapping {
  requirementId: string
  requirementType: 'BF' | 'BR' | 'AC' | 'ACT' | 'GBR' | 'FT'
  requirementSummary: string
  codeFiles: CodeFileMapping[]
}

export interface FileIndex {
  [filePath: string]: string[]
}

export interface CodeMap {
  version: string
  lastUpdated: string
  workspaceRoot: string
  mappings: RequirementMapping[]
  fileIndex: FileIndex
}

export interface ImpactAdvice {
  requirementId: string
  requirementSummary: string
  changeDescription: string
  affectedFiles: Array<{
    path: string
    relevance: 'primary' | 'secondary' | 'test'
    symbols: string[]
    suggestedAction: string
  }>
  effort: 'low' | 'medium' | 'high'
  priority: 'critical' | 'important' | 'minor'
}

export interface CodeMapDelta {
  added: string[]
  removed: string[]
  modified: string[]
}

export function emptyCodeMap(workspaceRoot: string): CodeMap {
  return {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    workspaceRoot,
    mappings: [],
    fileIndex: {}
  }
}

export function buildFileIndex(mappings: RequirementMapping[]): FileIndex {
  const index: FileIndex = {}
  for (const mapping of mappings) {
    for (const file of mapping.codeFiles) {
      if (!index[file.path]) {
        index[file.path] = []
      }
      if (!index[file.path].includes(mapping.requirementId)) {
        index[file.path].push(mapping.requirementId)
      }
    }
  }
  return index
}
