import * as fs from 'fs'
import * as path from 'path'

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true })
}

export function writeFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, content, 'utf-8')
}

export function appendToFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath))
  fs.appendFileSync(filePath, content, 'utf-8')
}

export function initAibrdStructure(aibrdDir: string, modular: boolean): void {
  ensureDir(aibrdDir)
  ensureDir(path.join(aibrdDir, 'shared'))
  ensureDir(path.join(aibrdDir, 'releases'))
  if (modular) {
    ensureDir(path.join(aibrdDir, 'modules'))
  }
}

export function initModuleStructure(aibrdDir: string, moduleSlug: string): void {
  ensureDir(path.join(aibrdDir, 'modules', moduleSlug))
  ensureDir(path.join(aibrdDir, 'modules', moduleSlug, 'tests'))
}

export function writeContextMd(
  aibrdDir: string,
  content: string,
  moduleSlug?: string
): void {
  const filePath = moduleSlug
    ? path.join(aibrdDir, 'modules', moduleSlug, 'CONTEXT.md')
    : path.join(aibrdDir, 'CONTEXT.md')
  writeFile(filePath, content)
}

export function writeTestCases(
  aibrdDir: string,
  content: string,
  moduleSlug?: string
): void {
  const filePath = moduleSlug
    ? path.join(aibrdDir, 'modules', moduleSlug, 'tests', 'test-cases.md')
    : path.join(aibrdDir, 'tests', 'test-cases.md')
  writeFile(filePath, content)
}

export function writeRelease(
  aibrdDir: string,
  version: string,
  content: string
): void {
  const filePath = path.join(aibrdDir, 'releases', `${version}.md`)
  writeFile(filePath, content)
}

export function updateContextMd(
  contextPath: string,
  section: string,
  newContent: string
): void {
  const existing = fs.existsSync(contextPath)
    ? fs.readFileSync(contextPath, 'utf-8')
    : ''
  const updated = existing + '\n\n' + newContent
  writeFile(contextPath, updated)
}
