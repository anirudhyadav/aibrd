import {
  buildExtractionPrompt, buildQueryPrompt, buildUpdatePrompt,
  buildGapPrompt, buildCodeMapPrompt, buildImpactPrompt
} from './context_builder'

describe('context_builder', () => {
  test('buildExtractionPrompt includes chunk header for multi-chunk', () => {
    const prompt = buildExtractionPrompt({
      text: 'test content',
      index: 2,
      total: 5
    })
    expect(prompt).toContain('[Chunk 3 of 5]')
    expect(prompt).toContain('test content')
  })

  test('buildExtractionPrompt skips header for single chunk', () => {
    const prompt = buildExtractionPrompt({
      text: 'test content',
      index: 0,
      total: 1
    })
    expect(prompt).not.toContain('[Chunk')
    expect(prompt).toBe('test content')
  })

  test('buildQueryPrompt includes context and question', () => {
    const prompt = buildQueryPrompt('What is BF-001?', 'Requirements here')
    expect(prompt).toContain('CONTEXT:')
    expect(prompt).toContain('QUESTION:')
    expect(prompt).toContain('What is BF-001?')
  })

  test('buildUpdatePrompt includes existing and new', () => {
    const prompt = buildUpdatePrompt('New requirement', 'Existing context')
    expect(prompt).toContain('EXISTING CONTEXT:')
    expect(prompt).toContain('NEW REQUIREMENT:')
  })

  test('buildGapPrompt includes requirements and code', () => {
    const prompt = buildGapPrompt('Requirements', 'Code here')
    expect(prompt).toContain('REQUIREMENTS:')
    expect(prompt).toContain('CODE:')
  })

  test('buildCodeMapPrompt includes files', () => {
    const prompt = buildCodeMapPrompt('Requirements', [
      { path: 'src/test.ts', content: 'const x = 1' }
    ])
    expect(prompt).toContain('REQUIREMENTS:')
    expect(prompt).toContain('CODE FILES:')
    expect(prompt).toContain('src/test.ts')
  })

  test('buildImpactPrompt includes all three sections', () => {
    const prompt = buildImpactPrompt('Changed req', 'Code map', 'Code snippets')
    expect(prompt).toContain('CHANGED REQUIREMENT:')
    expect(prompt).toContain('CODE MAP:')
    expect(prompt).toContain('RELEVANT CODE:')
  })
})
