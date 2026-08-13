import { loadFavs } from '../../core/store/favorites'

export function FavChips({
  current,
  onPick,
  tick,
}: {
  current: string
  onPick: (s: string) => void
  tick: number
}) {
  const favs = tick >= 0 ? loadFavs() : []
  if (!favs.length) return null
  return (
    <div className="favs" data-testid="fav-chips">
      {favs.map((s) => (
        <button
          key={s}
          type="button"
          className={s === current ? 'on' : ''}
          onClick={() => onPick(s)}
        >
          {s.replace(/USDT$/, '')}
        </button>
      ))}
    </div>
  )
}
