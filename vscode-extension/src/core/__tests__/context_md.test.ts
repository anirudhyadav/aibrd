import { generateContextMd, generateChangelogEntry } from './context_md'
import { BRDContent } from '../models/outputs'

describe('context_md generator', () => {
  test('generates context with actors and flows', () => {
    const content: BRDContent = {
      actors: [{ id: 'ACT-001', name: 'Customer', description: 'End user' }],
      flows: [{
        id: 'BF-001',
        name: 'Login',
        description: 'User logs in',
        actors: ['ACT-001'],
        steps: [{ order: 1, description: 'Enter credentials', actor: 'Customer' }],
        relatedRules: [],
        relatedAC: []
      }],
      rules: [{ id: 'BR-001', description: 'Password 8+ chars', relatedFlows: [] }],
      criteria: [{
        id: 'AC-001',
        given: 'user at login',
        when: 'enters valid creds',
        then: 'sees dashboard',
        relatedFlow: 'BF-001',
        relatedRules: []
      }],
      features: []
    }

    const md = generateContextMd([content], 'TestProject')
    expect(md).toContain('# TestProject')
    expect(md).toContain('ACT-001: Customer')
    expect(md).toContain('BF-001: Login')
    expect(md).toContain('BR-001')
    expect(md).toContain('AC-001')
    expect(md).toContain('**Given**')
  })

  test('generateChangelogEntry includes version and date', () => {
    const entry = generateChangelogEntry('1.0', 'Initial release')
    expect(entry).toContain('v1.0')
    expect(entry).toContain('Initial release')
  })

  test('handles modular content', () => {
    const content: BRDContent = {
      moduleSlug: 'payments',
      modulePrefix: 'PAY',
      actors: [],
      flows: [{ id: 'PAY-BF-001', name: 'Process Payment', description: 'Pay', actors: [], steps: [], relatedRules: [], relatedAC: [] }],
      rules: [],
      criteria: [],
      features: []
    }

    const md = generateContextMd([content], 'TestProject')
    expect(md).toContain('Module: payments')
    expect(md).toContain('PAY-BF-001')
  })
})
