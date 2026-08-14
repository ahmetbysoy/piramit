import { useEffect, useMemo, useRef, useState } from 'react'
import type { PrecisionRegistry, SymbolMeta } from '../../core/format/precision'
import { loadFavs, toggleFav } from '../../core/store/favorites'

type Props = {
  registry: PrecisionRegistry
  value: string
  onPick: (symbol: string) => void
  ready: boolean
}

export function SymbolSearch({ registry, value, onPick, ready }: Props) {
  const [q, setQ] = useState(value)
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const [favs, setFavs] = useState<string[]>(() => (typeof localStorage !== 'undefined' ? loadFavs() : []))
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => setQ(value), [value])

  const hits = useMemo(() => {
    const base = ready ? registry.search(q) : []
    if (q.trim()) return base
    const favRows = favs
      .map((s) => registry.get(s) ?? { symbol: s, base: s.replace(/USDT|USDC$/, ''), tickSize: '0.01', stepSize: '1' })
      .filter((s) => !base.some((b) => b.symbol === s.symbol))
    return [...favRows, ...base].slice(0, 14)
  }, [ready, registry, q, favs])

  useEffect(() => {
    const onDoc = (e: Event) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('touchstart', onDoc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('touchstart', onDoc)
    }
  }, [])

  const pick = (s: string) => {
    onPick(s)
    setQ(s)
    setOpen(false)
  }

  const submit = () => {
    const resolved = registry.resolve(q) ?? hits[hi]?.symbol ?? hits[0]?.symbol
    if (resolved) pick(resolved)
  }

  return (
    <div className="sym-box" ref={box}>
      <input
        className="sym-in"
        data-testid="symbol-input"
        value={q}
        spellCheck={false}
        autoCapitalize="characters"
        autoComplete="off"
        placeholder="Coin yaz — BTC, PEPE…"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
          setHi(0)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHi((i) => Math.min(i + 1, hits.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHi((i) => Math.max(i - 1, 0))
          } else if (e.key === 'Enter') {
            e.preventDefault()
            submit()
          } else if (e.key === 'Escape') setOpen(false)
        }}
      />
      {open && (
        <ul className="sym-list">
          {!ready && hits.length === 0 && <li className="dim">Futures listesi geliyor…</li>}
          {ready && hits.length === 0 && <li className="dim">Yok öyle coin.</li>}
          {hits.map((s, i) => {
            const starred = favs.includes(s.symbol)
            return (
              <li key={s.symbol} className="sym-row">
                <button
                  type="button"
                  className={i === hi ? 'hi' : ''}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => pick(s.symbol)}
                >
                  <b>{pretty(s)}</b>
                  <span>{s.symbol}</span>
                </button>
                <button
                  type="button"
                  className="star"
                  aria-label="favori"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFavs(toggleFav(s.symbol))
                  }}
                >
                  {starred ? '★' : '☆'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function pretty(s: SymbolMeta): string {
  if (s.symbol.endsWith('USDT')) return s.base
  return s.symbol
}
