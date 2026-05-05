import * as fs from 'fs'
import * as path from 'path'
import { CodeMap, emptyCodeMap } from '../models/codemap'

const CODEMAP_FILE = 'codemap.json'

export function readCodeMap(aibrdDir: string, workspaceRoot: string): CodeMap {
  const filePath = path.join(aibrdDir, CODEMAP_FILE)
  if (!fs.existsSync(filePath)) {
    return emptyCodeMap(workspaceRoot)
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as CodeMap
}

export function writeCodeMap(aibrdDir: string, codeMap: CodeMap): void {
  fs.mkdirSync(aibrdDir, { recursive: true })
  const filePath = path.join(aibrdDir, CODEMAP_FILE)
  fs.writeFileSync(filePath, JSON.stringify(codeMap, null, 2), 'utf-8')
}

export function codeMapExists(aibrdDir: string): boolean {
  return fs.existsSync(path.join(aibrdDir, CODEMAP_FILE))
}

export function getCodeMapAge(aibrdDir: string): number {
  const filePath = path.join(aibrdDir, CODEMAP_FILE)
  if (!fs.existsSync(filePath)) return Infinity
  const stat = fs.statSync(filePath)
  return Date.now() - stat.mtimeMs
}

/**
 * Returns files in the workspace that changed since the code map
 * was last updated (based on file modification time).
 */
export function getChangedFilesSince(
  codeMap: CodeMap,
  workspaceRoot: string,
  allFiles: string[]
): string[] {
  const lastUpdated = new Date(codeMap.lastUpdated).getTime()
  const changed: string[] = []

  for (const rel of allFiles) {
    const fullPath = path.join(workspaceRoot, rel)
    if (!fs.existsSync(fullPath)) continue
    const stat = fs.statSync(fullPath)
    if (stat.mtimeMs > lastUpdated) {
      changed.push(rel)
    }
  }

  return changed
}
