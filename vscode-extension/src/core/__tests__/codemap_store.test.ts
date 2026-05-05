import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { readCodeMap, writeCodeMap, codeMapExists, getChangedFilesSince } from './store'
import { CodeMap, emptyCodeMap } from '../models/codemap'

describe('Code Map Store', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aibrd-test-'))
    fs.mkdirSync(tmpDir, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  test('readCodeMap returns empty when no file exists', () => {
    const cm = readCodeMap(tmpDir, '/workspace')
    expect(cm.mappings).toEqual([])
    expect(cm.workspaceRoot).toBe('/workspace')
  })

  test('writeCodeMap and readCodeMap roundtrip', () => {
    const cm: CodeMap = {
      ...emptyCodeMap('/workspace'),
      mappings: [{
        requirementId: 'BF-001',
        requirementType: 'BF',
        requirementSummary: 'Test flow',
        codeFiles: [{
          path: 'src/test.ts',
          relevance: 'primary',
          symbols: [{ name: 'testFn', kind: 'function', line: 1 }],
          snippet: 'function testFn()',
          lastVerified: '2025-01-01'
        }]
      }],
      fileIndex: { 'src/test.ts': ['BF-001'] }
    }

    writeCodeMap(tmpDir, cm)
    expect(codeMapExists(tmpDir)).toBe(true)

    const loaded = readCodeMap(tmpDir, '/workspace')
    expect(loaded.mappings).toHaveLength(1)
    expect(loaded.mappings[0].requirementId).toBe('BF-001')
    expect(loaded.fileIndex['src/test.ts']).toEqual(['BF-001'])
  })

  test('codeMapExists returns false when missing', () => {
    expect(codeMapExists(tmpDir)).toBe(false)
  })

  test('getChangedFilesSince returns modified files', () => {
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aibrd-ws-'))

    // Create a file
    const testFile = path.join(workDir, 'src', 'test.ts')
    fs.mkdirSync(path.dirname(testFile), { recursive: true })
    fs.writeFileSync(testFile, 'content')

    // Create code map with old timestamp
    const oldDate = new Date(Date.now() - 86400000).toISOString()
    const cm: CodeMap = {
      ...emptyCodeMap(workDir),
      lastUpdated: oldDate
    }

    const changed = getChangedFilesSince(cm, workDir, ['src/test.ts'])
    expect(changed).toContain('src/test.ts')

    fs.rmSync(workDir, { recursive: true, force: true })
  })
})
