import { describe, expect, it } from 'vitest'
import { loadPrefs, savePrefs } from './prefs'

describe('prefs', () => {
  it('yaz okunur', () => {
    const mem: Record<string, string> = {}
    ;(globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: (k) => mem[k] ?? null,
      setItem: (k, v) => {
        mem[k] = v
      },
    } as Storage
    savePrefs({ symbol: 'pepeusdt', window: 300, edge: 'sabit' })
    expect(loadPrefs()).toEqual({ symbol: 'PEPEUSDT', window: 300, edge: 'sabit' })
  })

  it('çürük json varsayılan', () => {
    const mem: Record<string, string> = { 'piramit-prefs-v1': '{' }
    ;(globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: (k) => mem[k] ?? null,
      setItem: (k, v) => {
        mem[k] = v
      },
    } as Storage
    expect(loadPrefs().symbol).toBe('BTCUSDT')
  })
})
