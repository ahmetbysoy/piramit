/** Tek sorumluluk: 7 katmanın sabit (USDT) sınırları ve sokak adları. */

export const LAYER_COUNT = 7

export type LayerId = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const LAYER_NAMES = [
  'Toz',
  'Karınca',
  'Balık',
  'Yunus',
  'Köpekbalığı',
  'Balina',
  'Kraken',
] as const

/** Sabit mod — BTC ölçeği. Adaptif sonra gruplamada. */
export const FIXED_EDGES = [0, 100, 1_000, 10_000, 50_000, 250_000, 1_000_000, Infinity]

export function layerFromNotional(notional: number): LayerId {
  for (let i = 0; i < LAYER_COUNT; i++) {
    if (notional < FIXED_EDGES[i + 1]) return i as LayerId
  }
  return 6
}
