import { describe, expect, it } from 'vitest'
import { detectShape } from './morphology'

const empty = Array.from({ length: 7 }, () => ({
  share: 0,
  buyNotional: 0,
  sellNotional: 0,
}))

describe('detectShape', () => {
  it('hacim 0 → bos, NaN yok', () => {
    const s = detectShape(empty)
    expect(s.id).toBe('bos')
    expect(s.yazi).not.toMatch(/NaN/)
  })
})
