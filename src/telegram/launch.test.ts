import { describe, expect, it } from 'vitest'
import { normalizeLaunchSymbol, symbolFromLocation } from './launch'

describe('launch symbol', () => {
  it('pepe → PEPEUSDT', () => {
    expect(normalizeLaunchSymbol('pepe')).toBe('PEPEUSDT')
    expect(normalizeLaunchSymbol('ETHUSDT')).toBe('ETHUSDT')
  })

  it('?s=sol ve #bnb', () => {
    expect(symbolFromLocation('?s=sol', '')).toBe('SOLUSDT')
    expect(symbolFromLocation('', '#bnb')).toBe('BNBUSDT')
  })
})
