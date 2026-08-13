/** Tek sorumluluk: forceOrder ham JSON → likidasyon. */

export type Liq = {
  symbol: string
  side: 'ALIS' | 'SATIS'
  priceStr: string
  qty: number
  notional: number
  timeMs: number
}

type Raw = {
  e?: string
  o?: {
    s?: string
    S?: string
    p?: string
    q?: string
    ap?: string
    T?: number
  }
}

export function parseForceOrder(raw: string): Liq | null {
  let msg: unknown
  try {
    msg = JSON.parse(raw)
  } catch {
    return null
  }
  if (!msg || typeof msg !== 'object') return null
  const rec = msg as { data?: Raw; e?: string; o?: Raw['o'] }
  const d: Raw = rec.data && typeof rec.data === 'object' ? rec.data : (rec as Raw)
  if (d.e !== 'forceOrder' || !d.o) return null
  const o = d.o
  if (!o.s || !o.p || !o.q) return null
  const price = Number(o.ap || o.p)
  const qty = Number(o.q)
  if (!Number.isFinite(price) || !Number.isFinite(qty)) return null
  const sellSide = o.S === 'SELL'
  return {
    symbol: o.s,
    side: sellSide ? 'SATIS' : 'ALIS',
    priceStr: o.ap || o.p,
    qty,
    notional: price * qty,
    timeMs: typeof o.T === 'number' ? o.T : Date.now(),
  }
}
