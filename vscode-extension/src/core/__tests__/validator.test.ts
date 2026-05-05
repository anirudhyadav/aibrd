import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { validateContext, formatValidationReport } from './validator'

describe('validator', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aibrd-val-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  test('reports error when CONTEXT.md missing', () => {
    const issues = validateContext(tmpDir)
    expect(issues.some(i => i.type === 'error' && i.message.includes('CONTEXT.md not found'))).toBe(true)
  })

  test('reports warning when registry.json missing', () => {
    fs.writeFileSync(path.join(tmpDir, 'CONTEXT.md'), '## Actors\n### ACT-001: User\n## Business Flows\n### BF-001: Login')
    const issues = validateContext(tmpDir)
    expect(issues.some(i => i.type === 'warning' && i.message.includes('registry.json'))).toBe(true)
  })

  test('detects duplicate IDs', () => {
    fs.writeFileSync(path.join(tmpDir, 'CONTEXT.md'),
      '## Actors\n### BF-001: Login\nSome text\n### BF-001: Login Again')
    const issues = validateContext(tmpDir)
    expect(issues.some(i => i.type === 'error' && i.message.includes('Duplicate ID'))).toBe(true)
  })

  test('formatValidationReport shows pass for no issues', () => {
    const report = formatValidationReport([])
    expect(report).toContain('validation passed')
  })
})
