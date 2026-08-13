import { describe, expect, it } from 'vitest'
import { BurstDetector } from './burstDetector'
import type { AggTrade } from '../market/aggTrade'

function t(i: number, notional = 3_000): AggTrade {
  return {
    symbol: 'BTCUSDT',
    tradeId: i,
    priceStr: '1',
    qtyStr: '1',
    price: 1,
    qty: 1,
    notional,
    side: 'ALIS',
    timeMs: 1_000 + i * 80,
  }
}

describe('BurstDetector', () => {
  it('tek iri emri burst saymaz', () => {
    const d = new BurstDetector()
    expect(d.push(t(0, 80_000))).toBeNull()
  })

  it('3sn içinde 8 benzer ALIŞ → birleşik niyet', () => {
    const d = new BurstDetector()
    let hit = null
    for (let i = 0; i < 8; i++) hit = d.push(t(i, 3_000))
    expect(hit).not.toBeNull()
    expect(hit!.count).toBe(8)
    expect(hit!.merged).toBeCloseTo(24_000)
    expect(hit!.side).toBe('ALIS')
  })
})
