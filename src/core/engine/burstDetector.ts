/** Tek sorumluluk: kısa salvo → birleşik niyet büyüklüğü. Ham veriyi bozmaz. */

import type { AggTrade, Side } from '../market/aggTrade'

export type BurstHit = {
  side: Side
  count: number
  merged: number
  lastMs: number
}

const WINDOW_MS = 3_000
const MIN_COUNT = 8
const SIZE_LO = 0.45
const SIZE_HI = 2.2

export class BurstDetector {
  private buf: AggTrade[] = []

  reset(): void {
    this.buf = []
  }

  push(t: AggTrade): BurstHit | null {
    this.buf.push(t)
    const from = t.timeMs - WINDOW_MS
    while (this.buf.length && this.buf[0].timeMs < from) this.buf.shift()
    return this.detect(t.side, t.timeMs)
  }

  private detect(side: Side, now: number): BurstHit | null {
    const same = this.buf.filter((x) => x.side === side && now - x.timeMs <= WINDOW_MS)
    if (same.length < MIN_COUNT) return null
    const sizes = same.map((x) => x.notional).sort((a, b) => a - b)
    const med = sizes[Math.floor(sizes.length / 2)]
    const pack = same.filter((x) => x.notional >= med * SIZE_LO && x.notional <= med * SIZE_HI)
    if (pack.length < MIN_COUNT) return null
    const merged = pack.reduce((a, x) => a + x.notional, 0)
    return { side, count: pack.length, merged, lastMs: now }
  }
}
