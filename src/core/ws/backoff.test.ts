import { describe, expect, it } from 'vitest'
import { MAX_BACKOFF_MS, reconnectDelay } from './backoff'

describe('reconnectDelay', () => {
  it('üst sınır 30sn', () => {
    expect(reconnectDelay(0, 0)).toBe(1000)
    expect(reconnectDelay(1, 0)).toBe(2000)
    expect(reconnectDelay(20, 0)).toBe(MAX_BACKOFF_MS)
  })
})
