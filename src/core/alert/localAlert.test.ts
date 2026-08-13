import { describe, expect, it } from 'vitest'
import { alertsEnabled, setAlertsEnabled } from './localAlert'

describe('localAlert', () => {
  it('anahtar yazar', () => {
    const mem: Record<string, string> = {}
    const ls = {
      getItem: (k: string) => mem[k] ?? null,
      setItem: (k: string, v: string) => {
        mem[k] = v
      },
    }
    ;(globalThis as unknown as { localStorage: typeof ls }).localStorage = ls
    setAlertsEnabled(true)
    expect(alertsEnabled()).toBe(true)
    setAlertsEnabled(false)
    expect(alertsEnabled()).toBe(false)
  })
})
