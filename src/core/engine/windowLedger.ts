/** Tek sorumluluk: 1sn kovalar + kayan pencere toplami. Katman bilmez. */

import type { Side } from '../market/aggTrade'
import {
  addToWallet,
  emptyWallet,
  type LayerWallet,
} from './layerWallet'
import { LAYER_COUNT, layerFromNotional } from './layerNames'

export type SecondSlice = {
  sec: number
  layers: LayerWallet[]
}

export class WindowLedger {
  private readonly slices: SecondSlice[] = []
  private readonly session: LayerWallet[] = Array.from({ length: LAYER_COUNT }, emptyWallet)
  private lastPriceStr = ''
  private lastPrice = 0
  private sessionOpenPrice = 0

  ingest(notional: number, side: Side, timeMs: number, price: number, priceStr: string): void {
    const layer = layerFromNotional(notional)
    const sec = Math.floor(timeMs / 1000)
    let slice = this.slices[this.slices.length - 1]
    if (!slice || slice.sec !== sec) {
      slice = {
        sec,
        layers: Array.from({ length: LAYER_COUNT }, emptyWallet),
      }
      this.slices.push(slice)
    }
    addToWallet(slice.layers[layer], side, notional)
    addToWallet(this.session[layer], side, notional)
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
    const out = Array.from({ length: LAYER_COUNT }, emptyWallet)
    for (const s of this.slices) {
      if (s.sec < from) continue
      for (let i = 0; i < LAYER_COUNT; i++) {
        const src = s.layers[i]
        const dst = out[i]
        dst.buyNotional += src.buyNotional
        dst.sellNotional += src.sellNotional
        dst.buyCount += src.buyCount
        dst.sellCount += src.sellCount
      }
    }
    return out
  }

  sessionWallets(): LayerWallet[] {
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
