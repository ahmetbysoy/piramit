/** Tek sorumluluk: 1sn × mikro-kova defteri. Katman bilmez. */

import type { Side } from '../market/aggTrade'
import { addToWallet, emptyWallet, type LayerWallet } from './layerWallet'
import { addCents } from '../format/cents'
import { notionalToBucket } from './microBuckets'
import { emptyBucketRow } from './layerMapper'

export const KEEP_SECONDS = 3600

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
    if (!Number.isFinite(notional) || notional <= 0) return
    if (!Number.isFinite(timeMs)) return
    const b = notionalToBucket(notional)
    const sec = Math.floor(timeMs / 1000)
    const slice = this.sliceFor(sec)
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

  pruneKeep(nowMs: number, keepSec = KEEP_SECONDS): void {
    this.pruneOlderThan(Math.floor(nowMs / 1000) - keepSec)
  }

  sumWindow(windowSec: number, nowMs: number): LayerWallet[] {
    const nowSec = Math.floor(nowMs / 1000)
    const from = nowSec - windowSec + 1
    const out = emptyBucketRow()
    for (const s of this.slices) {
      if (s.sec < from || s.sec > nowSec) continue
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

  sliceCount(): number {
    return this.slices.length
  }

  /** Test / denetim: kovalar zaman sıralı mı */
  isChronological(): boolean {
    for (let i = 1; i < this.slices.length; i++) {
      if (this.slices[i].sec <= this.slices[i - 1].sec) return false
    }
    return true
  }

  private sliceFor(sec: number): SecondSlice {
    const last = this.slices[this.slices.length - 1]
    if (!last) {
      const created = { sec, buckets: emptyBucketRow() }
      this.slices.push(created)
      return created
    }
    if (last.sec === sec) return last
    if (sec > last.sec) {
      const created = { sec, buckets: emptyBucketRow() }
      this.slices.push(created)
      return created
    }
    for (let i = this.slices.length - 2; i >= 0; i--) {
      if (this.slices[i].sec === sec) return this.slices[i]
      if (this.slices[i].sec < sec) {
        const created = { sec, buckets: emptyBucketRow() }
        this.slices.splice(i + 1, 0, created)
        return created
      }
    }
    const created = { sec, buckets: emptyBucketRow() }
    this.slices.unshift(created)
    return created
  }
}

function mergeInto(dst: LayerWallet[], src: LayerWallet[]): void {
  for (let i = 0; i < src.length; i++) {
    const a = dst[i] ?? emptyWallet()
    const b = src[i]
    a.buyNotional = addCents(a.buyNotional, b.buyNotional)
    a.sellNotional = addCents(a.sellNotional, b.sellNotional)
    a.buyCount += b.buyCount
    a.sellCount += b.sellCount
    dst[i] = a
  }
}
