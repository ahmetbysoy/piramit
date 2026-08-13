/** Tek sorumluluk: WebSocket yaşam döngüsü. Worker veya ana thread. */

import { MAX_RECONNECT, reconnectDelay } from './backoff'

export type SocketStatus = 'kapali' | 'baglaniyor' | 'acik' | 'yeniden' | 'olmedi'

export type SocketHandlers = {
  onOpen?: () => void
  onClose?: () => void
  onError?: () => void
  onMessage?: (raw: string) => void
  onStatus?: (s: SocketStatus) => void
}

const HOT_SWAP_MS = 23 * 60 * 60 * 1000

export class SocketRuntime {
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
    clearTimeout(this.reconnectTimer)
    clearTimeout(this.hotSwapTimer)
    this.tearDownSocket()
    this.setStatus('kapali')
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

    ws.onerror = () => {
      if (this.ws !== ws) return
      this.lastError = 'soket hata verdi'
      this.handlers.onError?.()
    }

    ws.onclose = (ev) => {
      if (this.ws !== ws) return
      this.ws = null
      this.lastError = ev.reason || `kapandı (${ev.code})`
      this.handlers.onClose?.()
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
    clearTimeout(this.reconnectTimer)
    this.reconnectTimer = setTimeout(() => {
      if (this.closedByUser) return
      this.openSocket()
    }, delay) as unknown as number
  }

  private scheduleHotSwap(): void {
    clearTimeout(this.hotSwapTimer)
    this.hotSwapTimer = setTimeout(() => {
      if (this.closedByUser) return
      this.openSocket()
    }, HOT_SWAP_MS) as unknown as number
  }

  private setStatus(s: SocketStatus): void {
    this.handlers.onStatus?.(s)
  }
}
