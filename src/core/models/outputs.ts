export interface Actor {
  id: string
  name: string
  description: string
}

export interface FlowStep {
  order: number
  description: string
  actor?: string
}

export interface BusinessFlow {
  id: string
  name: string
  description: string
  actors: string[]
  steps: FlowStep[]
  relatedRules: string[]
  relatedAC: string[]
}

export interface BusinessRule {
  id: string
  description: string
  rationale?: string
  relatedFlows: string[]
}

export interface AcceptanceCriteria {
  id: string
  given: string
  when: string
  then: string
  relatedFlow: string
  relatedRules: string[]
}

export interface Feature {
  id: string
  name: string
  description: string
  relatedFlows: string[]
}

export interface BRDContent {
  moduleSlug?: string
  modulePrefix?: string
  actors: Actor[]
  flows: BusinessFlow[]
  rules: BusinessRule[]
  criteria: AcceptanceCriteria[]
  features: Feature[]
}

export interface Ambiguity {
  id: string
  term: string
  context: string
  suggestion: string
}

export interface Conflict {
  ruleA: string
  ruleB: string
  description: string
}

export interface GeneratedOutputs {
  contextMd: string
  uatScripts: string
  testCases: string
  rtm: string
  ambiguities: Ambiguity[]
  conflicts: Conflict[]
}

export interface RTMEntry {
  requirementId: string
  requirementName: string
  testCaseIds: string[]
  codeFiles: string[]
  status: 'covered' | 'partial' | 'missing'
}
