/** Tek sorumluluk: Telegram Mini App köprüsü. */

type Tg = {
  ready: () => void
  expand: () => void
  close?: () => void
  disableVerticalSwipes?: () => void
  viewportStableHeight?: number
  themeParams?: Record<string, string>
  initDataUnsafe?: { start_param?: string }
  onEvent?: (e: string, cb: () => void) => void
  BackButton?: {
    show: () => void
    hide: () => void
    onClick: (cb: () => void) => void
    offClick?: (cb: () => void) => void
  }
  MainButton?: {
    setText: (t: string) => void
    show: () => void
    hide: () => void
    onClick: (cb: () => void) => void
    offClick?: (cb: () => void) => void
  }
  openTelegramLink?: (url: string) => void
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
  tg.disableVerticalSwipes?.()
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

export function telegramStartSymbol(): string | null {
  const p = api()?.initDataUnsafe?.start_param
  return p ? p : null
}

export function bindBackButton(onBack: () => boolean): () => void {
  const bb = api()?.BackButton
  if (!bb) return () => undefined
  const handler = () => {
    const stayed = onBack()
    if (!stayed) api()?.close?.()
  }
  bb.onClick(handler)
  bb.show()
  return () => {
    bb.offClick?.(handler)
    bb.hide()
  }
}

export function bindMainButton(text: string, onClick: () => void): () => void {
  const mb = api()?.MainButton
  if (!mb) return () => undefined
  mb.setText(text)
  mb.onClick(onClick)
  mb.show()
  return () => {
    mb.offClick?.(onClick)
    mb.hide()
  }
}

export function shareTelegram(text: string): void {
  const url = `https://t.me/share/url?url=${encodeURIComponent('https://piramit.vercel.app')}&text=${encodeURIComponent(text)}`
  const tg = api()
  if (tg?.openTelegramLink) tg.openTelegramLink(url)
  else window.open(url, '_blank', 'noopener,noreferrer')
}

export function haptic(): void {
  try {
    api()?.HapticFeedback?.impactOccurred('light')
  } catch {
    /* tarayıcı */
  }
}
