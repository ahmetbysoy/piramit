/** Tek sorumluluk: miniTicker satırı. */

export type MiniRow = {
  symbol: string
  last: string
  changePct: number
  quoteVol: number
}

export function parseMiniTickerArr(raw: string): MiniRow[] {
  let msg: unknown
  try {
    msg = JSON.parse(raw)
  } catch {
    return []
  }
  const rec = msg as { data?: unknown; e?: string }
  const arr = Array.isArray(rec.data) ? rec.data : Array.isArray(msg) ? msg : null
  if (!arr) return []
  const out: MiniRow[] = []
  for (const x of arr) {
    if (!x || typeof x !== 'object') continue
    const t = x as { s?: string; c?: string; P?: string; o?: string; q?: string }
    if (!t.s || !t.c) continue
    let pct = Number(t.P)
    if (!Number.isFinite(pct) && t.o) {
      const o = Number(t.o)
      const c = Number(t.c)
      pct = o ? ((c - o) / o) * 100 : 0
    }
    out.push({
      symbol: t.s,
      last: t.c,
      changePct: Number.isFinite(pct) ? pct : 0,
      quoteVol: Number(t.q) || 0,
    })
  }
  return out
}
