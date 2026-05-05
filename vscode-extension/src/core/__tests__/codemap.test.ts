import {
  emptyCodeMap, buildFileIndex, CodeMap, RequirementMapping
} from '../models/codemap'

describe('Code Map Model', () => {
  test('emptyCodeMap creates valid empty structure', () => {
    const cm = emptyCodeMap('/test/workspace')
    expect(cm.version).toBe('1.0')
    expect(cm.workspaceRoot).toBe('/test/workspace')
    expect(cm.mappings).toEqual([])
    expect(cm.fileIndex).toEqual({})
    expect(cm.lastUpdated).toBeTruthy()
  })

  test('buildFileIndex creates bidirectional mapping', () => {
    const mappings: RequirementMapping[] = [
      {
        requirementId: 'BF-001',
        requirementType: 'BF',
        requirementSummary: 'User login',
        codeFiles: [
          {
            path: 'src/auth/login.ts',
            relevance: 'primary',
            symbols: [{ name: 'loginUser', kind: 'function', line: 10 }],
            snippet: 'export function loginUser()',
            lastVerified: '2025-01-01'
          },
          {
            path: 'src/auth/validate.ts',
            relevance: 'secondary',
            symbols: [],
            snippet: '',
            lastVerified: '2025-01-01'
          }
        ]
      },
      {
        requirementId: 'BR-001',
        requirementType: 'BR',
        requirementSummary: 'Password must be 8+ chars',
        codeFiles: [
          {
            path: 'src/auth/validate.ts',
            relevance: 'primary',
            symbols: [{ name: 'validatePassword', kind: 'function', line: 20 }],
            snippet: 'function validatePassword()',
            lastVerified: '2025-01-01'
          }
        ]
      }
    ]

    const index = buildFileIndex(mappings)

    expect(index['src/auth/login.ts']).toEqual(['BF-001'])
    expect(index['src/auth/validate.ts']).toEqual(['BF-001', 'BR-001'])
  })

  test('buildFileIndex does not duplicate requirement IDs', () => {
    const mappings: RequirementMapping[] = [
      {
        requirementId: 'BF-001',
        requirementType: 'BF',
        requirementSummary: 'Test',
        codeFiles: [
          {
            path: 'src/a.ts',
            relevance: 'primary',
            symbols: [],
            snippet: '',
            lastVerified: '2025-01-01'
          },
          {
            path: 'src/a.ts',
            relevance: 'secondary',
            symbols: [],
            snippet: '',
            lastVerified: '2025-01-01'
          }
        ]
      }
    ]

    const index = buildFileIndex(mappings)
    expect(index['src/a.ts']).toEqual(['BF-001'])
  })
})
