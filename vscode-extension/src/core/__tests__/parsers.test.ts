import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { parseMarkdown } from '../parsers/markdown'
import { parseYamlConfig, parseYamlAsBrd } from '../parsers/yaml'

describe('parsers', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aibrd-parsers-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('parseMarkdown', () => {
    test('reads file and returns RawBRD', () => {
      const filePath = path.join(tmpDir, 'test.md')
      fs.writeFileSync(filePath, '# My BRD\n\nSome content')
      const result = parseMarkdown(filePath)
      expect(result.text).toBe('# My BRD\n\nSome content')
      expect(result.source).toBe(filePath)
      expect(result.fileType).toBe('markdown')
    })
  })

  describe('parseYamlConfig', () => {
    test('parses name and version', () => {
      const filePath = path.join(tmpDir, 'config.yaml')
      fs.writeFileSync(filePath, 'name: My Project\nversion: "2"\nmode: flat\n')
      const result = parseYamlConfig(filePath)
      expect(result.name).toBe('My Project')
      expect(result.version).toBe('2')
      expect(result.mode).toBe('flat')
    })

    test('defaults to flat mode and version 1 when missing', () => {
      const filePath = path.join(tmpDir, 'minimal.yaml')
      fs.writeFileSync(filePath, 'name: Minimal\n')
      const result = parseYamlConfig(filePath)
      expect(result.name).toBe('Minimal')
      expect(result.version).toBe('1')
      expect(result.mode).toBe('flat')
    })
  })

  describe('parseYamlAsBrd', () => {
    test('returns RawBRD with markdown fileType', () => {
      const filePath = path.join(tmpDir, 'brd.yaml')
      fs.writeFileSync(filePath, 'name: Test\n')
      const result = parseYamlAsBrd(filePath)
      expect(result.fileType).toBe('markdown')
      expect(result.source).toBe(filePath)
    })
  })
})
