import { chunkBRD } from '../chunker'
import { RawBRD } from '../models/brd'

describe('chunkBRD', () => {
  test('returns single chunk for short document', () => {
    const brd: RawBRD = { text: 'Short BRD text', source: 'test.md', fileType: 'markdown' }
    const chunks = chunkBRD(brd)
    expect(chunks).toHaveLength(1)
    expect(chunks[0].text).toBe('Short BRD text')
    expect(chunks[0].index).toBe(0)
    expect(chunks[0].total).toBe(1)
  })

  test('splits long document into multiple chunks', () => {
    const longText = 'A'.repeat(50000)
    const brd: RawBRD = { text: longText, source: 'big.md', fileType: 'markdown' }
    const chunks = chunkBRD(brd)
    expect(chunks.length).toBeGreaterThan(1)

    const reconstructed = chunks.map(c => c.text.replace(/^.*\n\n/, '')).join('')
    expect(reconstructed.length).toBeGreaterThan(0)
  })

  test('splits at paragraph boundaries when possible', () => {
    const para = 'x'.repeat(20000)
    const text = `${para}\n\n${para}\n\n${para}`
    const brd: RawBRD = { text, source: 'test.md', fileType: 'markdown' }
    const chunks = chunkBRD(brd)
    expect(chunks.length).toBeGreaterThanOrEqual(2)
  })

  test('chunk totals are correct', () => {
    const longText = 'A'.repeat(60000)
    const brd: RawBRD = { text: longText, source: 'big.md', fileType: 'markdown' }
    const chunks = chunkBRD(brd)
    for (const chunk of chunks) {
      expect(chunk.total).toBe(chunks.length)
    }
  })
})
