import { describe, expect, it } from 'vitest'
import { sizeScale } from './signalConfig'

describe('sizeScale', () => {
  it('PEPE medyanı BTC’den küçük ölçek', () => {
    expect(sizeScale(80)).toBeLessThan(sizeScale(8_000))
    expect(sizeScale(80)).toBeLessThan(0.1)
  })
})
