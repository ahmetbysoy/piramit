import { describe, expect, it } from 'vitest'
import { parseAggTradePayload, sideFromMakerFlag } from './aggTrade'

describe('m bayrağı', () => {
  it('m=false → ALIŞ (alıcı taker, aske vurdu)', () => {
    expect(sideFromMakerFlag(false)).toBe('ALIS')
  })

  it('m=true → SATIŞ (satıcı taker, bide vurdu)', () => {
    expect(sideFromMakerFlag(true)).toBe('SATIS')
  })
})

describe('parseAggTradePayload', () => {
  const base = {
    e: 'aggTrade',
    s: 'BTCUSDT',
    a: 1,
    p: '63412.50',
    q: '0.010',
    T: 1_700_000_000_000,
  }

  it('combined stream sarmalayıcısını açar', () => {
    const raw = JSON.stringify({ stream: 'btcusdt@aggTrade', data: { ...base, m: false } })
    const t = parseAggTradePayload(raw)
    expect(t?.side).toBe('ALIS')
    expect(t?.priceStr).toBe('63412.50')
    expect(t?.notional).toBeCloseTo(634.125)
  })

  it('m=true SATIŞ', () => {
    const t = parseAggTradePayload(JSON.stringify({ ...base, m: true }))
    expect(t?.side).toBe('SATIS')
  })

  it('çöp JSON null', () => {
    expect(parseAggTradePayload('{')).toBeNull()
    expect(parseAggTradePayload('{"e":"kline"}')).toBeNull()
  })

  it('notional = fiyat × adet (USDT)', () => {
    const t = parseAggTradePayload(
      JSON.stringify({ e: 'aggTrade', s: 'SOLUSDT', a: 2, p: '76.20', q: '0.275', m: false, T: 1 }),
    )
    expect(t?.qty).toBeCloseTo(0.275)
    expect(t?.notional).toBeCloseTo(20.955)
  })

  it('nq varsa RPI hariç miktar', () => {
    const t = parseAggTradePayload(
      JSON.stringify({ e: 'aggTrade', s: 'BTCUSDT', a: 3, p: '100', q: '2', nq: '1.5', m: false, T: 1 }),
    )
    expect(t?.qty).toBeCloseTo(1.5)
    expect(t?.notional).toBeCloseTo(150)
  })
})
