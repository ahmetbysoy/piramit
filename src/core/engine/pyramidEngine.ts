/** Tek sorumluluk: tick al, deftere yaz, snapshot üret. React yok. */

import { parseAggTradePayload, type AggTrade } from '../market/aggTrade'
import { LAYER_NAMES } from './layerNames'
import { netDelta, totalCount, totalNotional, type LayerWallet } from './layerWallet'
import { WindowLedger } from './windowLedger'

export const WINDOW_OPTIONS = [60, 300, 900, 3600] as const
export type WindowSec = (typeof WINDOW_OPTIONS)[number] | 'oturum'

export type LayerView = {
  id: number
  name: string
  buyNotional: number
  sellNotional: number
  buyCount: number
  sellCount: number
  net: number
  share: number
  countShare: number
}

export type PyramidSnapshot = {
  symbol: string
  windowSec: WindowSec
  priceStr: string
  price: number
  changePct: number
  layers: LayerView[]
  sessionLayers: LayerView[]
  lastTrade: AggTrade | null
  tickCount: number
}

export type EngineListener = (s: PyramidSnapshot) => void

function toViews(wallets: LayerWallet[]): LayerView[] {
  const vol = wallets.reduce((a, w) => a + totalNotional(w), 0) || 1
  const cnt = wallets.reduce((a, w) => a + totalCount(w), 0) || 1
  return wallets.map((w, i) => ({
    id: i,
    name: LAYER_NAMES[i],
    buyNotional: w.buyNotional,
    sellNotional: w.sellNotional,
    buyCount: w.buyCount,
    sellCount: w.sellCount,
    net: netDelta(w),
    share: totalNotional(w) / vol,
    countShare: totalCount(w) / cnt,
  }))
}

export class PyramidEngine {
  private readonly ledger = new WindowLedger()
  private symbol = 'BTCUSDT'
  private windowSec: WindowSec = 60
  private lastTrade: AggTrade | null = null
  private tickCount = 0
  private listeners = new Set<EngineListener>()
  private flushTimer = 0
  private dirty = false
  private cached: PyramidSnapshot = this.buildSnapshot()

  setSymbol(symbol: string): void {
    this.symbol = symbol
  }

  setWindow(w: WindowSec): void {
    this.windowSec = w
    this.emit()
  }

  getWindow(): WindowSec {
    return this.windowSec
  }

  ingestRaw(raw: string): void {
    const t = parseAggTradePayload(raw)
    if (!t) return
    this.ingestTrade(t)
  }

  ingestTrade(t: AggTrade): void {
    this.ledger.ingest(t.notional, t.side, t.timeMs, t.price, t.priceStr)
    this.lastTrade = t
    this.tickCount += 1
    this.dirty = true
    if (typeof this.windowSec === 'number') {
      this.ledger.pruneOlderThan(Math.floor(t.timeMs / 1000) - this.windowSec - 5)
    }
  }

  subscribe(fn: EngineListener): () => void {
    this.listeners.add(fn)
    fn(this.snapshot())
    return () => this.listeners.delete(fn)
  }

  start(fps = 20): void {
    window.clearInterval(this.flushTimer)
    this.flushTimer = window.setInterval(() => {
      if (!this.dirty) return
      this.dirty = false
      this.emit()
    }, Math.round(1000 / fps))
  }

  stop(): void {
    window.clearInterval(this.flushTimer)
  }

  snapshot(): PyramidSnapshot {
    return this.cached
  }

  private buildSnapshot(): PyramidSnapshot {
    const now = this.lastTrade?.timeMs ?? Date.now()
    const win =
      this.windowSec === 'oturum'
        ? this.ledger.sessionWallets()
        : this.ledger.sumWindow(this.windowSec, now)
    const px = this.ledger.lastPriceInfo()
    const changePct =
      px.open > 0 ? ((px.price - px.open) / px.open) * 100 : 0
    return {
      symbol: this.symbol,
      windowSec: this.windowSec,
      priceStr: px.priceStr,
      price: px.price,
      changePct,
      layers: toViews(win),
      sessionLayers: toViews(this.ledger.sessionWallets()),
      lastTrade: this.lastTrade,
      tickCount: this.tickCount,
    }
  }

  private emit(): void {
    this.cached = this.buildSnapshot()
    const s = this.cached
    for (const fn of this.listeners) fn(s)
  }
}
