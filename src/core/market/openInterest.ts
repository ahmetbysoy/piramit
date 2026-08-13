/** Tek sorumluluk: OI REST parse. */

export type OiSnap = {
  symbol: string
  oi: number
  at: number
}

export function parseOpenInterest(json: unknown, at = Date.now()): OiSnap | null {
  if (!json || typeof json !== 'object') return null
  const o = json as { symbol?: string; openInterest?: string }
  if (!o.symbol || typeof o.openInterest !== 'string') return null
  const oi = Number(o.openInterest)
  if (!Number.isFinite(oi)) return null
  return { symbol: o.symbol, oi, at }
}

export function oiDelta(prev: OiSnap | null, next: OiSnap): number | null {
  if (!prev || prev.symbol !== next.symbol) return null
  return next.oi - prev.oi
}

export const OI_URL = 'https://fapi.binance.com/fapi/v1/openInterest'
