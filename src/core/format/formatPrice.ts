/** Tek sorumluluk: tickSize'a göre fiyatı kırpmadan yaz. */

export function decimalsFromTickSize(tickSize: string): number {
  const t = tickSize.trim()
  const dot = t.indexOf('.')
  if (dot < 0) return 0
  return t.length - dot - 1
}

/** Ham borsa string'ini tick hanesine tamamlar, kırpmaz (kısa ise pad). */
export function formatPrice(priceStr: string, tickSize = '0.01'): string {
  if (!priceStr) return '—'
  const dec = decimalsFromTickSize(tickSize)
  const [rawInt, rawFrac = ''] = priceStr.split('.')
  if (dec === 0) return rawInt
  const frac = rawFrac.length >= dec ? rawFrac.slice(0, dec) : rawFrac.padEnd(dec, '0')
  return `${rawInt}.${frac}`
}
