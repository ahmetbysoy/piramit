import { useState } from 'react'
import type { LayerView } from '../../core/engine/pyramidEngine'
import { SIGNAL } from '../../core/engine/signalConfig'
import { formatCompactUsd } from '../../core/format/money'
import { netWord } from '../../ui/moneyTone'

type Props = {
  layers: LayerView[]
  pulse: number
}

export function PyramidCanvas({ layers, pulse }: Props) {
  const [tip, setTip] = useState<string | null>(null)
  const rev = [...layers].reverse()
  const maxShare = Math.max(...rev.map((l) => l.share), 0.0001)
  const vols = layers.map((l) => l.buyNotional + l.sellNotional).filter((n) => n > 0)
  const minN = vols.length ? Math.min(...vols) : 0
  const maxN = vols.length ? Math.max(...vols) : 0

  return (
    <div className="py-wrap">
      <div className="py-stack" data-testid="pyramid">
        {rev.map((l, i) => {
          const t = i / Math.max(rev.length - 1, 1)
          const taper = 0.42 + t * 0.58
          const mute = l.share === 0
          const pct = mute ? 10 + t * 4 : Math.max(18, (l.share / maxShare) * 100 * taper)
          const net = netWord(l.net)
          const mark = mute || net === 'DÜZ' ? '·' : net === 'ALIŞ' ? '▲' : '▼'
          const buyR =
            l.buyNotional + l.sellNotional > 0
              ? l.buyNotional / (l.buyNotional + l.sellNotional)
              : 0.5
          const tone = mute ? 'duz' : net === 'ALIŞ' ? 'alis' : net === 'SATIŞ' ? 'satis' : 'duz'
          const glow = !mute && l.id >= SIGNAL.glowFromLayer
          return (
            <button
              type="button"
              key={l.id}
              className={`py-row ${tone}${glow ? ' glow-row' : ''}`}
              style={{ ['--bar' as string]: `${pct}%`, ['--buy' as string]: `${buyR * 100}%` }}
              onClick={() =>
                setTip(
                  tip === l.name
                    ? null
                    : `${l.name} · ▲ ${formatCompactUsd(l.buyNotional)} · ▼ ${formatCompactUsd(l.sellNotional)}`,
                )
              }
            >
              <span className="py-name">
                {mark} {l.name}
              </span>
              <span className="py-track" aria-hidden>
                <span className={`py-bar ${mute ? 'bos-bar' : ''}`} data-pulse={glow ? pulse % 3 : 0} />
              </span>
              <span className={`py-net ${tone}`}>
                {mute || net === 'DÜZ' ? 'düz' : net} {formatCompactUsd(Math.abs(l.net))}
              </span>
            </button>
          )
        })}
      </div>
      {tip && <div className="py-tip py-tip-static">{tip}</div>}
      <div className="axis-labels">
        <span>hacim aralığı: küçük {formatCompactUsd(minN || 0)}</span>
        <span>büyük {formatCompactUsd(maxN)}</span>
      </div>
    </div>
  )
}
