/** Tek sorumluluk: sayı → ekran metni. Fiyat string kalır. */

export function formatCompactUsd(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`
  if (abs >= 1) return `${sign}${abs.toFixed(0)}`
  return `${sign}${abs.toFixed(2)}`
}

/** Ekran: her zaman USDT. Adet değil. */
export function formatUsdt(n: number): string {
  return `${formatCompactUsd(n)} USDT`
}

export function formatPriceDisplay(priceStr: string): string {
  if (!priceStr) return '—'
  return priceStr
}

export function windowLabel(w: number | 'oturum'): string {
  if (w === 'oturum') return 'AÇILIŞTAN'
  if (w === 60) return '1dk'
  if (w === 300) return '5dk'
  if (w === 900) return '15dk'
  if (w === 3600) return '1sa'
  return `${w}sn`
}
