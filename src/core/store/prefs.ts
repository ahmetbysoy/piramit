/** Tek sorumluluk: son oturum tercihleri. */

export type Prefs = {
  symbol: string
  window: 60 | 300 | 900 | 3600 | 'oturum'
  edge: 'adaptif' | 'sabit'
}

const KEY = 'piramit-prefs-v1'

const DEFAULT: Prefs = { symbol: 'BTCUSDT', window: 60, edge: 'adaptif' }

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    const o = JSON.parse(raw) as Partial<Prefs>
    const w = o.window
    const windowSafe: Prefs['window'] =
      w === 60 || w === 300 || w === 900 || w === 3600 || w === 'oturum' ? w : DEFAULT.window
    return {
      symbol: typeof o.symbol === 'string' && o.symbol.length >= 5 ? o.symbol.toUpperCase() : DEFAULT.symbol,
      window: windowSafe,
      edge: o.edge === 'sabit' ? 'sabit' : 'adaptif',
    }
  } catch {
    return { ...DEFAULT }
  }
}

export function savePrefs(p: Prefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* */
  }
}
