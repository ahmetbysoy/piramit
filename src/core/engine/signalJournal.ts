/** Tek sorumluluk: sinyal anı + sonraki fiyat. Pozisyon yok. */

export type JournalRow = {
  id: string
  at: number
  symbol: string
  kind: 'toplama' | 'bosaltma'
  price: number
  later5: number | null
  later15: number | null
  later60: number | null
}

const KEY = 'piramit-journal-v1'
const MAX = 80

export class SignalJournal {
  private rows: JournalRow[] = []

  load(): void {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) this.rows = JSON.parse(raw) as JournalRow[]
    } catch {
      this.rows = []
    }
  }

  list(): JournalRow[] {
    return this.rows
  }

  push(row: Omit<JournalRow, 'id' | 'later5' | 'later15' | 'later60'>): void {
    const last = this.rows[0]
    if (last && last.symbol === row.symbol && last.kind === row.kind && row.at - last.at < 60_000) {
      return
    }
    this.rows.unshift({
      ...row,
      id: `${row.at}-${row.symbol}`,
      later5: null,
      later15: null,
      later60: null,
    })
    if (this.rows.length > MAX) this.rows.length = MAX
    this.persist()
  }

  markPrice(now: number, price: number): void {
    let dirty = false
    for (const r of this.rows) {
      if (r.later5 == null && now - r.at >= 5 * 60_000) {
        r.later5 = price
        dirty = true
      }
      if (r.later15 == null && now - r.at >= 15 * 60_000) {
        r.later15 = price
        dirty = true
      }
      if (r.later60 == null && now - r.at >= 60 * 60_000) {
        r.later60 = price
        dirty = true
      }
    }
    if (dirty) this.persist()
  }

  hitRate(): { n: number; ok: number } {
    let n = 0
    let ok = 0
    for (const r of this.rows) {
      if (r.later15 == null) continue
      n += 1
      const up = r.later15 >= r.price
      if (r.kind === 'toplama' && up) ok += 1
      if (r.kind === 'bosaltma' && !up) ok += 1
    }
    return { n, ok }
  }

  private persist(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.rows))
    } catch {
      /* dolu depo */
    }
  }
}
