import { describe, expect, it } from 'vitest'
import { formatEdgeRange } from './edgeRange'

describe('formatEdgeRange', () => {
  it('üst açık', () => {
    expect(formatEdgeRange(1_000_000, Infinity)).toMatch(/\+$/)
  })
  it('aralık', () => {
    expect(formatEdgeRange(0, 100)).toContain('–')
  })
})
