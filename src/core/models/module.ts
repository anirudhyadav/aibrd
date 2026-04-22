export type WorkspaceMode = 'flat' | 'modular'

export interface DetectedModule {
  displayName: string
  slug: string
  prefix: string
  confidence: 'high' | 'low'
}

export interface ModuleCounters {
  BF: number
  BR: number
  AC: number
  FT: number
  TC: number
  RN: number
}

export interface ModuleConfig {
  displayName: string
  prefix: string
  counters: ModuleCounters
}

export interface SharedCounters {
  ACT: number
  GBR: number
}

export interface Registry {
  mode: WorkspaceMode
  modules: Record<string, ModuleConfig>
  shared: SharedCounters
}
