import { BRDContent, BusinessFlow, BusinessRule, AcceptanceCriteria } from './models/outputs'

export function resolveId(id: string, contents: BRDContent[]): string | undefined {
  for (const content of contents) {
    const flow = content.flows.find(f => f.id === id)
    if (flow) return `${flow.id}: ${flow.name}`

    const rule = content.rules.find(r => r.id === id)
    if (rule) return `${rule.id}: ${rule.description}`

    const ac = content.criteria.find(a => a.id === id)
    if (ac) return `${ac.id}: Given ${ac.given}`

    const actor = content.actors.find(a => a.id === id)
    if (actor) return `${actor.id}: ${actor.name}`
  }
  return undefined
}

export function findFlowById(id: string, contents: BRDContent[]): BusinessFlow | undefined {
  for (const c of contents) {
    const found = c.flows.find(f => f.id === id)
    if (found) return found
  }
  return undefined
}

export function findRuleById(id: string, contents: BRDContent[]): BusinessRule | undefined {
  for (const c of contents) {
    const found = c.rules.find(r => r.id === id)
    if (found) return found
  }
  return undefined
}

export function findACById(id: string, contents: BRDContent[]): AcceptanceCriteria | undefined {
  for (const c of contents) {
    const found = c.criteria.find(a => a.id === id)
    if (found) return found
  }
  return undefined
}

export function linkRelations(contents: BRDContent[]): BRDContent[] {
  return contents.map(content => {
    const flows = content.flows.map(flow => ({
      ...flow,
      relatedRules: content.rules
        .filter(r => r.relatedFlows.includes(flow.id))
        .map(r => r.id),
      relatedAC: content.criteria
        .filter(ac => ac.relatedFlow === flow.id)
        .map(ac => ac.id)
    }))
    return { ...content, flows }
  })
}
