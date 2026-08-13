/** Tek sorumluluk: Telegram Mini App köprüsü. */

type Tg = {
  ready: () => void
  expand: () => void
  viewportStableHeight?: number
  themeParams?: Record<string, string>
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
  const h = tg.viewportStableHeight
  if (h) document.documentElement.style.setProperty('--tg-vh', `${h}px`)
  const bg = tg.themeParams?.bg_color
  if (bg) document.documentElement.style.setProperty('--bg', bg)
}

export function haptic(): void {
  try {
    api()?.HapticFeedback?.impactOccurred('light')
  } catch {
    /* tarayıcı */
  }
}
