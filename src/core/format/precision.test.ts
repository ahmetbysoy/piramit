import { describe, expect, it } from 'vitest'
import { PrecisionRegistry } from './precision'

describe('PrecisionRegistry.resolve', () => {
  it('liste yokken bile BTC → BTCUSDT', () => {
    const r = new PrecisionRegistry()
    expect(r.resolve('btc')).toBe('BTCUSDT')
    expect(r.resolve('ETHUSDT')).toBe('ETHUSDT')
  })
})
