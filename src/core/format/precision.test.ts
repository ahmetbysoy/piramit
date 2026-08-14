import { describe, expect, it } from 'vitest'
import { PrecisionRegistry } from './precision'

describe('PrecisionRegistry.resolve', () => {
  it('liste yokken bile BTC → BTCUSDT', () => {
    const r = new PrecisionRegistry()
    expect(r.resolve('btc')).toBe('BTCUSDT')
    expect(r.resolve('ETHUSDT')).toBe('ETHUSDT')
  })

  it('CORS öncesi tohum listeden SOL bulunur', () => {
    const r = new PrecisionRegistry()
    expect(r.get('SOLUSDT')?.tickSize).toBeTruthy()
    expect(r.search('SOL').some((s) => s.symbol === 'SOLUSDT')).toBe(true)
  })
})
