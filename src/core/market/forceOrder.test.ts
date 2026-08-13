import { describe, expect, it } from 'vitest'
import { parseForceOrder } from './forceOrder'

describe('parseForceOrder', () => {
  it('SELL likidasyon = SATIŞ', () => {
    const raw = JSON.stringify({
      e: 'forceOrder',
      o: { s: 'BTCUSDT', S: 'SELL', p: '60000', ap: '60000', q: '0.1', T: 1 },
    })
    const l = parseForceOrder(raw)
    expect(l?.side).toBe('SATIS')
    expect(l?.notional).toBeCloseTo(6000)
  })

  it('çöp null', () => {
    expect(parseForceOrder('{"e":"aggTrade"}')).toBeNull()
  })
})
