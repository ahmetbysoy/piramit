/** Tek sorumluluk: 1sn × mikro-kova defteri. Katman bilmez. */

import type { Side } from '../market/aggTrade'
import { addToWallet, emptyWallet, type LayerWallet } from './layerWallet'
import { notionalToBucket } from './microBuckets'
import { emptyBucketRow } from './layerMapper'

export type SecondSlice = {
  sec: number
  buckets: LayerWallet[]
}

export class WindowLedger {
  private readonly slices: SecondSlice[] = []
  private session: LayerWallet[] = emptyBucketRow()
  private lastPriceStr = ''
  private lastPrice = 0
  private sessionOpenPrice = 0

  reset(): void {
    this.slices.length = 0
    this.session = emptyBucketRow()
    this.lastPriceStr = ''
    this.lastPrice = 0
    this.sessionOpenPrice = 0
  }

  ingest(notional: number, side: Side, timeMs: number, price: number, priceStr: string): void {
    const b = notionalToBucket(notional)
    const sec = Math.floor(timeMs / 1000)
    let slice = this.slices[this.slices.length - 1]
    if (!slice || slice.sec !== sec) {
      slice = { sec, buckets: emptyBucketRow() }
      this.slices.push(slice)
    }
    addToWallet(slice.buckets[b], side, notional)
    addToWallet(this.session[b], side, notional)
    this.lastPrice = price
    this.lastPriceStr = priceStr
    if (this.sessionOpenPrice === 0) this.sessionOpenPrice = price
  }

  pruneOlderThan(oldestSec: number): void {
    while (this.slices.length && this.slices[0].sec < oldestSec) {
      this.slices.shift()
    }
  }

  sumWindow(windowSec: number, nowMs: number): LayerWallet[] {
    const nowSec = Math.floor(nowMs / 1000)
    const from = nowSec - windowSec + 1
    const out = emptyBucketRow()
    for (const s of this.slices) {
      if (s.sec < from) continue
      mergeInto(out, s.buckets)
    }
    return out
  }

  sessionBuckets(): LayerWallet[] {
    return this.session.map((w) => ({ ...w }))
  }

  lastPriceInfo(): { price: number; priceStr: string; open: number } {
    return {
      price: this.lastPrice,
      priceStr: this.lastPriceStr,
      open: this.sessionOpenPrice,
    }
  }
}

function mergeInto(dst: LayerWallet[], src: LayerWallet[]): void {
  for (let i = 0; i < src.length; i++) {
    const a = dst[i] ?? emptyWallet()
    const b = src[i]
    a.buyNotional += b.buyNotional
    a.sellNotional += b.sellNotional
    a.buyCount += b.buyCount
    a.sellCount += b.sellCount
    dst[i] = a
  }
}
