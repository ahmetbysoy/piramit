/** Tek sorumluluk: sembol seç → WS + OI → motoru besle. */

import { PyramidEngine } from '../../core/engine/pyramidEngine'
import { TapeBuffer } from '../../core/store/tapeBuffer'
import { parseAggTradePayload } from '../../core/market/aggTrade'
import { parseForceOrder } from '../../core/market/forceOrder'
import { parseMiniTickerArr, type MiniRow } from '../../core/market/miniTicker'
import { OI_URL, oiDelta, parseOpenInterest, type OiSnap } from '../../core/market/openInterest'
import {
  FORCE_ORDER,
  MINI_TICKER,
  aggTradeStream,
  marketCombinedUrl,
} from '../../core/ws/endpoints'
import { BinanceSocket, type SocketStatus } from '../../core/ws/BinanceSocket'
import { PrecisionRegistry } from '../../core/format/precision'

export class FeedController {
  readonly engine = new PyramidEngine()
  readonly tape = new TapeBuffer(80)
  readonly socket = new BinanceSocket()
  readonly precision = new PrecisionRegistry()
  status: SocketStatus = 'kapali'
  lastError: string | null = null
  radar: MiniRow[] = []
  private symbol = 'BTCUSDT'
  private onUi: (() => void) | null = null
  private infoStarted = false
  private oiTimer = 0
  private prevOi: OiSnap | null = null
  private wantRadar = false

  constructor() {
    this.engine.setSymbol(this.symbol)
    this.socket.setHandlers({
      onStatus: (s) => {
        this.status = s
        this.lastError = this.socket.lastError
        this.onUi?.()
      },
      onError: () => {
        this.lastError = this.socket.lastError
        this.onUi?.()
      },
      onMessage: (raw) => this.route(raw),
    })
  }

  onChange(fn: () => void): void {
    this.onUi = fn
  }

  getSymbol(): string {
    return this.symbol
  }

  setRadar(on: boolean): void {
    this.wantRadar = on
    this.reconnect()
  }

  start(symbol = this.symbol): void {
    this.symbol = symbol.toUpperCase()
    this.tape.clear()
    this.engine.setSymbol(this.symbol)
    this.engine.start(20)
    this.prevOi = null
    this.onUi?.()
    if (!this.infoStarted) {
      this.infoStarted = true
      void this.precision.load().then(() => this.onUi?.())
    }
    this.reconnect()
    this.pollOi()
    this.armOi()
  }

  stop(): void {
    this.socket.disconnect()
    this.engine.stop()
    if (typeof window !== 'undefined') window.clearInterval(this.oiTimer)
    else clearInterval(this.oiTimer)
  }

  private reconnect(): void {
    const streams = [aggTradeStream(this.symbol), FORCE_ORDER]
    if (this.wantRadar) streams.push(MINI_TICKER)
    this.socket.connect(marketCombinedUrl(streams))
  }

  private route(raw: string): void {
    const t = parseAggTradePayload(raw)
    if (t) {
      if (t.symbol !== this.symbol) return
      this.engine.ingestTrade(t)
      this.tape.push(t)
      return
    }
    const liq = parseForceOrder(raw)
    if (liq) {
      this.engine.ingestLiq(liq)
      return
    }
    const mini = parseMiniTickerArr(raw)
    if (mini.length) {
      this.radar = mini
        .filter((r) => r.symbol.endsWith('USDT'))
        .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
        .slice(0, 24)
      this.onUi?.()
    }
  }

  private armOi(): void {
    if (typeof window !== 'undefined') {
      window.clearInterval(this.oiTimer)
      this.oiTimer = window.setInterval(() => void this.pollOi(), 30_000)
    }
  }

  private async pollOi(): Promise<void> {
    try {
      const res = await fetch(`${OI_URL}?symbol=${this.symbol}`)
      if (!res.ok) return
      const snap = parseOpenInterest(await res.json())
      if (!snap || snap.symbol !== this.symbol) return
      const d = oiDelta(this.prevOi, snap)
      this.prevOi = snap
      this.engine.setOi(snap.oi, d)
    } catch {
      /* CORS / 451 */
    }
  }
}
