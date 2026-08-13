import { describe, expect, it } from 'vitest'
import { parseMiniTickerArr } from './miniTicker'

describe('miniTicker', () => {
  it('combined array', () => {
    const raw = JSON.stringify({
      stream: '!miniTicker@arr',
      data: [{ s: 'ETHUSDT', c: '2000', P: '1.5', q: '10' }],
    })
    const rows = parseMiniTickerArr(raw)
    expect(rows[0]?.symbol).toBe('ETHUSDT')
    expect(rows[0]?.changePct).toBeCloseTo(1.5)
  })
})
