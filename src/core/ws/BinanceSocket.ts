/** Tek sorumluluk: soket yaşam döngüsü. Mesajı yorumlamaz. */

export type SocketStatus = 'kapali' | 'baglaniyor' | 'acik' | 'yeniden'

export type SocketHandlers = {
  onOpen?: () => void
  onClose?: (ev: CloseEvent) => void
  onError?: (ev: Event) => void
  onMessage?: (raw: string) => void
  onStatus?: (s: SocketStatus) => void
}

const MAX_BACKOFF_MS = 30_000
const HOT_SWAP_MS = 23 * 60 * 60 * 1000

export class BinanceSocket {
  private ws: WebSocket | null = null
  private url = ''
  private attempt = 0
  private closedByUser = false
  private reconnectTimer = 0
  private hotSwapTimer = 0
  private handlers: SocketHandlers = {}

  setHandlers(h: SocketHandlers): void {
    this.handlers = h
  }

  connect(url: string): void {
    this.url = url
    this.closedByUser = false
    this.openSocket()
  }

  disconnect(): void {
    this.closedByUser = true
    window.clearTimeout(this.reconnectTimer)
    window.clearTimeout(this.hotSwapTimer)
    this.ws?.close()
    this.ws = null
    this.setStatus('kapali')
  }

  getStatus(): SocketStatus {
    if (!this.ws) return 'kapali'
    if (this.ws.readyState === WebSocket.OPEN) return 'acik'
    if (this.ws.readyState === WebSocket.CONNECTING) return 'baglaniyor'
    return 'kapali'
  }

  private openSocket(): void {
    this.setStatus(this.attempt > 0 ? 'yeniden' : 'baglaniyor')
    const ws = new WebSocket(this.url)
    this.ws = ws

    ws.onopen = () => {
      this.attempt = 0
      this.setStatus('acik')
      this.scheduleHotSwap()
      this.handlers.onOpen?.()
    }

    ws.onmessage = (ev) => {
      if (typeof ev.data === 'string') this.handlers.onMessage?.(ev.data)
    }

    ws.onerror = (ev) => this.handlers.onError?.(ev)

    ws.onclose = (ev) => {
      this.handlers.onClose?.(ev)
      if (this.closedByUser) return
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    this.setStatus('yeniden')
    const jitter = Math.random() * 400
    const delay = Math.min(1000 * 2 ** this.attempt, MAX_BACKOFF_MS) + jitter
    this.attempt += 1
    this.reconnectTimer = window.setTimeout(() => this.openSocket(), delay)
  }

  private scheduleHotSwap(): void {
    window.clearTimeout(this.hotSwapTimer)
    this.hotSwapTimer = window.setTimeout(() => {
      if (this.closedByUser) return
      const old = this.ws
      this.openSocket()
      window.setTimeout(() => old?.close(), 1500)
    }, HOT_SWAP_MS)
  }

  private setStatus(s: SocketStatus): void {
    this.handlers.onStatus?.(s)
  }
}
