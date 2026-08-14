/** Tek sorumluluk: kova sayaçlarından yüzdelik eşik + histerezis. */

import { bucketFloor } from './microBuckets'
import { FIXED_EDGES } from './layerNames'
import { sizeScale } from './signalConfig'
import type { LayerWallet } from './layerWallet'
import { totalCount } from './layerWallet'

export const ADAPT_P = [0.5, 0.75, 0.9, 0.97, 0.99, 0.999] as const
export const ADAPT_MIN_TRADES = 40
const HYSTERESIS = 0.18

export function fixedEdges(): number[] {
  return [...FIXED_EDGES]
}

/** BTC tablosunu bu coin'in medyan notional'ına göre ölçekle. */
export function scaleFixedEdges(medianNotional: number): number[] {
  const k = sizeScale(medianNotional)
  return FIXED_EDGES.map((e) => (Number.isFinite(e) ? e * k : e))
}

export function medianFromHistogram(buckets: LayerWallet[]): number {
  const counts = buckets.map(totalCount)
  const total = counts.reduce((a, n) => a + n, 0)
  if (total < 8) return 0
  return percentileFloor(counts, total, 0.5)
}

export function edgesFromHistogram(
  buckets: LayerWallet[],
  prev: number[] | null,
): number[] {
  const counts = buckets.map(totalCount)
  const total = counts.reduce((a, n) => a + n, 0)
  if (total < ADAPT_MIN_TRADES) {
    const med = percentileFloor(counts, total, 0.5)
    return prev ?? (total >= 8 ? scaleFixedEdges(med) : fixedEdges())
  }

  const cuts = ADAPT_P.map((p) => percentileFloor(counts, total, p))
  const next = [0, ...cuts, Infinity]
  if (!prev || prev.length !== next.length) return next
  return next.map((v, i) => {
    if (!Number.isFinite(v) || !Number.isFinite(prev[i])) return v
    const p = prev[i]
    if (p <= 0) return v
    return Math.abs(v - p) / p < HYSTERESIS ? p : v
  })
}

function percentileFloor(counts: number[], total: number, p: number): number {
  const target = total * p
  let acc = 0
  for (let i = 0; i < counts.length; i++) {
    acc += counts[i]
    if (acc >= target) return bucketFloor(i)
  }
  return bucketFloor(counts.length - 1)
}
