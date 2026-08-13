/** Tek sorumluluk: son N trade, GC'siz kaydırma. */

import type { AggTrade } from '../market/aggTrade'

export class TapeBuffer {
  private readonly buf: (AggTrade | null)[]
  private head = 0
  private size = 0

  private readonly cap: number

  constructor(cap = 80) {
    this.cap = cap
    this.buf = Array.from({ length: cap }, () => null)
  }

  clear(): void {
    this.head = 0
    this.size = 0
    this.buf.fill(null)
  }

  push(t: AggTrade): void {
    this.buf[this.head] = t
    this.head = (this.head + 1) % this.cap
    if (this.size < this.cap) this.size += 1
  }

  newestFirst(): AggTrade[] {
    const out: AggTrade[] = []
    for (let i = 0; i < this.size; i++) {
      const idx = (this.head - 1 - i + this.cap) % this.cap
      const t = this.buf[idx]
      if (t) out.push(t)
    }
    return out
  }
}
