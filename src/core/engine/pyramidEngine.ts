/** Tek sorumluluk: tick al, deftere yaz, snapshot üret. React yok. */

import { parseAggTradePayload, type AggTrade } from '../market/aggTrade'
import type { Liq } from '../market/forceOrder'
import { LAYER_NAMES, TOP_LAYER_FROM, BOT_LAYER_TO } from './layerNames'
import { netDelta, totalCount, totalNotional, type LayerWallet } from './layerWallet'
import { KEEP_SECONDS, WindowLedger } from './windowLedger'
import { foldBuckets, layerFromEdges } from './layerMapper'
import { detectShape, type ShapeId } from './morphology'
import { ADAPT_MIN_TRADES, edgesFromHistogram, medianFromHistogram, scaleFixedEdges } from './adaptiveEdges'
import { BurstDetector, type BurstHit } from './burstDetector'
import { scoreDivergence, type DivKind } from './divergence'
import { SignalJournal } from './signalJournal'
import { readClash } from './windowClash'
import { SIGNAL, sizeScale } from './signalConfig'
import type { OiState } from './oiState'

export const WINDOW_OPTIONS = [60, 300, 900, 3600] as const
export type WindowSec = (typeof WINDOW_OPTIONS)[number] | 'oturum'
export type EdgeMode = 'adaptif' | 'sabit'

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
  edgeMode: EdgeMode
  burst: BurstHit | null
  divKind: DivKind
  divYazi: string
  oi: number | null
  oiDelta: number | null
  oiState: OiState
  edges: number[]
  lastLiq: Liq | null
  journalHits: { n: number; ok: number }
  journal: { id: string; kind: string; symbol: string; price: number; at: number; later15: number | null }[]
  clashYazi: string
  adaptReady: boolean
  adaptFlip: boolean
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
  private readonly burst = new BurstDetector()
  readonly journal = new SignalJournal()
  private symbol = 'BTCUSDT'
  private windowSec: WindowSec = 60
  private lastTrade: AggTrade | null = null
  private tickCount = 0
  private listeners = new Set<EngineListener>()
  private flushTimer = 0
  private dirty = false
  private edgeMode: EdgeMode = 'adaptif'
  private edges = scaleFixedEdges(0)
  private lastBurst: BurstHit | null = null
  private oi: number | null = null
  private oiDelta: number | null = null
  private oiState: OiState = 'bekliyor'
  private lastLiq: Liq | null = null
  private lastJournalKind: DivKind = 'yok'
  private wasAdaptReady = false
  private adaptFlipMs = 0
  private clock: () => number = () => Date.now()
  private cached: PyramidSnapshot = this.buildSnapshot()

  constructor() {
    if (typeof localStorage !== 'undefined') this.journal.load()
  }

  setClock(fn: () => number): void {
    this.clock = fn
  }

  now(): number {
    return this.clock()
  }

  setEdgeMode(m: EdgeMode): void {
    this.edgeMode = m
    this.edges = scaleFixedEdges(0)
    this.emit()
  }

  getEdgeMode(): EdgeMode {
    return this.edgeMode
  }

  setOi(oi: number | null, delta: number | null): void {
    this.oi = oi
    this.oiDelta = delta
    this.oiState = oi == null ? 'yok' : 'ok'
    this.dirty = true
  }

  markOiFail(): void {
    this.oiState = this.oi != null ? 'eski' : 'yok'
    this.dirty = true
  }

  ingestLiq(l: Liq): void {
    if (l.symbol !== this.symbol) return
    this.lastLiq = l
    this.dirty = true
  }

  setSymbol(symbol: string): void {
    this.symbol = symbol.toUpperCase()
    this.reset()
  }

  reset(): void {
    this.ledger.reset()
    this.burst.reset()
    this.lastTrade = null
    this.tickCount = 0
    this.lastBurst = null
    this.lastLiq = null
    this.oi = null
    this.oiDelta = null
    this.oiState = 'bekliyor'
    this.lastJournalKind = 'yok'
    this.wasAdaptReady = false
    this.adaptFlipMs = 0
    this.edges = scaleFixedEdges(0)
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
    const hit = this.burst.push(t)
    if (hit) this.lastBurst = hit
    this.lastTrade = t
    this.tickCount += 1
    this.journal.markPrice(this.now(), t.price)
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
    const sessionBuckets = this.ledger.sessionBuckets()
    const med = medianFromHistogram(sessionBuckets)
    const scale = sizeScale(med || 0)
    const adaptReady = this.edgeMode === 'adaptif' && this.tickCount >= ADAPT_MIN_TRADES
    if (adaptReady && !this.wasAdaptReady) {
      this.adaptFlipMs = now
      this.wasAdaptReady = true
    }
    if (this.edgeMode === 'adaptif') {
      this.edges = edgesFromHistogram(sessionBuckets, this.edges)
    } else {
      this.edges = scaleFixedEdges(med || 0)
    }
    const winBuckets =
      this.windowSec === 'oturum'
        ? sessionBuckets
        : this.ledger.sumWindow(this.windowSec, now)
    let folded = foldBuckets(winBuckets, this.edges)
    if (this.lastBurst && now - this.lastBurst.lastMs < SIGNAL.burstMs) {
      const L = layerFromEdges(this.lastBurst.merged, this.edges)
      if (this.lastBurst.side === 'ALIS') {
        folded[L].buyNotional += this.lastBurst.merged * SIGNAL.burstOverlay
        folded[L].buyCount += 1
      } else {
        folded[L].sellNotional += this.lastBurst.merged * SIGNAL.burstOverlay
        folded[L].sellCount += 1
      }
    }
    const layers = toViews(folded)
    const sessionLayers = toViews(foldBuckets(sessionBuckets, this.edges))
    const px = this.ledger.lastPriceInfo()
    const changePct = px.open > 0 ? ((px.price - px.open) / px.open) * 100 : 0
    const shape = detectShape(layers, scale)
    const w = sides(winBuckets)
    const s = sides(sessionBuckets)
    const top = layers.slice(TOP_LAYER_FROM)
    const bot = layers.slice(0, BOT_LAYER_TO)
    const topNet = top.reduce((a, l) => a + l.net, 0)
    const botNet = bot.reduce((a, l) => a + l.net, 0)
    const topAbs = top.reduce((a, l) => a + l.buyNotional + l.sellNotional, 0)
    const botAbs = bot.reduce((a, l) => a + l.buyNotional + l.sellNotional, 0)
    const div = scoreDivergence({
      priceChange: changePct,
      topNet,
      botNet,
      topAbs,
      botAbs,
      oiDelta: this.oiDelta,
      minVol: SIGNAL.divMinVol * scale,
    })
    const shortLayers = toViews(foldBuckets(this.ledger.sumWindow(60, now), this.edges))
    const shortTop = shortLayers.slice(TOP_LAYER_FROM).reduce((a, l) => a + l.net, 0)
    const sessTopNet = sessionLayers.slice(TOP_LAYER_FROM).reduce((a, l) => a + l.net, 0)
    const clash = readClash(shortTop, sessTopNet, SIGNAL.clashMin * scale)
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
      edgeMode: this.edgeMode,
      burst: this.lastBurst && now - this.lastBurst.lastMs < 4_000 ? this.lastBurst : null,
      divKind: div.kind,
      divYazi: div.yazi,
      oi: this.oi,
      oiDelta: this.oiDelta,
      oiState: this.oiState,
      edges: this.edges.slice(),
      lastLiq: this.lastLiq,
      journalHits: this.journal.hitRate(),
      journal: this.journal.list().slice(0, 12).map((r) => ({
        id: r.id,
        kind: r.kind,
        symbol: r.symbol,
        price: r.price,
        at: r.at,
        later15: r.later15,
      })),
      clashYazi: clash.yazi,
      adaptReady,
      adaptFlip: adaptReady && now - this.adaptFlipMs < 2000,
    }
  }

  private emit(): void {
    this.cached = this.buildSnapshot()
    this.commitJournal(this.cached)
    const s = this.cached
    for (const fn of this.listeners) fn(s)
  }

  private commitJournal(s: PyramidSnapshot): void {
    if (s.divKind !== 'yok' && s.divKind !== this.lastJournalKind && s.price > 0) {
      this.journal.push({
        at: this.now(),
        symbol: this.symbol,
        kind: s.divKind,
        price: s.price,
      })
    }
    this.lastJournalKind = s.divKind
  }
}
