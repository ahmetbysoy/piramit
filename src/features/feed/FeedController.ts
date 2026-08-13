/** Tek sorumluluk: sembol seç → doğru WS URL → motoru besle. */

import { PyramidEngine } from '../../core/engine/pyramidEngine'
import { TapeBuffer } from '../../core/store/tapeBuffer'
import { parseAggTradePayload } from '../../core/market/aggTrade'
import { aggTradeStream, marketCombinedUrl } from '../../core/ws/endpoints'
import { BinanceSocket, type SocketStatus } from '../../core/ws/BinanceSocket'

export class FeedController {
  readonly engine = new PyramidEngine()
  readonly tape = new TapeBuffer(80)
  readonly socket = new BinanceSocket()
  status: SocketStatus = 'kapali'
  lastError: string | null = null
  private symbol = 'BTCUSDT'
  private onUi: (() => void) | null = null

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
      onMessage: (raw) => {
        const t = parseAggTradePayload(raw)
        if (!t) return
        this.engine.ingestTrade(t)
        this.tape.push(t)
      },
    })
  }

  onChange(fn: () => void): void {
    this.onUi = fn
  }

  getSymbol(): string {
    return this.symbol
  }

  start(symbol = this.symbol): void {
    this.symbol = symbol.toUpperCase()
    this.engine.setSymbol(this.symbol)
    this.engine.start(20)
    this.socket.connect(marketCombinedUrl([aggTradeStream(this.symbol)]))
  }

  stop(): void {
    this.socket.disconnect()
    this.engine.stop()
  }
}
