import { describe, expect, it } from 'vitest'
import { loadFavs, toggleFav } from './favorites'

describe('favorites', () => {
  it('ekle çıkar', () => {
    const mem: Record<string, string> = {}
    ;(globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: (k) => mem[k] ?? null,
      setItem: (k, v) => {
        mem[k] = v
      },
    } as Storage
    expect(toggleFav('ethusdt')).toEqual(['ETHUSDT'])
    expect(loadFavs()).toEqual(['ETHUSDT'])
    expect(toggleFav('ETHUSDT')).toEqual([])
  })
})
