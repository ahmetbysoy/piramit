import { useEffect, useMemo, useRef, useState } from 'react'
import { useEngine } from '../bridge/useEngine'
import { WINDOW_OPTIONS, type WindowSec } from '../core/engine/pyramidEngine'
import { formatCompactUsd, windowLabel } from '../core/format/money'
import { formatPrice } from '../core/format/formatPrice'
import { FeedController } from '../features/feed/FeedController'
import { PyramidCanvas } from '../features/pyramid/PyramidCanvas'
import { TapeList } from '../features/flow/TapeList'
import { SymbolSearch } from '../features/settings/SymbolSearch'
import { RadarList } from '../features/radar/RadarList'
import { JournalList } from '../features/divergence/JournalList'
import { netWord } from '../ui/moneyTone'
import { haptic } from '../telegram/webApp'
import { watchAlerts } from '../features/alert/watchAlerts'
import { alertsEnabled, askAlertPermission, setAlertsEnabled } from '../core/alert/localAlert'

type Tab = 'piramit' | 'akis' | 'radar' | 'ayar'

export function App() {
  const feed = useMemo(() => new FeedController(), [])
  const snap = useEngine(feed.engine)
  const [tab, setTab] = useState<Tab>('piramit')
  const [status, setStatus] = useState(feed.status)
  const [symbol, setSymbol] = useState(feed.getSymbol())
  const [tapeTick, setTapeTick] = useState(0)
  const [listReady, setListReady] = useState(feed.precision.loaded)
  const [radarTick, setRadarTick] = useState(0)
  const [alertOn, setAlertOn] = useState(false)
  const prevSnap = useRef(snap)

  useEffect(() => {
    feed.onChange(() => {
      setStatus(feed.status)
      setTapeTick((n) => n + 1)
      setListReady(feed.precision.loaded)
      setRadarTick((n) => n + 1)
    })
    feed.start(symbol)
    const id = window.setInterval(() => setTapeTick((n) => n + 1), 250)
    return () => {
      window.clearInterval(id)
      feed.stop()
    }
  }, [feed, symbol])

  useEffect(() => {
    feed.setRadar(tab === 'radar')
  }, [feed, tab])

  useEffect(() => {
    setAlertOn(alertsEnabled())
  }, [])

  useEffect(() => {
    watchAlerts(prevSnap.current, snap)
    prevSnap.current = snap
  }, [snap])

  const windowSec = snap.windowSec
  const setWindow = (w: WindowSec) => {
    haptic()
    feed.engine.setWindow(w)
  }
  const tick = feed.precision.get(symbol)?.tickSize ?? '0.01'
  const priceTxt = formatPrice(snap.priceStr, tick)

  const topNet = snap.layers.slice(4).reduce((a, l) => a + l.net, 0)
  const sessTop = snap.sessionLayers.slice(4).reduce((a, l) => a + l.net, 0)
  const headline = snap.divYazi || snap.shapeYazi

  return (
    <div className="shell">
      <div className="glow" aria-hidden />
      <header className="top">
        <SymbolSearch
          registry={feed.precision}
          value={symbol}
          ready={listReady}
          onPick={(s) => {
            haptic()
            setSymbol(s)
          }}
        />
        <div className="px-block">
          <div className="px">{priceTxt}</div>
          <div className={snap.changePct >= 0 ? 'chg up' : 'chg dn'}>
            {snap.changePct >= 0 ? '+' : ''}
            {snap.changePct.toFixed(2)}%
            <span className={`dot ${status}`} />
          </div>
        </div>
      </header>
      {feed.lastError && status !== 'acik' && (
        <p className="err">Bağlantı: {feed.lastError}</p>
      )}

      <div className="wins">
        {WINDOW_OPTIONS.map((w) => (
          <button
            key={w}
            data-testid={`win-${w}`}
            className={windowSec === w ? 'on' : ''}
            onClick={() => setWindow(w)}
          >
            {windowLabel(w)}
          </button>
        ))}
        <button
          data-testid="win-oturum"
          className={windowSec === 'oturum' ? 'on' : ''}
          onClick={() => setWindow('oturum')}
        >
          AÇILIŞTAN
        </button>
      </div>

      <p className="headline">{headline}</p>
      <p className="headline sub">{metaLine(snap)}</p>

      <main className="main glass">
        {tab === 'piramit' && (
          <PyramidCanvas key={symbol} layers={snap.layers} pulse={snap.tickCount} />
        )}
        {tab === 'akis' && <TapeList trades={feed.tape.newestFirst()} key={tapeTick} />}
        {tab === 'radar' && (
          <RadarList key={radarTick} rows={feed.radar} onPick={setSymbol} />
        )}
        {tab === 'ayar' && (
          <div className="ayar">
            <p>Katman eşiği</p>
            <div className="wins">
              <button
                className={snap.edgeMode === 'adaptif' ? 'on' : ''}
                onClick={() => feed.engine.setEdgeMode('adaptif')}
              >
                Adaptif (coin’e göre)
              </button>
              <button
                className={snap.edgeMode === 'sabit' ? 'on' : ''}
                onClick={() => feed.engine.setEdgeMode('sabit')}
              >
                Sabit (BTC ölçeği)
              </button>
            </div>
            <p className="dim">
              Sinyal defteri: {snap.journalHits.ok}/{snap.journalHits.n || 0} isabet
              (15dk sonra fiyat yönü). Tavsiye değil.
            </p>
            <p>Yerel alarm (Kraken / salvo / likidasyon)</p>
            <div className="wins">
              <button
                className={alertOn ? 'on' : ''}
                onClick={() => {
                  void askAlertPermission().then((ok) => setAlertOn(ok))
                }}
              >
                Alarm açık
              </button>
              <button
                className={!alertOn ? 'on' : ''}
                onClick={() => {
                  setAlertsEnabled(false)
                  setAlertOn(false)
                }}
              >
                Kapalı
              </button>
            </div>
            <JournalList rows={snap.journal} />
            <p className="dim">Telegram’da BotFather → Mini App URL: bu site. Arka plana düşünce akış durur.</p>
          </div>
        )}
      </main>

      <section className="foot-card">
        <div className="split">
          <div>
            <span className="k" data-testid="win-label">
              Son {windowLabel(windowSec)}
            </span>
            <b data-testid="win-net" className={netWord(topNet) === 'ALIŞ' ? 'alis' : 'satis'}>
              büyükler {netWord(topNet)} {formatCompactUsd(Math.abs(topNet))}
            </b>
          </div>
          <div>
            <span className="k">Açılıştan</span>
            <b className={netWord(sessTop) === 'ALIŞ' ? 'alis' : 'satis'}>
              büyükler {netWord(sessTop)} {formatCompactUsd(Math.abs(sessTop))}
            </b>
          </div>
        </div>
        <div className="ticks" data-testid="tick-count">
          {snap.tickCount.toLocaleString('tr-TR')} işlem · {statusLabel(status)}
        </div>
        <p className="disclaimer">Bu tavsiye değil. Sadece borsadan gelen alış-satış sayımı.</p>
      </section>

      <nav className="nav" aria-label="Ana menü">
        <button className={tab === 'piramit' ? 'on' : ''} onClick={() => setTab('piramit')}>
          Piramit
        </button>
        <button className={tab === 'akis' ? 'on' : ''} onClick={() => setTab('akis')}>
          Akış
        </button>
        <button
          data-testid="tab-radar"
          className={tab === 'radar' ? 'on' : ''}
          onClick={() => setTab('radar')}
        >
          Radar
        </button>
        <button className={tab === 'ayar' ? 'on' : ''} onClick={() => setTab('ayar')}>
          Ayar
        </button>
      </nav>
    </div>
  )
}

function statusLabel(s: string): string {
  if (s === 'acik') return 'canlı'
  if (s === 'baglaniyor') return 'bağlanıyor'
  if (s === 'yeniden') return 'yeniden'
  return 'kapalı'
}

function metaLine(snap: {
  burst: { count: number; merged: number } | null
  oi: number | null
  oiDelta: number | null
  lastLiq: { side: string; notional: number } | null
  edgeMode: string
}): string {
  const bits: string[] = []
  bits.push(snap.edgeMode === 'adaptif' ? 'eşik: adaptif' : 'eşik: sabit')
  if (snap.burst) {
    bits.push(`salvo ${snap.burst.count} vuruş ≈ ${formatCompactUsd(snap.burst.merged)}`)
  }
  if (snap.oi != null) {
    const d = snap.oiDelta
    bits.push(
      `OI ${formatCompactUsd(snap.oi)}${d == null ? '' : d >= 0 ? ' ↑' : ' ↓'}`,
    )
  }
  if (snap.lastLiq) {
    bits.push(`likidasyon ${snap.lastLiq.side} ${formatCompactUsd(snap.lastLiq.notional)}`)
  }
  return bits.join(' · ')
}
