/** Tek sorumluluk: tick al, deftere yaz, snapshot üret. React yok. */

import { parseAggTradePayload, type AggTrade } from '../market/aggTrade'
import { LAYER_NAMES } from './layerNames'
import { netDelta, totalCount, totalNotional, type LayerWallet } from './layerWallet'
import { KEEP_SECONDS, WindowLedger } from './windowLedger'
import { fixedEdges, foldBuckets } from './layerMapper'
import { detectShape, type ShapeId } from './morphology'

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
  shapeId: ShapeId
  shapeYazi: string
  windowBuy: number
  windowSell: number
  sessionBuy: number
  sessionSell: number
}

export type EngineListener = (s: PyramidSnapshot) => void

function toViews(wallets: LayerWallet[]): LayerView[] {
  const vol = wallets.reduce((a, w) => a + totalNotional(w), 0)
  const cnt = wallets.reduce((a, w) => a + totalCount(w), 0)
  return wallets.map((w, i) => ({
    id: i,
    name: LAYER_NAMES[i],
    buyNotional: w.buyNotional,
    sellNotional: w.sellNotional,
    buyCount: w.buyCount,
    sellCount: w.sellCount,
    net: netDelta(w),
    share: vol > 0 ? totalNotional(w) / vol : 0,
    countShare: cnt > 0 ? totalCount(w) / cnt : 0,
  }))
}

function sides(wallets: LayerWallet[]): { buy: number; sell: number } {
  let buy = 0
  let sell = 0
  for (const w of wallets) {
    buy += w.buyNotional
    sell += w.sellNotional
  }
  return { buy, sell }
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
  private edges = fixedEdges()
  private clock: () => number = () => Date.now()
  private cached: PyramidSnapshot = this.buildSnapshot()

  /** Test için duvar saati. */
  setClock(fn: () => number): void {
    this.clock = fn
  }

  now(): number {
    return this.clock()
  }

  setSymbol(symbol: string): void {
    this.symbol = symbol.toUpperCase()
    this.reset()
  }

  reset(): void {
    this.ledger.reset()
    this.lastTrade = null
    this.tickCount = 0
    this.dirty = false
    this.emit()
  }

  setWindow(w: WindowSec): void {
    this.windowSec = w
    this.emit()
  }

  getWindow(): WindowSec {
    return this.windowSec
  }

  getSymbol(): string {
    return this.symbol
  }

  ingestRaw(raw: string): void {
    const t = parseAggTradePayload(raw)
    if (!t) return
    this.ingestTrade(t)
  }

  ingestTrade(t: AggTrade): void {
    if (t.symbol !== this.symbol) return
    this.ledger.ingest(t.notional, t.side, t.timeMs, t.price, t.priceStr)
    this.ledger.pruneKeep(this.now(), KEEP_SECONDS)
    this.lastTrade = t
    this.tickCount += 1
    this.dirty = true
  }

  subscribe(fn: EngineListener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  start(fps = 20): void {
    const tick = () => {
      if (!this.dirty) return
      this.dirty = false
      this.emit()
    }
    if (typeof window !== 'undefined') {
      window.clearInterval(this.flushTimer)
      this.flushTimer = window.setInterval(tick, Math.round(1000 / fps))
    } else {
      this.flushTimer = setInterval(tick, Math.round(1000 / fps)) as unknown as number
    }
  }

  stop(): void {
    if (typeof window !== 'undefined') window.clearInterval(this.flushTimer)
    else clearInterval(this.flushTimer)
  }

  /** Test: bekleyen tick'i hemen bas. */
  flush(): void {
    this.dirty = false
    this.emit()
  }

  snapshot(): PyramidSnapshot {
    return this.cached
  }

  ledgerChronological(): boolean {
    return this.ledger.isChronological()
  }

  private buildSnapshot(): PyramidSnapshot {
    const now = this.now()
    const winBuckets =
      this.windowSec === 'oturum'
        ? this.ledger.sessionBuckets()
        : this.ledger.sumWindow(this.windowSec, now)
    const sessionBuckets = this.ledger.sessionBuckets()
    const layers = toViews(foldBuckets(winBuckets, this.edges))
    const sessionLayers = toViews(foldBuckets(sessionBuckets, this.edges))
    const px = this.ledger.lastPriceInfo()
    const changePct = px.open > 0 ? ((px.price - px.open) / px.open) * 100 : 0
    const shape = detectShape(layers)
    const w = sides(winBuckets)
    const s = sides(sessionBuckets)
    return {
      symbol: this.symbol,
      windowSec: this.windowSec,
      priceStr: px.priceStr,
      price: px.price,
      changePct,
      layers,
      sessionLayers,
      lastTrade: this.lastTrade,
      tickCount: this.tickCount,
      shapeId: shape.id,
      shapeYazi: shape.yazi,
      windowBuy: w.buy,
      windowSell: w.sell,
      sessionBuy: s.buy,
      sessionSell: s.sell,
    }
  }

  private emit(): void {
    this.cached = this.buildSnapshot()
    const s = this.cached
    for (const fn of this.listeners) fn(s)
  }
}
