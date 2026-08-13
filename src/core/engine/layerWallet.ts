/** Tek sorumluluk: bir katmanın alış/satış sayacı. */

export type LayerWallet = {
  buyNotional: number
  sellNotional: number
  buyCount: number
  sellCount: number
}

export function emptyWallet(): LayerWallet {
  return { buyNotional: 0, sellNotional: 0, buyCount: 0, sellCount: 0 }
}

export function addToWallet(w: LayerWallet, side: 'ALIS' | 'SATIS', notional: number): void {
  if (side === 'ALIS') {
    w.buyNotional += notional
    w.buyCount += 1
  } else {
    w.sellNotional += notional
    w.sellCount += 1
  }
}

export function netDelta(w: LayerWallet): number {
  return w.buyNotional - w.sellNotional
}

export function totalNotional(w: LayerWallet): number {
  return w.buyNotional + w.sellNotional
}

export function totalCount(w: LayerWallet): number {
  return w.buyCount + w.sellCount
}
