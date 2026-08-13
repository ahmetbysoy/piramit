import { describe, expect, it } from 'vitest'
import { streamsFor } from './streamPlan'

describe('streamsFor', () => {
  it('tasarruf: sadece aggTrade', () => {
    expect(streamsFor('ETHUSDT', true, true)).toEqual(['ethusdt@aggTrade'])
  })

  it('radar açık: mini ticker da gelir', () => {
    const s = streamsFor('BTCUSDT', true, false)
    expect(s).toContain('btcusdt@aggTrade')
    expect(s).toContain('!miniTicker@arr')
    expect(s).toContain('!forceOrder@arr')
  })
})
