import { describe, expect, it } from 'vitest'
import { oiDelta, oiToUsdt, parseOpenInterest } from './openInterest'

describe('openInterest', () => {
  it('parse + delta', () => {
    const a = parseOpenInterest({ symbol: 'BTCUSDT', openInterest: '10.5' }, 1)
    const b = parseOpenInterest({ symbol: 'BTCUSDT', openInterest: '12' }, 2)
    expect(a?.oi).toBeCloseTo(10.5)
    expect(oiDelta(a, b!)).toBeCloseTo(1.5)
  })

  it('OI kontrat → USDT', () => {
    expect(oiToUsdt(8_520_000, 76.2)).toBeCloseTo(8_520_000 * 76.2)
    expect(oiToUsdt(8_520_000, 0)).toBeNull()
  })
})
