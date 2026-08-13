/** Tek sorumluluk: katman eşik aralığı yazısı. */

import { formatCompactUsd } from './money'

export function formatEdgeRange(lo: number, hi: number): string {
  const a = formatCompactUsd(Math.max(0, lo))
  if (!Number.isFinite(hi)) return `${a}+ USDT`
  return `${a}–${formatCompactUsd(hi)} USDT`
}
