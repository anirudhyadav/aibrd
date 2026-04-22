import * as fs from 'fs'
import * as path from 'path'
import { WorkspaceMode } from '../core/models/module'

export interface LoadedContext {
  content: string
  sources: string[]
}

export function loadContextForQuery(
  aibrdDir: string,
  mode: WorkspaceMode,
  moduleSlug?: string
): LoadedContext {
  const sources: string[] = []
  const parts: string[] = []

  const addFile = (filePath: string) => {
    if (fs.existsSync(filePath)) {
      parts.push(fs.readFileSync(filePath, 'utf-8'))
      sources.push(filePath)
    }
  }

  if (mode === 'flat') {
    addFile(path.join(aibrdDir, 'CONTEXT.md'))
  } else {
    addFile(path.join(aibrdDir, 'index.md'))
    addFile(path.join(aibrdDir, 'shared', 'actors.md'))
    addFile(path.join(aibrdDir, 'shared', 'global-rules.md'))

    if (moduleSlug) {
      addFile(path.join(aibrdDir, 'modules', moduleSlug, 'CONTEXT.md'))
    } else {
      // load all module CONTEXT.md files
      const modulesDir = path.join(aibrdDir, 'modules')
      if (fs.existsSync(modulesDir)) {
        for (const slug of fs.readdirSync(modulesDir)) {
          addFile(path.join(modulesDir, slug, 'CONTEXT.md'))
        }
      }
    }
  }

  return { content: parts.join('\n\n---\n\n'), sources }
}

export function loadModuleContext(
  aibrdDir: string,
  moduleSlug: string
): string {
  const contextPath = path.join(aibrdDir, 'modules', moduleSlug, 'CONTEXT.md')
  return fs.existsSync(contextPath) ? fs.readFileSync(contextPath, 'utf-8') : ''
}

export function listModules(aibrdDir: string): string[] {
  const modulesDir = path.join(aibrdDir, 'modules')
  if (!fs.existsSync(modulesDir)) return []
  return fs.readdirSync(modulesDir).filter(f =>
    fs.statSync(path.join(modulesDir, f)).isDirectory()
  )
}

export function readReleases(aibrdDir: string): string[] {
  const releasesDir = path.join(aibrdDir, 'releases')
  if (!fs.existsSync(releasesDir)) return []
  return fs.readdirSync(releasesDir)
    .filter(f => f.endsWith('.md'))
    .map(f => fs.readFileSync(path.join(releasesDir, f), 'utf-8'))
}
