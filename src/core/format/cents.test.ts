import { describe, expect, it } from 'vitest'
import { addCents } from './cents'

describe('addCents', () => {
  it('0.1 + 0.2 kuruşta 0.3', () => {
    expect(addCents(0.1, 0.2)).toBe(0.3)
  })
})
