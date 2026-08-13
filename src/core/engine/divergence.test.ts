import { describe, expect, it } from 'vitest'
import { scoreDivergence } from './divergence'

describe('divergence', () => {
  it('fiyat çıkmış + tepe satış + taban alış = boşaltma', () => {
    const s = scoreDivergence({
      priceChange: 0.8,
      topNet: -20_000,
      botNet: 8_000,
      topAbs: 20_000,
      botAbs: 8_000,
    })
    expect(s.kind).toBe('bosaltma')
  })

  it('fiyat düşmüş + tepe alış + taban satış = toplama', () => {
    const s = scoreDivergence({
      priceChange: -0.7,
      topNet: 30_000,
      botNet: -9_000,
      topAbs: 30_000,
      botAbs: 9_000,
    })
    expect(s.kind).toBe('toplama')
  })

  it('0.5% ile 3% fiyat aynı satüre değil', () => {
    const base = { topNet: -20_000, botNet: 8_000, topAbs: 20_000, botAbs: 8_000 }
    const a = scoreDivergence({ ...base, priceChange: 0.5 })
    const b = scoreDivergence({ ...base, priceChange: 3 })
    expect(b.score).toBeGreaterThan(a.score)
  })

  it('hacim yoksa etiket yok', () => {
    expect(
      scoreDivergence({
        priceChange: 1,
        topNet: -10,
        botNet: 10,
        topAbs: 10,
        botAbs: 10,
      }).kind,
    ).toBe('yok')
  })
  it('OI artınca toplama dipnotu yeni long', () => {
    const s = scoreDivergence({
      priceChange: -0.7,
      topNet: 30_000,
      botNet: -9_000,
      topAbs: 30_000,
      botAbs: 9_000,
      oiDelta: 12,
    })
    expect(s.yazi).toContain('yeni long')
  })

  it('OI düşünce toplama dipnotu kapanış', () => {
    const s = scoreDivergence({
      priceChange: -0.7,
      topNet: 30_000,
      botNet: -9_000,
      topAbs: 30_000,
      botAbs: 9_000,
      oiDelta: -5,
    })
    expect(s.yazi).toContain('short kapanışı')
  })
})
