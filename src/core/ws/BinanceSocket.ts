/** Tek sorumluluk: soket yaşam döngüsü. Mesajı yorumlamaz. */

import { MAX_RECONNECT, reconnectDelay } from './backoff'

export type SocketStatus = 'kapali' | 'baglaniyor' | 'acik' | 'yeniden' | 'olmedi'

export type SocketHandlers = {
  onOpen?: () => void
  onClose?: (ev: CloseEvent) => void
  onError?: (ev: Event) => void
  onMessage?: (raw: string) => void
  onStatus?: (s: SocketStatus) => void
}

const HOT_SWAP_MS = 23 * 60 * 60 * 1000

export class BinanceSocket {
  private ws: WebSocket | null = null
  private url = ''
  private attempt = 0
  private closedByUser = false
  private reconnectTimer = 0
  private hotSwapTimer = 0
  private handlers: SocketHandlers = {}
  lastError: string | null = null

  setHandlers(h: SocketHandlers): void {
    this.handlers = h
  }

  connect(url: string): void {
    this.url = url
    this.closedByUser = false
    this.lastError = null
    this.attempt = 0
    this.tearDownSocket()
    this.openSocket()
  }

  disconnect(): void {
    this.closedByUser = true
    window.clearTimeout(this.reconnectTimer)
    window.clearTimeout(this.hotSwapTimer)
    this.tearDownSocket()
    this.setStatus('kapali')
  }

  getStatus(): SocketStatus {
    if (!this.ws) return 'kapali'
    if (this.ws.readyState === WebSocket.OPEN) return 'acik'
    if (this.ws.readyState === WebSocket.CONNECTING) return 'baglaniyor'
    return 'kapali'
  }

  private tearDownSocket(): void {
    const old = this.ws
    this.ws = null
    if (!old) return
    old.onopen = null
    old.onmessage = null
    old.onerror = null
    old.onclose = null
    if (old.readyState === WebSocket.OPEN || old.readyState === WebSocket.CONNECTING) {
      old.close()
    }
  }

  private openSocket(): void {
    this.setStatus(this.attempt > 0 ? 'yeniden' : 'baglaniyor')
    let ws: WebSocket
    try {
      ws = new WebSocket(this.url)
    } catch (e) {
      this.lastError = e instanceof Error ? e.message : 'soket açılamadı'
      this.scheduleReconnect()
      return
    }
    this.ws = ws

    ws.onopen = () => {
      if (this.ws !== ws) return
      this.attempt = 0
      this.lastError = null
      this.setStatus('acik')
      this.scheduleHotSwap()
      this.handlers.onOpen?.()
    }

    ws.onmessage = (ev) => {
      if (this.ws !== ws) return
      if (typeof ev.data === 'string') this.handlers.onMessage?.(ev.data)
    }

    ws.onerror = (ev) => {
      if (this.ws !== ws) return
      this.lastError = 'soket hata verdi'
      this.handlers.onError?.(ev)
    }

    ws.onclose = (ev) => {
      if (this.ws !== ws) return
      this.ws = null
      this.lastError = ev.reason || `kapandı (${ev.code})`
      this.handlers.onClose?.(ev)
      if (this.closedByUser) return
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    if (this.attempt >= MAX_RECONNECT) {
      this.lastError = 'Bağlantı kesildi, yeniden dene.'
      this.setStatus('olmedi')
      return
    }
    this.setStatus('yeniden')
    const jitter = Math.random() * 400
    const delay = reconnectDelay(this.attempt, jitter)
    this.attempt += 1
    window.clearTimeout(this.reconnectTimer)
    this.reconnectTimer = window.setTimeout(() => {
      if (this.closedByUser) return
      this.openSocket()
    }, delay)
  }

  private scheduleHotSwap(): void {
    window.clearTimeout(this.hotSwapTimer)
    this.hotSwapTimer = window.setTimeout(() => {
      if (this.closedByUser) return
      this.openSocket()
    }, HOT_SWAP_MS)
  }

  private setStatus(s: SocketStatus): void {
    this.handlers.onStatus?.(s)
  }
}
