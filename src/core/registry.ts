import * as fs from 'fs'
import * as path from 'path'
import { Registry, ModuleConfig, DetectedModule, WorkspaceMode } from './models/module'

const REGISTRY_FILE = 'registry.json'

const EMPTY_REGISTRY: Registry = {
  mode: 'flat',
  modules: {},
  shared: { ACT: 0, GBR: 0 }
}

export function readRegistry(aibrdDir: string): Registry {
  const filePath = path.join(aibrdDir, REGISTRY_FILE)
  if (!fs.existsSync(filePath)) {
    return structuredClone(EMPTY_REGISTRY)
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Registry
}

export function writeRegistry(aibrdDir: string, registry: Registry): void {
  const filePath = path.join(aibrdDir, REGISTRY_FILE)
  fs.writeFileSync(filePath, JSON.stringify(registry, null, 2), 'utf-8')
}

export function derivePrefix(slug: string, existing: string[]): string {
  const words = slug.replace(/-/g, ' ').split(' ').filter(Boolean)
  const candidates = [
    words[0].slice(0, 3).toUpperCase(),
    words.map(w => w[0]).join('').toUpperCase(),
    words[0].slice(0, 4).toUpperCase()
  ]
  for (const c of candidates) {
    if (!existing.includes(c)) return c
  }
  let n = 2
  while (existing.includes(candidates[0] + n)) n++
  return candidates[0] + n
}

export function registerModule(
  registry: Registry,
  module: DetectedModule
): Registry {
  if (registry.modules[module.slug]) return registry

  const existingPrefixes = Object.values(registry.modules).map(m => m.prefix)
  const prefix = derivePrefix(module.slug, existingPrefixes)

  const config: ModuleConfig = {
    displayName: module.displayName,
    prefix,
    counters: { BF: 0, BR: 0, AC: 0, FT: 0, TC: 0, RN: 0 }
  }

  return {
    ...registry,
    mode: 'modular',
    modules: { ...registry.modules, [module.slug]: config }
  }
}

export function nextId(
  registry: Registry,
  type: keyof ModuleConfig['counters'],
  moduleSlug?: string
): { id: string; registry: Registry } {
  if (moduleSlug) {
    const mod = registry.modules[moduleSlug]
    if (!mod) throw new Error(`Module not found: ${moduleSlug}`)
    const n = mod.counters[type] + 1
    const id = `${mod.prefix}-${type}-${String(n).padStart(3, '0')}`
    const updated: Registry = {
      ...registry,
      modules: {
        ...registry.modules,
        [moduleSlug]: {
          ...mod,
          counters: { ...mod.counters, [type]: n }
        }
      }
    }
    return { id, registry: updated }
  }

  // flat mode
  const n = (registry.shared as unknown as Record<string, number>)[type] ?? 0
  const next = n + 1
  const id = `${type}-${String(next).padStart(3, '0')}`
  const updated: Registry = {
    ...registry,
    shared: {
      ...registry.shared,
      [type]: next
    } as Registry['shared']
  }
  return { id, registry: updated }
}

export function nextSharedId(
  registry: Registry,
  type: 'ACT' | 'GBR'
): { id: string; registry: Registry } {
  const n = registry.shared[type] + 1
  const id = `${type}-${String(n).padStart(3, '0')}`
  return {
    id,
    registry: {
      ...registry,
      shared: { ...registry.shared, [type]: n }
    }
  }
}

export function setMode(registry: Registry, mode: WorkspaceMode): Registry {
  return { ...registry, mode }
}
