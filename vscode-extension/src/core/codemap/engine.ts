import * as vscode from 'vscode'
import { callLLMJson } from '../../llm/client'
import { buildCodeMapPrompt } from '../../llm/context_builder'
import { discoverWorkspaceFiles, loadFileWithSymbols, WorkspaceFile } from '../../llm/copilot_context'
import {
  CodeMap, RequirementMapping, CodeFileMapping, CodeSymbol,
  buildFileIndex, emptyCodeMap
} from '../models/codemap'

interface LLMCodeMapResult {
  mappings: Array<{
    requirementId: string
    files: Array<{
      path: string
      relevance: 'primary' | 'secondary' | 'test'
      symbols: string[]
      snippet: string
    }>
  }>
}

const SYSTEM = `You are a code analyst mapping business requirements to source code.
For each requirement ID, identify which code files implement or relate to it.
Mark relevance as "primary" (direct implementation), "secondary" (supporting), or "test" (test file).
List key symbol names (functions, classes, etc) in each file that relate to the requirement.
Include a short code snippet (1-2 lines) showing the most relevant code.
Return JSON: {
  "mappings": [{
    "requirementId": "BF-001",
    "files": [{
      "path": "src/auth/login.ts",
      "relevance": "primary",
      "symbols": ["loginUser", "validateCredentials"],
      "snippet": "export async function loginUser(..."
    }]
  }]
}`

/**
 * Scans the workspace codebase and uses Copilot to build a mapping
 * between BRD requirements and code files.
 */
export async function scanAndBuildCodeMap(
  workspaceRoot: string,
  requirements: string,
  token?: vscode.CancellationToken
): Promise<CodeMap> {
  const relativePaths = await discoverWorkspaceFiles(workspaceRoot)

  if (relativePaths.length === 0) {
    return emptyCodeMap(workspaceRoot)
  }

  const files: WorkspaceFile[] = []
  for (const rel of relativePaths.slice(0, 100)) {
    if (token?.isCancellationRequested) break
    try {
      const wf = await loadFileWithSymbols(workspaceRoot, rel)
      files.push(wf)
    } catch {
      // skip unreadable files
    }
  }

  const batchSize = 10
  const allMappings: RequirementMapping[] = []

  for (let i = 0; i < files.length; i += batchSize) {
    if (token?.isCancellationRequested) break

    const batch = files.slice(i, i + batchSize)
    const codeFiles = batch.map(f => ({
      path: f.relativePath,
      content: f.content.slice(0, 2000)
    }))

    const prompt = buildCodeMapPrompt(requirements, codeFiles)

    try {
      const result = await callLLMJson<LLMCodeMapResult>(prompt, SYSTEM, token)

      for (const mapping of result.mappings) {
        const existing = allMappings.find(m => m.requirementId === mapping.requirementId)
        const newFiles: CodeFileMapping[] = mapping.files.map(f => ({
          path: f.path,
          relevance: f.relevance,
          symbols: f.symbols.map(s => toCodeSymbol(s, batch.find(b => b.relativePath === f.path))),
          snippet: f.snippet,
          lastVerified: new Date().toISOString()
        }))

        if (existing) {
          existing.codeFiles.push(...newFiles)
        } else {
          allMappings.push({
            requirementId: mapping.requirementId,
            requirementType: inferType(mapping.requirementId),
            requirementSummary: '',
            codeFiles: newFiles
          })
        }
      }
    } catch {
      // LLM call failed for this batch, continue with next
    }
  }

  const codeMap: CodeMap = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    workspaceRoot,
    mappings: allMappings,
    fileIndex: buildFileIndex(allMappings)
  }

  return codeMap
}

/**
 * Incrementally updates the code map when specific files change.
 * Only re-scans the changed files against all requirements.
 */
export async function updateCodeMapForFiles(
  codeMap: CodeMap,
  changedFiles: string[],
  requirements: string,
  workspaceRoot: string,
  token?: vscode.CancellationToken
): Promise<CodeMap> {
  const files: WorkspaceFile[] = []
  for (const rel of changedFiles) {
    try {
      const wf = await loadFileWithSymbols(workspaceRoot, rel)
      files.push(wf)
    } catch {
      // file may have been deleted
    }
  }

  if (files.length === 0) return codeMap

  const codeFilesInput = files.map(f => ({
    path: f.relativePath,
    content: f.content.slice(0, 2000)
  }))

  const prompt = buildCodeMapPrompt(requirements, codeFilesInput)

  try {
    const result = await callLLMJson<LLMCodeMapResult>(prompt, SYSTEM, token)

    // Remove old entries for changed files
    for (const mapping of codeMap.mappings) {
      mapping.codeFiles = mapping.codeFiles.filter(
        cf => !changedFiles.includes(cf.path)
      )
    }

    // Add new entries
    for (const mapping of result.mappings) {
      const existing = codeMap.mappings.find(m => m.requirementId === mapping.requirementId)
      const newFiles: CodeFileMapping[] = mapping.files.map(f => ({
        path: f.path,
        relevance: f.relevance,
        symbols: f.symbols.map(s => toCodeSymbol(s, files.find(wf => wf.relativePath === f.path))),
        snippet: f.snippet,
        lastVerified: new Date().toISOString()
      }))

      if (existing) {
        existing.codeFiles.push(...newFiles)
      } else {
        codeMap.mappings.push({
          requirementId: mapping.requirementId,
          requirementType: inferType(mapping.requirementId),
          requirementSummary: '',
          codeFiles: newFiles
        })
      }
    }

    // Clean up empty mappings
    codeMap.mappings = codeMap.mappings.filter(m => m.codeFiles.length > 0)
    codeMap.fileIndex = buildFileIndex(codeMap.mappings)
    codeMap.lastUpdated = new Date().toISOString()
  } catch {
    // LLM failed — keep existing map unchanged
  }

  return codeMap
}

function toCodeSymbol(name: string, file?: WorkspaceFile): CodeSymbol {
  if (file) {
    const match = file.symbols.find(s => s.name === name)
    if (match) {
      return {
        name: match.name,
        kind: mapSymbolKind(match.kind),
        line: match.line
      }
    }
  }
  return { name, kind: 'other', line: 0 }
}

function mapSymbolKind(kind: string): CodeSymbol['kind'] {
  const map: Record<string, CodeSymbol['kind']> = {
    'Function': 'function',
    'Class': 'class',
    'Method': 'method',
    'Variable': 'variable',
    'Interface': 'interface',
    'TypeAlias': 'type',
    'Enum': 'other',
    'Property': 'variable',
    'Constructor': 'method',
    'Module': 'other',
  }
  return map[kind] ?? 'other'
}

function inferType(id: string): RequirementMapping['requirementType'] {
  const prefix = id.replace(/-?\d+$/, '').replace(/-$/, '')
  const typeMap: Record<string, RequirementMapping['requirementType']> = {
    'BF': 'BF', 'BR': 'BR', 'AC': 'AC', 'ACT': 'ACT', 'GBR': 'GBR', 'FT': 'FT'
  }
  // Handle modular IDs like PAY-BF-001
  const parts = prefix.split('-')
  const typePart = parts.length > 1 ? parts[parts.length - 1] : parts[0]
  return typeMap[typePart] ?? 'BF'
}
