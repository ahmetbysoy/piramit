/** Tek sorumluluk: Telegram Mini App köprüsü. */

type Tg = {
  ready: () => void
  expand: () => void
  viewportStableHeight?: number
  themeParams?: Record<string, string>
  onEvent?: (e: string, cb: () => void) => void
  HapticFeedback?: { impactOccurred: (s: string) => void }
}

function api(): Tg | null {
  const w = window as unknown as { Telegram?: { WebApp?: Tg } }
  return w.Telegram?.WebApp ?? null
}

export function bootTelegram(): void {
  const tg = api()
  if (!tg) return
  tg.ready()
  tg.expand()
  applyTheme(tg.themeParams)
  applyViewport(tg.viewportStableHeight)
  tg.onEvent?.('themeChanged', () => applyTheme(api()?.themeParams))
  tg.onEvent?.('viewportChanged', () => applyViewport(api()?.viewportStableHeight))
}

export function applyTheme(t?: Record<string, string>): void {
  if (!t) return
  const map: Record<string, string> = {
    bg_color: '--bg',
    text_color: '--txt',
    hint_color: '--dim',
    secondary_bg_color: '--card',
    section_separator_color: '--line',
    link_color: '--accent',
  }
  for (const [k, cssVar] of Object.entries(map)) {
    if (t[k]) document.documentElement.style.setProperty(cssVar, t[k])
  }
}

function applyViewport(h?: number): void {
  if (!h) return
  document.documentElement.style.setProperty('--tg-vh', `${h}px`)
}

export function haptic(): void {
  try {
    api()?.HapticFeedback?.impactOccurred('light')
  } catch {
    /* tarayıcı */
  }
}
