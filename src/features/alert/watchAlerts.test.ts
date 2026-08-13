import { describe, expect, it } from 'vitest'
import { watchAlerts } from './watchAlerts'
import type { PyramidSnapshot } from '../../core/engine/pyramidEngine'

function snap(over: Partial<PyramidSnapshot> = {}): PyramidSnapshot {
  const empty = {
    id: 0,
    name: 'Toz',
    buyNotional: 0,
    sellNotional: 0,
    buyCount: 0,
    sellCount: 0,
    net: 0,
    share: 0,
    countShare: 0,
  }
  const layers = Array.from({ length: 7 }, (_, i) => ({ ...empty, id: i, name: String(i) }))
  return {
    symbol: 'BTCUSDT',
    windowSec: 60,
    priceStr: '1',
    price: 1,
    changePct: 0,
    layers,
    sessionLayers: layers,
    lastTrade: null,
    tickCount: 0,
    shapeId: 'bos',
    shapeYazi: '',
    windowBuy: 0,
    windowSell: 0,
    sessionBuy: 0,
    sessionSell: 0,
    edgeMode: 'adaptif',
    burst: null,
    divKind: 'yok',
    divYazi: '',
    oi: null,
    oiDelta: null,
    oiState: 'bekliyor',
    edges: [0, 1, 2, 3, 4, 5, 6, Infinity],
    lastLiq: null,
    journalHits: { n: 0, ok: 0 },
    journal: [],
    clashYazi: '',
    ...over,
  }
}

describe('watchAlerts', () => {
  it('kraken artınca patlamaz', () => {
    const a = snap()
    const layers = a.layers.map((l) => ({ ...l }))
    layers[6] = { ...layers[6], buyNotional: 2_000_000, net: 2_000_000 }
    expect(() => watchAlerts(a, snap({ layers }))).not.toThrow()
  })
})
