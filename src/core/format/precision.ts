/** Tek sorumluluk: exchangeInfo → tickSize + açık futures listesi. */

import { EXCHANGE_INFO_URLS } from '../ws/endpoints'
import { SEED_SYMBOLS } from './seedSymbols'

export type SymbolMeta = {
  symbol: string
  base: string
  tickSize: string
  stepSize: string
}

export class PrecisionRegistry {
  private map = new Map<string, SymbolMeta>()
  private list: SymbolMeta[] = []
  loaded = false
  error: string | null = null

  constructor() {
    this.applySeed()
  }

  get(symbol: string): SymbolMeta | undefined {
    return this.map.get(symbol.toUpperCase())
  }

  symbols(): SymbolMeta[] {
    return this.list
  }

  resolve(query: string): string | null {
    const q = query.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!q) return null
    if (this.map.has(q)) return q
    if (this.map.has(`${q}USDT`)) return `${q}USDT`
    if (this.map.has(`${q}USDC`)) return `${q}USDC`
    const hit = this.list.find((s) => s.symbol.startsWith(q) || s.base === q)
    if (hit) return hit.symbol
    if (q.endsWith('USDT') || q.endsWith('USDC')) return q
    return `${q}USDT`
  }

  search(query: string, limit = 14): SymbolMeta[] {
    const q = query.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!q) {
      return this.list.filter((s) => /^(BTC|ETH|SOL|BNB|XRP|DOGE|PEPE)/.test(s.symbol)).slice(0, limit)
    }
    const scored = this.list
      .map((s) => ({ s, n: rank(s, q) }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
    return scored.slice(0, limit).map((x) => x.s)
  }

  async load(): Promise<void> {
    let lastErr = 'exchangeInfo alınamadı'
    for (const url of EXCHANGE_INFO_URLS) {
      try {
        const res = await fetch(url)
        if (!res.ok) {
          lastErr = `exchangeInfo ${res.status}`
          continue
        }
        this.ingest(await res.json())
        this.loaded = true
        this.error = null
        return
      } catch (e) {
        lastErr = e instanceof Error ? e.message : lastErr
      }
    }
    this.error = lastErr
    this.loaded = true
  }

  private applySeed(): void {
    this.map.clear()
    this.list = []
    for (const s of SEED_SYMBOLS) {
      this.map.set(s.symbol, s)
      this.list.push(s)
    }
    this.loaded = true
  }

  private ingest(json: {
    symbols?: Array<{
      symbol: string
      status?: string
      contractType?: string
      baseAsset?: string
      quoteAsset?: string
      filters?: Array<{ filterType: string; tickSize?: string; stepSize?: string }>
    }>
  }): void {
    this.map.clear()
    this.list = []
    for (const s of json.symbols ?? []) {
      if (s.status !== 'TRADING') continue
      if (s.contractType && s.contractType !== 'PERPETUAL') continue
      if (s.quoteAsset && s.quoteAsset !== 'USDT' && s.quoteAsset !== 'USDC') continue
      const pf = s.filters?.find((f) => f.filterType === 'PRICE_FILTER')
      const lf = s.filters?.find((f) => f.filterType === 'LOT_SIZE')
      const meta: SymbolMeta = {
        symbol: s.symbol,
        base: s.baseAsset ?? s.symbol.replace(/USDT|USDC$/, ''),
        tickSize: pf?.tickSize ?? '0.01',
        stepSize: lf?.stepSize ?? '0.001',
      }
      this.map.set(s.symbol, meta)
      this.list.push(meta)
    }
    this.list.sort((a, b) => a.symbol.localeCompare(b.symbol))
  }
}

function rank(s: SymbolMeta, q: string): number {
  if (s.symbol === q || s.base === q) return 100
  if (s.symbol.startsWith(q)) return 80
  if (s.base.startsWith(q)) return 70
  if (s.symbol.includes(q)) return 40
  return 0
}
