/** Tek sorumluluk: aggTrade ham JSON → yönü netleşmiş trade. */

export type Side = 'ALIS' | 'SATIS'

export type AggTrade = {
  symbol: string
  tradeId: number
  priceStr: string
  qtyStr: string
  price: number
  qty: number
  notional: number
  side: Side
  timeMs: number
}

type RawAgg = {
  e?: string
  s?: string
  a?: number
  p?: string
  q?: string
  nq?: string
  T?: number
  m?: boolean
}

/**
 * Binance `m` = "alıcı maker mı?"
 * m === false → alıcı taker → ALIŞ
 * m === true  → satıcı taker → SATIŞ
 */
export function sideFromMakerFlag(buyerIsMaker: boolean): Side {
  return buyerIsMaker ? 'SATIS' : 'ALIS'
}

export function parseAggTradePayload(raw: string): AggTrade | null {
  let msg: unknown
  try {
    msg = JSON.parse(raw)
  } catch {
    return null
  }
  if (!msg || typeof msg !== 'object') return null
  const rec = msg as { data?: RawAgg; e?: string }
  const d: RawAgg = rec.data && typeof rec.data === 'object' ? rec.data : (rec as RawAgg)
  return aggTradeFromObj(d)
}

export function aggTradeFromObj(d: RawAgg | Record<string, unknown>): AggTrade | null {
  if (d.e !== 'aggTrade') return null
  if (typeof d.p !== 'string' || typeof d.q !== 'string') return null
  if (typeof d.m !== 'boolean' || typeof d.s !== 'string') return null

  const price = Number(d.p)
  const qtyRaw = typeof d.nq === 'string' && d.nq.length ? d.nq : d.q
  const qty = Number(qtyRaw)
  if (!Number.isFinite(price) || !Number.isFinite(qty)) return null

  return {
    symbol: d.s,
    tradeId: typeof d.a === 'number' ? d.a : 0,
    priceStr: d.p,
    qtyStr: qtyRaw,
    price,
    qty,
    notional: price * qty,
    side: sideFromMakerFlag(d.m),
    timeMs: typeof d.T === 'number' ? d.T : Date.now(),
  }
}
