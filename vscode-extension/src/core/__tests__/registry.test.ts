import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { readRegistry, writeRegistry, nextId, registerModule, derivePrefix } from '../registry'

describe('registry', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aibrd-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  test('readRegistry returns empty registry when file does not exist', () => {
    const registry = readRegistry(tmpDir)
    expect(registry.mode).toBe('flat')
    expect(registry.modules).toEqual({})
    expect(registry.shared.ACT).toBe(0)
    expect(registry.shared.GBR).toBe(0)
  })

  test('writeRegistry and readRegistry round-trip', () => {
    const registry = readRegistry(tmpDir)
    registry.shared.ACT = 3
    writeRegistry(tmpDir, registry)

    const loaded = readRegistry(tmpDir)
    expect(loaded.shared.ACT).toBe(3)
    expect(loaded.mode).toBe('flat')
  })

  test('nextId increments counter in flat mode', () => {
    const registry = readRegistry(tmpDir)
    const { id: id1, registry: r1 } = nextId(registry, 'BF')
    expect(id1).toBe('BF-001')

    const { id: id2 } = nextId(r1, 'BF')
    expect(id2).toBe('BF-002')
  })

  test('nextId works for module mode', () => {
    let registry = readRegistry(tmpDir)
    registry = registerModule(registry, { slug: 'auth', displayName: 'Authentication' })
    const { id } = nextId(registry, 'BF', 'auth')
    expect(id).toMatch(/^AUT-BF-001$/)
  })

  test('derivePrefix generates unique prefix from slug', () => {
    const prefix = derivePrefix('authentication', [])
    expect(prefix).toBeTruthy()
    expect(prefix.length).toBeGreaterThanOrEqual(3)
  })

  test('IDs are never reused after write/read cycle', () => {
    let reg = readRegistry(tmpDir)
    for (let i = 0; i < 5; i++) {
      const { registry: updated } = nextId(reg, 'BR')
      reg = updated
    }
    writeRegistry(tmpDir, reg)

    const loaded = readRegistry(tmpDir)
    const { id } = nextId(loaded, 'BR')
    expect(id).toBe('BR-006')
  })
})
