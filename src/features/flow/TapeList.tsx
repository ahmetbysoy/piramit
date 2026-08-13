import type { AggTrade } from '../../core/market/aggTrade'
import { formatCompactUsd } from '../../core/format/money'

export function TapeList({ trades }: { trades: AggTrade[] }) {
  return (
    <div className="tape">
      {trades.length === 0 && (
        <div className="bos">
          <span className="spinner" aria-hidden />
          <p>Bağlanıyor…</p>
        </div>
      )}
      {trades.map((t) => (
        <div key={`${t.tradeId}-${t.timeMs}`} className={`tick ${t.side === 'ALIS' ? 'alis' : 'satis'}`}>
          <span className="yon">{t.side === 'ALIS' ? '▲ ALIŞ' : '▼ SATIŞ'}</span>
          <span className="px">{t.priceStr}</span>
          <span className="nt">{formatCompactUsd(t.notional)}</span>
        </div>
      ))}
    </div>
  )
}
