import { useEffect, useMemo, useState } from 'react'
import { useEngine } from '../bridge/useEngine'
import { WINDOW_OPTIONS, type WindowSec } from '../core/engine/pyramidEngine'
import { formatCompactUsd, formatPriceDisplay, windowLabel } from '../core/format/money'
import { FeedController } from '../features/feed/FeedController'
import { PyramidBars } from '../features/pyramid/PyramidBars'
import { TapeList } from '../features/flow/TapeList'
import { netWord } from '../ui/moneyTone'

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT']

type Tab = 'piramit' | 'akis'

export function App() {
  const feed = useMemo(() => new FeedController(), [])
  const snap = useEngine(feed.engine)
  const [tab, setTab] = useState<Tab>('piramit')
  const [status, setStatus] = useState(feed.status)
  const [symbol, setSymbol] = useState(feed.getSymbol())
  const [tapeTick, setTapeTick] = useState(0)

  useEffect(() => {
    feed.onChange(() => {
      setStatus(feed.status)
      setTapeTick((n) => n + 1)
    })
    feed.start(symbol)
    const id = window.setInterval(() => setTapeTick((n) => n + 1), 250)
    return () => {
      window.clearInterval(id)
      feed.stop()
    }
  }, [feed, symbol])

  const windowSec = snap.windowSec
  const setWindow = (w: WindowSec) => feed.engine.setWindow(w)

  const topNet = snap.layers.slice(4).reduce((a, l) => a + l.net, 0)
  const botNet = snap.layers.slice(0, 3).reduce((a, l) => a + l.net, 0)
  const sessTop = snap.sessionLayers.slice(4).reduce((a, l) => a + l.net, 0)

  return (
    <div className="shell">
      <header className="top">
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="sym"
        >
          {SYMBOLS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="px-block">
          <div className="px">{formatPriceDisplay(snap.priceStr)}</div>
          <div className={snap.changePct >= 0 ? 'chg up' : 'chg dn'}>
            {snap.changePct >= 0 ? '+' : ''}
            {snap.changePct.toFixed(2)}%
          </div>
        </div>
        <div className={`bag ${status}`}>{statusLabel(status)}</div>
      </header>
      {feed.lastError && status !== 'acik' && (
        <p className="err">Bağlantı: {feed.lastError}</p>
      )}

      <div className="wins">
        {WINDOW_OPTIONS.map((w) => (
          <button
            key={w}
            className={windowSec === w ? 'on' : ''}
            onClick={() => setWindow(w)}
          >
            {windowLabel(w)}
          </button>
        ))}
        <button
          className={windowSec === 'oturum' ? 'on' : ''}
          onClick={() => setWindow('oturum')}
        >
          AÇILIŞTAN
        </button>
      </div>

      <p className="headline">{buildHeadline(topNet, botNet)}</p>

      <div className="subtabs">
        <button className={tab === 'piramit' ? 'on' : ''} onClick={() => setTab('piramit')}>
          Piramit
        </button>
        <button className={tab === 'akis' ? 'on' : ''} onClick={() => setTab('akis')}>
          Akış
        </button>
      </div>

      <main className="main">
        {tab === 'piramit' ? (
          <PyramidBars layers={snap.layers} />
        ) : (
          <TapeList trades={feed.tape.newestFirst()} key={tapeTick} />
        )}
      </main>

      <section className="foot-card">
        <div>
          <span className="k">Son {windowLabel(windowSec === 'oturum' ? 60 : windowSec)}</span>
          <b className={netWord(topNet) === 'ALIŞ' ? 'alis' : 'satis'}>
            büyükler {netWord(topNet)} {formatCompactUsd(Math.abs(topNet))}
          </b>
        </div>
        <div>
          <span className="k">Açılıştan</span>
          <b className={netWord(sessTop) === 'ALIŞ' ? 'alis' : 'satis'}>
            büyükler {netWord(sessTop)} {formatCompactUsd(Math.abs(sessTop))}
          </b>
        </div>
        <div className="ticks">{snap.tickCount} işlem sayıldı</div>
      </section>

      <nav className="nav">
        <button className={tab === 'piramit' ? 'on' : ''} onClick={() => setTab('piramit')}>
          🔺 Piramit
        </button>
        <button className={tab === 'akis' ? 'on' : ''} onClick={() => setTab('akis')}>
          🌊 Akış
        </button>
        <button disabled>📡 Radar</button>
        <button disabled>⚙️ Ayar</button>
      </nav>

      <p className="disclaimer">Bu tavsiye değil. Sadece borsadan gelen alış-satış sayımı.</p>
    </div>
  )
}

function statusLabel(s: string): string {
  if (s === 'acik') return 'canlı'
  if (s === 'baglaniyor') return 'bağlanıyor'
  if (s === 'yeniden') return 'yeniden'
  return 'kapalı'
}

function buildHeadline(topNet: number, botNet: number): string {
  const buyTop = topNet > 0
  const buyBot = botNet > 0
  if (Math.abs(topNet) < 1 && Math.abs(botNet) < 1) return 'Henüz vuruş yok, bekliyoruz.'
  if (buyTop && !buyBot) return 'Büyükler ALIŞ yazıyor, küçükler SATIŞ — toplama kokusu.'
  if (!buyTop && buyBot) return 'Küçükler kovalıyor, büyükler SATIŞ — boşaltma kokusu.'
  if (buyTop && buyBot) return 'Her katmanda ALIŞ yağıyor.'
  return 'Her katmanda SATIŞ yağıyor.'
}
