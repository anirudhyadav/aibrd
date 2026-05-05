import { generateRtm } from '../generators/rtm'
import { generateSprintFeed } from '../generators/sprint_feed'
import { detectConflicts } from '../generators/conflict_detector'

describe('generators', () => {
  describe('generateRtm', () => {
    test('returns markdown string', () => {
      const result = generateRtm([])
      expect(typeof result).toBe('string')
      expect(result).toContain('#')
    })
  })

  describe('generateSprintFeed', () => {
    test('returns markdown string', () => {
      const result = generateSprintFeed([])
      expect(typeof result).toBe('string')
    })
  })

  describe('detectConflicts', () => {
    test('returns empty array for no conflicts', () => {
      const result = detectConflicts([])
      expect(Array.isArray(result)).toBe(true)
    })
  })
})
