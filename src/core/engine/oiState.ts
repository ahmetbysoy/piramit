/** Tek sorumluluk: OI var mı, yok mu, eski mi — yalan yok. */

export type OiState = 'bekliyor' | 'ok' | 'yok' | 'eski'

export function oiMeta(state: OiState, oi: number | null, delta: number | null, fmt: (n: number) => string): string {
  if (state === 'bekliyor') return 'OI bekleniyor'
  if (state === 'yok') return 'OI yok (CORS) — sadece alış/satış'
  if (oi == null) return 'OI yok (CORS) — sadece alış/satış'
  const arrow = delta == null ? '' : delta >= 0 ? ' ↑' : ' ↓'
  if (state === 'eski') return `OI ${fmt(oi)}${arrow} (eski)`
  return `OI ${fmt(oi)}${arrow}`
}
