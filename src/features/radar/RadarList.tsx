import type { MiniRow } from '../../core/market/miniTicker'

export function RadarList({
  rows,
  onPick,
}: {
  rows: MiniRow[]
  onPick: (s: string) => void
}) {
  if (!rows.length) {
    return <div className="bos">Radar ısınıyor — vadeli hareketler gelecek.</div>
  }
  return (
    <div className="radar">
      {rows.map((r) => (
        <button key={r.symbol} className="radar-row" type="button" onClick={() => onPick(r.symbol)}>
          <b>{r.symbol.replace('USDT', '')}</b>
          <span className="px">{r.last}</span>
          <span className={r.changePct >= 0 ? 'alis' : 'satis'}>
            {r.changePct >= 0 ? '+' : ''}
            {r.changePct.toFixed(2)}%
          </span>
        </button>
      ))}
    </div>
  )
}
