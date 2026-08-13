import type { AggTrade } from '../../core/market/aggTrade'
import { formatUsdt } from '../../core/format/money'

const MAX_VISIBLE = 50

export function TapeList({ trades }: { trades: AggTrade[] }) {
  const sliced = trades.slice(0, MAX_VISIBLE)
  return (
    <div className="tape">
      {sliced.length === 0 && (
        <div className="bos">
          <span className="spinner" aria-hidden />
          <p>Bağlanıyor…</p>
        </div>
      )}
      {sliced.map((t) => (
        <div key={`${t.tradeId}-${t.timeMs}`} className={`tick ${t.side === 'ALIS' ? 'alis' : 'satis'}`}>
          <span className="yon">{t.side === 'ALIS' ? '▲ ALIŞ' : '▼ SATIŞ'}</span>
          <span className="px">{t.priceStr}</span>
          <span className="nt">{formatUsdt(t.notional)}</span>
        </div>
      ))}
    </div>
  )
}
