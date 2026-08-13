import { describe, expect, it } from 'vitest'
import { SignalJournal } from './signalJournal'

describe('SignalJournal', () => {
  it('aynı sinyal 60sn içinde tek satır', () => {
    const j = new SignalJournal()
    j.push({ at: 1000, symbol: 'BTCUSDT', kind: 'toplama', price: 100 })
    j.push({ at: 2000, symbol: 'BTCUSDT', kind: 'toplama', price: 101 })
    expect(j.list()).toHaveLength(1)
  })

  it('15dk sonra yön isabeti', () => {
    const j = new SignalJournal()
    j.push({ at: 0, symbol: 'BTCUSDT', kind: 'toplama', price: 100 })
    j.markPrice(15 * 60_000, 110)
    expect(j.list()[0].later15).toBe(110)
    expect(j.hitRate()).toEqual({ n: 1, ok: 1 })
  })

  it('boşaltma sonra düşüş = isabet', () => {
    const j = new SignalJournal()
    j.push({ at: 0, symbol: 'ETHUSDT', kind: 'bosaltma', price: 200 })
    j.markPrice(15 * 60_000, 190)
    expect(j.hitRate().ok).toBe(1)
  })
})
