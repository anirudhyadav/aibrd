import * as fs from 'fs'
import { RawBRD } from '../models/brd'

export interface YamlBrdConfig {
  version?: string
  name: string
  modules?: string[]
  mode?: 'flat' | 'modular'
  owner?: string
}

export function parseYamlConfig(filePath: string): YamlBrdConfig {
  const content = fs.readFileSync(filePath, 'utf-8')

  const nameMatch = content.match(/^name:\s*(.+)$/m)
  const name = nameMatch?.[1]?.trim().replace(/^["']|["']$/g, '') ?? 'Untitled'

  const versionMatch = content.match(/^version:\s*["']?(.+?)["']?\s*$/m)
  const version = versionMatch?.[1] ?? '1'

  const modeMatch = content.match(/^mode:\s*["']?(.+?)["']?\s*$/m)
  const mode = (modeMatch?.[1] ?? 'flat') as 'flat' | 'modular'

  const ownerMatch = content.match(/^owner:\s*(.+)$/m)
  const owner = ownerMatch?.[1]?.trim().replace(/^["']|["']$/g, '')

  const modulesMatch = content.match(/^modules:\s*\[(.+)\]/m)
  const modules = modulesMatch?.[1]?.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''))

  return { version, name, mode, owner, modules }
}

export function parseYamlAsBrd(filePath: string): RawBRD {
  const text = fs.readFileSync(filePath, 'utf-8')
  return {
    text,
    source: filePath,
    fileType: 'markdown'
  }
}
