/** Tek sorumluluk: exchangeInfo → tickSize haritası. */

import { EXCHANGE_INFO_URL } from '../ws/endpoints'

export type SymbolMeta = {
  symbol: string
  tickSize: string
  stepSize: string
}

export class PrecisionRegistry {
  private map = new Map<string, SymbolMeta>()
  loaded = false
  error: string | null = null

  get(symbol: string): SymbolMeta | undefined {
    return this.map.get(symbol)
  }

  async load(): Promise<void> {
    try {
      const res = await fetch(EXCHANGE_INFO_URL)
      if (!res.ok) throw new Error(`exchangeInfo ${res.status}`)
      const json = (await res.json()) as {
        symbols?: Array<{
          symbol: string
          filters?: Array<{ filterType: string; tickSize?: string; stepSize?: string }>
        }>
      }
      for (const s of json.symbols ?? []) {
        const pf = s.filters?.find((f) => f.filterType === 'PRICE_FILTER')
        const lf = s.filters?.find((f) => f.filterType === 'LOT_SIZE')
        this.map.set(s.symbol, {
          symbol: s.symbol,
          tickSize: pf?.tickSize ?? '0.01',
          stepSize: lf?.stepSize ?? '0.001',
        })
      }
      this.loaded = true
      this.error = null
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'exchangeInfo alınamadı'
    }
  }
}
