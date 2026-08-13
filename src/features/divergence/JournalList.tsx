import { formatCompactUsd } from '../../core/format/money'

type Row = {
  id: string
  kind: string
  symbol: string
  price: number
  at: number
  later15: number | null
}

export function JournalList({ rows }: { rows: Row[] }) {
  if (!rows.length) {
    return <p className="dim">Henüz kayıt yok. Toplama/boşaltma basınca buraya düşer.</p>
  }
  return (
    <div className="journal">
      {rows.map((r) => {
        const later = r.later15
        const up = later != null && later >= r.price
        const hit =
          later == null
            ? 'bekliyor'
            : (r.kind === 'toplama' && up) || (r.kind === 'bosaltma' && !up)
              ? 'tuttu'
              : 'tutmadı'
        return (
          <div key={r.id} className="journal-row">
            <b className={r.kind === 'toplama' ? 'alis' : 'satis'}>
              {r.kind === 'toplama' ? 'toplama' : 'boşaltma'}
            </b>
            <span>{r.symbol.replace('USDT', '')}</span>
            <span>{formatCompactUsd(r.price)}</span>
            <span className={hit === 'tuttu' ? 'alis' : hit === 'tutmadı' ? 'satis' : 'dim'}>
              {hit}
            </span>
          </div>
        )
      })}
    </div>
  )
}
