/** Tek sorumluluk: tarayıcı / Telegram yerel uyarı. Backend yok. */

import { haptic } from '../../telegram/webApp'

const KEY = 'piramit-alert-on'

export function alertsEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function setAlertsEnabled(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? '1' : '0')
  } catch {
    /* */
  }
}

export async function askAlertPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') {
    setAlertsEnabled(true)
    return true
  }
  if (Notification.permission === 'granted') {
    setAlertsEnabled(true)
    return true
  }
  const p = await Notification.requestPermission()
  const ok = p === 'granted'
  setAlertsEnabled(ok)
  return ok
}

export function pingAlert(title: string, body: string): void {
  if (!alertsEnabled()) return
  haptic()
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body, silent: false })
    }
  } catch {
    /* iframe / telegram */
  }
}
