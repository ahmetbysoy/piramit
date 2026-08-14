/** Tek sorumluluk: oturum metni — IDB yok, otomatik yazılmaz. */

import type { PyramidSnapshot } from '../engine/pyramidEngine'
import { formatUsdt } from './money'
import { formatPrice } from './formatPrice'

function yon(n: number): string {
  if (n > 0) return 'ALIŞ'
  if (n < 0) return 'SATIŞ'
  return 'DÜZ'
}

export function sessionShotText(s: PyramidSnapshot): string {
  const lines = [
    `${s.symbol}  ${formatPrice(s.priceStr)}  ${s.changePct.toFixed(2)}%`,
    s.clashYazi || s.divYazi || s.shapeYazi,
    `pencere=${s.windowSec}  işlem=${s.tickCount}  eşik=${s.edgeMode}`,
    '',
    ...s.layers.map(
      (l) =>
        `${l.name}\t${yon(l.net)}\t${formatUsdt(Math.abs(l.net))}\t▲${formatUsdt(l.buyNotional)}\t▼${formatUsdt(l.sellNotional)}`,
    ),
  ]
  return lines.join('\n')
}

export function downloadSessionShot(s: PyramidSnapshot): void {
  const blob = new Blob([sessionShotText(s)], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `piramit-${s.symbol}-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(a.href)
}
