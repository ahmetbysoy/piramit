/** Tek sorumluluk: snapshot’tan alarm tetikle, spam yok. */

import type { PyramidSnapshot } from '../../core/engine/pyramidEngine'
import { pingAlert } from '../../core/alert/localAlert'
import { formatCompactUsd } from '../../core/format/money'

export function watchAlerts(prev: PyramidSnapshot | null, next: PyramidSnapshot): void {
  const kraken = next.layers[6]
  if (kraken && kraken.buyNotional + kraken.sellNotional > 0) {
    const was = prev?.layers[6]
    const wasVol = was ? was.buyNotional + was.sellNotional : 0
    const nowVol = kraken.buyNotional + kraken.sellNotional
    if (nowVol > wasVol * 1.25 + 1) {
      const yon = kraken.net >= 0 ? 'ALIŞ' : 'SATIŞ'
      pingAlert(`${next.symbol} Kraken`, `${yon} ${formatCompactUsd(Math.abs(kraken.net))}`)
    }
  }
  if (next.burst && (!prev?.burst || prev.burst.lastMs !== next.burst.lastMs)) {
    pingAlert(
      `${next.symbol} salvo`,
      `${next.burst.count} vuruş ≈ ${formatCompactUsd(next.burst.merged)}`,
    )
  }
  if (next.lastLiq && next.lastLiq.timeMs !== prev?.lastLiq?.timeMs) {
    pingAlert(
      `${next.symbol} likidasyon`,
      `${next.lastLiq.side} ${formatCompactUsd(next.lastLiq.notional)}`,
    )
  }
}
