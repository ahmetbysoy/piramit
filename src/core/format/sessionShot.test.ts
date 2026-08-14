import { describe, expect, it } from 'vitest'
import { sessionShotText } from './sessionShot'
import type { PyramidSnapshot } from '../engine/pyramidEngine'

describe('sessionShot', () => {
  it('IDB yok, metin üretir', () => {
    const empty = {
      id: 0,
      name: 'Toz',
      buyNotional: 10,
      sellNotional: 0,
      buyCount: 1,
      sellCount: 0,
      net: 10,
      share: 1,
      countShare: 1,
    }
    const layers = Array.from({ length: 7 }, (_, i) => ({ ...empty, id: i, name: String(i) }))
    const s = {
      symbol: 'SOLUSDT',
      priceStr: '76',
      changePct: 0.1,
      clashYazi: '',
      divYazi: '',
      shapeYazi: 'x',
      windowSec: 60,
      tickCount: 3,
      edgeMode: 'adaptif',
      layers,
    } as PyramidSnapshot
    expect(sessionShotText(s)).toContain('SOLUSDT')
    expect(sessionShotText(s)).toContain('USDT')
  })
})
