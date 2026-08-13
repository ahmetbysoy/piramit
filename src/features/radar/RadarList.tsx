import { useMemo, useState } from 'react'
import type { MiniRow } from '../../core/market/miniTicker'
import { formatCompactUsd } from '../../core/format/money'

type Sort = 'pct' | 'vol'

export function RadarList({
  rows,
  onPick,
}: {
  rows: MiniRow[]
  onPick: (s: string) => void
}) {
  const [sort, setSort] = useState<Sort>('pct')
  const list = useMemo(() => {
    const copy = [...rows]
    if (sort === 'vol') copy.sort((a, b) => b.quoteVol - a.quoteVol)
    else copy.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    return copy
  }, [rows, sort])

  if (!rows.length) {
    return <div className="bos">Radar ısınıyor — vadeli hareketler gelecek.</div>
  }
  return (
    <div>
      <div className="wins">
        <button className={sort === 'pct' ? 'on' : ''} onClick={() => setSort('pct')}>
          % değişim
        </button>
        <button className={sort === 'vol' ? 'on' : ''} onClick={() => setSort('vol')}>
          Hacim
        </button>
      </div>
      <div className="radar">
        {list.map((r) => (
          <button key={r.symbol} className="radar-row" type="button" onClick={() => onPick(r.symbol)}>
            <b>{r.symbol.replace('USDT', '')}</b>
            <span className="px">{formatCompactUsd(r.quoteVol)}</span>
            <span className={r.changePct >= 0 ? 'alis' : 'satis'}>
              {r.changePct >= 0 ? '+' : ''}
              {r.changePct.toFixed(2)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
