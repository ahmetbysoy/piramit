import { describe, expect, it } from 'vitest'
import { decimalsFromTickSize, formatPrice } from './formatPrice'

describe('formatPrice', () => {
  it('tick 0.10 → 2 hane, pad', () => {
    expect(decimalsFromTickSize('0.10')).toBe(2)
    expect(formatPrice('63412.5', '0.10')).toBe('63412.50')
  })

  it('küçük coin 7 hane', () => {
    expect(formatPrice('0.0000123', '0.0000001')).toBe('0.0000123')
  })

  it('tam sayı tick', () => {
    expect(formatPrice('104512.7', '1')).toBe('104512')
  })
})
