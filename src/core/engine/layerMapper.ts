/** Tek sorumluluk: mikro-kova dizisini 7 katmana grupla. */

import { bucketCount, bucketFloor } from './microBuckets'
import { FIXED_EDGES, LAYER_COUNT, type LayerId } from './layerNames'
import {
  emptyWallet,
  type LayerWallet,
} from './layerWallet'

export function emptyBucketRow(): LayerWallet[] {
  return Array.from({ length: bucketCount() }, emptyWallet)
}

export function layerOfBucket(index: number, edges: number[]): LayerId {
  const floor = bucketFloor(index)
  for (let i = 0; i < LAYER_COUNT; i++) {
    if (floor < edges[i + 1]) return i as LayerId
  }
  return 6
}

export function foldBuckets(buckets: LayerWallet[], edges: number[]): LayerWallet[] {
  const out = Array.from({ length: LAYER_COUNT }, emptyWallet)
  for (let i = 0; i < buckets.length; i++) {
    const L = layerOfBucket(i, edges)
    const src = buckets[i]
    const dst = out[L]
    dst.buyNotional += src.buyNotional
    dst.sellNotional += src.sellNotional
    dst.buyCount += src.buyCount
    dst.sellCount += src.sellCount
  }
  return out
}

export function fixedEdges(): number[] {
  return [...FIXED_EDGES]
}
