/** Tek sorumluluk: favori sembol listesi. */

const KEY = 'piramit-fav-v1'

export function loadFavs(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function toggleFav(symbol: string): string[] {
  const s = symbol.toUpperCase()
  const cur = loadFavs()
  const next = cur.includes(s) ? cur.filter((x) => x !== s) : [s, ...cur].slice(0, 20)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* */
  }
  return next
}
