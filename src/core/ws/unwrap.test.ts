import { describe, expect, it } from 'vitest'
import { unwrapWs } from './unwrap'

describe('unwrapWs', () => {
  it('aggTrade combined tek parse', () => {
    const u = unwrapWs(JSON.stringify({ stream: 'x', data: { e: 'aggTrade', s: 'BTCUSDT' } }))
    expect(u.kind).toBe('aggTrade')
  })

  it('mini array', () => {
    const u = unwrapWs(JSON.stringify({ data: [{ s: 'ETHUSDT' }] }))
    expect(u.kind).toBe('mini')
  })
})
