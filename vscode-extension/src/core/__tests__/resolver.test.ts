import { resolveId, linkRelations } from './resolver'
import { BRDContent } from './models/outputs'

describe('resolver', () => {
  const testContent: BRDContent = {
    actors: [{ id: 'ACT-001', name: 'Customer', description: 'End user' }],
    flows: [{
      id: 'BF-001',
      name: 'Login',
      description: 'User logs in',
      actors: ['ACT-001'],
      steps: [],
      relatedRules: [],
      relatedAC: []
    }],
    rules: [{
      id: 'BR-001',
      description: 'Password must be 8+ chars',
      relatedFlows: ['BF-001']
    }],
    criteria: [{
      id: 'AC-001',
      given: 'user at login page',
      when: 'enters valid credentials',
      then: 'redirected to dashboard',
      relatedFlow: 'BF-001',
      relatedRules: ['BR-001']
    }],
    features: []
  }

  test('resolveId finds flows', () => {
    expect(resolveId('BF-001', [testContent])).toBe('BF-001: Login')
  })

  test('resolveId finds rules', () => {
    expect(resolveId('BR-001', [testContent])).toBe('BR-001: Password must be 8+ chars')
  })

  test('resolveId finds actors', () => {
    expect(resolveId('ACT-001', [testContent])).toBe('ACT-001: Customer')
  })

  test('resolveId returns undefined for unknown IDs', () => {
    expect(resolveId('BF-999', [testContent])).toBeUndefined()
  })

  test('linkRelations connects flows to rules and AC', () => {
    const linked = linkRelations([testContent])
    expect(linked[0].flows[0].relatedRules).toContain('BR-001')
    expect(linked[0].flows[0].relatedAC).toContain('AC-001')
  })
})
