import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import {
  writeFile, writeContextMd, writeTestCases,
  writeRelease, initAibrdStructure, initModuleStructure
} from '../writer'

describe('workspace/writer', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aibrd-writer-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  test('writeFile creates parent directories', () => {
    const filePath = path.join(tmpDir, 'deep', 'nested', 'file.md')
    writeFile(filePath, 'content')
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('content')
  })

  test('writeContextMd creates CONTEXT.md in flat mode', () => {
    writeContextMd(tmpDir, '# Context')
    expect(fs.readFileSync(path.join(tmpDir, 'CONTEXT.md'), 'utf-8')).toBe('# Context')
  })

  test('writeContextMd creates module CONTEXT.md', () => {
    writeContextMd(tmpDir, '# Module Context', 'auth')
    const filePath = path.join(tmpDir, 'modules', 'auth', 'CONTEXT.md')
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('# Module Context')
  })

  test('writeTestCases creates test-cases.md', () => {
    writeTestCases(tmpDir, '# Tests')
    expect(fs.existsSync(path.join(tmpDir, 'tests', 'test-cases.md'))).toBe(true)
  })

  test('writeRelease creates versioned release file', () => {
    writeRelease(tmpDir, 'v1.0', '# Release')
    expect(fs.existsSync(path.join(tmpDir, 'releases', 'v1.0.md'))).toBe(true)
  })

  test('initAibrdStructure creates flat structure', () => {
    initAibrdStructure(tmpDir, false)
    expect(fs.existsSync(path.join(tmpDir, 'shared'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'releases'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'modules'))).toBe(false)
  })

  test('initAibrdStructure creates modular structure', () => {
    initAibrdStructure(tmpDir, true)
    expect(fs.existsSync(path.join(tmpDir, 'modules'))).toBe(true)
  })

  test('initModuleStructure creates module directories', () => {
    initModuleStructure(tmpDir, 'payments')
    expect(fs.existsSync(path.join(tmpDir, 'modules', 'payments', 'tests'))).toBe(true)
  })
})
