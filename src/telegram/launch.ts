/** Tek sorumluluk: start_param / URL → sembol. */

export function normalizeLaunchSymbol(raw: string): string | null {
  const u = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (u.length < 2) return null
  if (u.endsWith('USDT') || u.endsWith('USDC')) return u
  return `${u}USDT`
}

export function writeSymbolHash(symbol: string): void {
  if (typeof window === 'undefined') return
  const next = `#${symbol}`
  if (window.location.hash === next) return
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${next}`)
}

export function symbolFromLocation(search: string, hash: string): string | null {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('s')
  if (q) return normalizeLaunchSymbol(q)
  const h = hash.replace(/^#/, '')
  if (h) return normalizeLaunchSymbol(h)
  return null
}
