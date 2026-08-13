import type { LayerView } from '../../core/engine/pyramidEngine'
import { formatCompactUsd } from '../../core/format/money'
import { netWord } from '../../ui/moneyTone'

export function PyramidBars({ layers }: { layers: LayerView[] }) {
  const maxShare = Math.max(...layers.map((l) => l.share), 0.08)

  return (
    <div className="pyramid">
      {[...layers].reverse().map((l) => {
        const width = 18 + (l.share / maxShare) * 82
        const net = netWord(l.net)
        const tone = net === 'ALIŞ' ? 'alis' : net === 'SATIŞ' ? 'satis' : 'duz'
        return (
          <div key={l.id} className="row">
            <div className="row-meta">
              <span className="lname">{l.name}</span>
              <span className={`net ${tone}`}>
                {net} {formatCompactUsd(Math.abs(l.net))}
              </span>
            </div>
            <div className="track">
              <div className={`bar ${tone}`} style={{ width: `${width}%` }}>
                <span className="bar-al">A {formatCompactUsd(l.buyNotional)}</span>
                <span className="bar-sa">S {formatCompactUsd(l.sellNotional)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
