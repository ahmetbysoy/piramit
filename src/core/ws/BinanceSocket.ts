/** Tek sorumluluk: soket yüzeyi. Mümkünse Worker, yoksa ana thread. */

import { SocketRuntime, type SocketHandlers, type SocketStatus } from './socketRuntime'

export type { SocketStatus, SocketHandlers }

type WorkerIn = { t: 'status' | 'err' | 'msg'; s?: SocketStatus; err?: string | null; raw?: string }

export class BinanceSocket {
  private handlers: SocketHandlers = {}
  private worker: Worker | null = null
  private local: SocketRuntime | null = null
  lastError: string | null = null

  setHandlers(h: SocketHandlers): void {
    this.handlers = h
  }

  connect(url: string): void {
    this.ensure()
    if (this.worker) {
      this.worker.postMessage({ t: 'connect', url })
      return
    }
    this.local!.connect(url)
  }

  disconnect(): void {
    if (this.worker) {
      this.worker.postMessage({ t: 'disconnect' })
      return
    }
    this.local?.disconnect()
  }

  getStatus(): SocketStatus {
    return 'kapali'
  }

  private ensure(): void {
    if (this.worker || this.local) return
    if (canWorker()) {
      try {
        this.worker = new Worker(new URL('./socket.worker.ts', import.meta.url), { type: 'module' })
        this.worker.onmessage = (e: MessageEvent<WorkerIn>) => this.fromWorker(e.data)
        this.worker.onerror = () => {
          this.lastError = 'worker hata'
          this.handlers.onError?.()
        }
        return
      } catch {
        this.worker = null
      }
    }
    this.local = new SocketRuntime()
    this.local.setHandlers({
      onOpen: () => this.handlers.onOpen?.(),
      onClose: () => this.handlers.onClose?.(),
      onError: () => {
        this.lastError = this.local?.lastError ?? 'soket hata verdi'
        this.handlers.onError?.()
      },
      onMessage: (raw) => this.handlers.onMessage?.(raw),
      onStatus: (s) => {
        this.lastError = this.local?.lastError ?? this.lastError
        this.handlers.onStatus?.(s)
      },
    })
  }

  private fromWorker(m: WorkerIn): void {
    if (m.err != null) this.lastError = m.err
    if (m.t === 'msg' && m.raw != null) this.handlers.onMessage?.(m.raw)
    if (m.t === 'status' && m.s) this.handlers.onStatus?.(m.s)
    if (m.t === 'err') this.handlers.onError?.()
  }
}

function canWorker(): boolean {
  return typeof Worker !== 'undefined'
}
