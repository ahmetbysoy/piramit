import { describe, expect, it } from 'vitest'
import { formatUsdt } from './money'

describe('formatUsdt', () => {
  it('birim yazar, adet değil', () => {
    expect(formatUsdt(21)).toBe('21 USDT')
    expect(formatUsdt(24800)).toBe('24.8K USDT')
  })
})
