import { useEffect, useMemo, useRef, useState } from 'react'
import { useEngine } from '../bridge/useEngine'
import { WINDOW_OPTIONS, type WindowSec } from '../core/engine/pyramidEngine'
import { topSlice } from '../core/engine/layerNames'
import { formatUsdt, windowLabel } from '../core/format/money'
import { oiToUsdt } from '../core/market/openInterest'
import { oiMeta, type OiState } from '../core/engine/oiState'
import { formatPrice } from '../core/format/formatPrice'
import { FeedController } from '../features/feed/FeedController'
import { PyramidCanvas } from '../features/pyramid/PyramidCanvas'
import { LayerLegend } from '../features/pyramid/LayerLegend'
import { TapeList } from '../features/flow/TapeList'
import { SymbolSearch } from '../features/settings/SymbolSearch'
import { RadarList } from '../features/radar/RadarList'
import { JournalList } from '../features/divergence/JournalList'
import { FavChips } from '../features/settings/FavChips'
import { loadSaver, saveSaver } from '../core/store/dataSaver'
import { loadPrefs, savePrefs } from '../core/store/prefs'
import { netWord } from '../ui/moneyTone'
import { bindBackButton, bindMainButton, haptic, shareTelegram, telegramStartSymbol } from '../telegram/webApp'
import { normalizeLaunchSymbol, symbolFromLocation, writeSymbolHash } from '../telegram/launch'
import { watchAlerts } from '../features/alert/watchAlerts'
import { alertsEnabled, askAlertPermission, setAlertsEnabled } from '../core/alert/localAlert'
import { SettingCard } from '../ui/SettingCard'
import { t } from '../ui/strings'
import { downloadSessionShot } from '../core/format/sessionShot'
import { ADAPT_MIN_TRADES } from '../core/engine/adaptiveEdges'

type Tab = 'piramit' | 'akis' | 'radar' | 'ayar'

export function App() {
  const feed = useMemo(() => new FeedController(), [])
  const prefs = useMemo(() => loadPrefs(), [])
  const bootSymbol = useMemo(() => {
    const fromTg = telegramStartSymbol()
    const fromUrl = typeof window !== 'undefined' ? symbolFromLocation(window.location.search, window.location.hash) : null
    return (fromTg ? normalizeLaunchSymbol(fromTg) : null) ?? fromUrl ?? prefs.symbol
  }, [prefs.symbol])
  const snap = useEngine(feed.engine)
  const [tab, setTab] = useState<Tab>('piramit')
  const [status, setStatus] = useState(feed.status)
  const [symbol, setSymbol] = useState(bootSymbol)
  const [tapeTick, setTapeTick] = useState(0)
  const [listReady, setListReady] = useState(feed.precision.loaded)
  const [radarTick, setRadarTick] = useState(0)
  const [alertOn, setAlertOn] = useState(false)
  const [saver, setSaver] = useState(false)
  const [copied, setCopied] = useState(false)
  const prevSnap = useRef(snap)
  const boot = useRef(false)

  useEffect(() => {
    feed.onChange(() => {
      setStatus(feed.status)
      setTapeTick((n) => n + 1)
      setListReady(feed.precision.loaded)
      setRadarTick((n) => n + 1)
    })
    feed.start(symbol)
    return () => {
      feed.stop()
    }
  }, [feed, symbol])

  useEffect(() => {
    feed.setRadar(tab === 'radar')
  }, [feed, tab])

  useEffect(() => {
    setAlertOn(alertsEnabled())
    const on = loadSaver()
    setSaver(on)
    feed.setSaver(on)
    if (!boot.current) {
      boot.current = true
      feed.engine.setWindow(prefs.window)
      feed.engine.setEdgeMode(prefs.edge)
    }
  }, [feed, prefs])

  useEffect(() => {
    savePrefs({ symbol, window: snap.windowSec, edge: snap.edgeMode })
    writeSymbolHash(symbol)
  }, [symbol, snap.windowSec, snap.edgeMode])

  useEffect(() => {
    const onHash = () => {
      const next = symbolFromLocation('', window.location.hash)
      if (next && next !== symbol) setSymbol(next)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [symbol])

  useEffect(() => {
    watchAlerts(prevSnap.current, snap)
    prevSnap.current = snap
  }, [snap])

  useEffect(() => {
    return bindBackButton(() => {
      if (tab !== 'piramit') {
        setTab('piramit')
        return true
      }
      return false
    })
  }, [tab])

  const windowSec = snap.windowSec
  const setWindow = (w: WindowSec) => {
    haptic()
    feed.engine.setWindow(w)
  }
  const pickCoin = (s: string) => {
    haptic()
    setSymbol(s)
    setTab('piramit')
  }
  const tick = feed.precision.get(symbol)?.tickSize ?? '0.01'
  const priceTxt = formatPrice(snap.priceStr, tick)

  const topNet = topSlice(snap.layers).reduce((a, l) => a + l.net, 0)
  const sessTop = topSlice(snap.sessionLayers).reduce((a, l) => a + l.net, 0)
  const headline = snap.clashYazi || snap.divYazi || snap.shapeYazi
  const shareLine = `${symbol} ${priceTxt} — ${headline}`

  useEffect(() => {
    return bindMainButton('Paylaş', () => {
      haptic()
      shareTelegram(shareLine)
    })
  }, [shareLine])

  return (
    <div className="shell">
      <div className="glow" aria-hidden />
      <header className="top">
        <SymbolSearch
          registry={feed.precision}
          value={symbol}
          ready={listReady}
          onPick={pickCoin}
        />
        <div className="px-block">
          <div className="px">{snap.priceStr ? priceTxt : '···'}</div>
          <div className={snap.changePct >= 0 ? 'chg up' : 'chg dn'}>
            {snap.changePct >= 0 ? '+' : ''}
            {snap.changePct.toFixed(2)}%
            <span className={`dot ${status}`} />
          </div>
        </div>
      </header>
      <FavChips
        current={symbol}
        tick={tapeTick}
        onPick={pickCoin}
      />
      {feed.lastError && status !== 'acik' && (
        <p className="err">
          Bağlantı: {feed.lastError}{' '}
          {status === 'olmedi' && (
            <button type="button" className="retry" onClick={() => feed.start(symbol)}>
              Yeniden dene
            </button>
          )}
        </p>
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

      <p
        className="headline"
        data-testid="headline"
        title="Dokun, kopyala"
        onClick={() => {
          const txt = `${symbol} ${priceTxt} — ${headline}`
          void navigator.clipboard?.writeText(txt).then(
            () => {
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1400)
            },
            () => setCopied(false),
          )
        }}
      >
        {copied ? 'Kopyalandı.' : headline}
      </p>
      <p className="headline sub">{metaLine(snap)}</p>
      {snap.edgeMode === 'adaptif' && snap.tickCount < ADAPT_MIN_TRADES && (
        <p className="headline sub" data-testid="adapt-warm">
          {t.tr.adaptWarm} ({snap.tickCount}/{ADAPT_MIN_TRADES})
        </p>
      )}
      {snap.adaptFlip && (
        <p className="headline sub" data-testid="adapt-flip">
          Eşikler güncellendi — şekil değişebilir, bug değil.
        </p>
      )}

      <main className="main glass">
        {tab === 'piramit' && (
          <>
            <PyramidCanvas key={symbol} layers={snap.layers} pulse={snap.tickCount} />
            <LayerLegend edges={snap.edges} />
          </>
        )}
        {tab === 'akis' && <TapeList trades={feed.tape.newestFirst()} key={tapeTick} />}
        {tab === 'radar' && (
          <RadarList key={radarTick} rows={feed.radar} onPick={pickCoin} />
        )}
        {tab === 'ayar' && (
          <div className="ayar">
            <SettingCard label="Katman eşiği" hint="Adaptif coin’e göre yüzdelik. Sabit BTC tablosunu medyana ölçekler.">
              <button
                className={snap.edgeMode === 'adaptif' ? 'on' : ''}
                onClick={() => feed.engine.setEdgeMode('adaptif')}
              >
                Adaptif
              </button>
              <button
                className={snap.edgeMode === 'sabit' ? 'on' : ''}
                onClick={() => feed.engine.setEdgeMode('sabit')}
              >
                Sabit
              </button>
            </SettingCard>
            <SettingCard
              label="Sinyal defteri"
              hint={`${snap.journalHits.ok}/${snap.journalHits.n || 0} isabet (15dk sonra yön). Tavsiye değil.`}
            >
              <JournalList rows={snap.journal} />
            </SettingCard>
            <SettingCard label="Yerel alarm" hint="Kraken / salvo / likidasyon">
              <button
                className={alertOn ? 'on' : ''}
                onClick={() => {
                  void askAlertPermission().then((ok) => setAlertOn(ok))
                }}
              >
                Açık
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
            </SettingCard>
            <SettingCard label="Veri tasarrufu" hint="Likidasyon + radar stream kapalı">
              <button
                className={saver ? 'on' : ''}
                onClick={() => {
                  saveSaver(true)
                  setSaver(true)
                  document.documentElement.classList.add('lite')
                  feed.setSaver(true)
                }}
              >
                Açık
              </button>
              <button
                className={!saver ? 'on' : ''}
                onClick={() => {
                  saveSaver(false)
                  setSaver(false)
                  document.documentElement.classList.remove('lite')
                  feed.setSaver(false)
                }}
              >
                Kapalı
              </button>
            </SettingCard>
            <p className="dim">Telegram BotFather Mini App URL: bu site. Arka plana düşünce akış durur.</p>
          </div>
        )}
      </main>

      <section className="foot-card">
        <div className="split">
          <div>
            <span className="k" data-testid="win-label">
              Son {windowLabel(windowSec)}
            </span>
            <b data-testid="win-net" className={toneClass(topNet)}>
              büyükler {netWord(topNet)} {formatUsdt(Math.abs(topNet))}
            </b>
          </div>
          <div>
            <span className="k">Açılıştan</span>
            <b className={toneClass(sessTop)}>
              büyükler {netWord(sessTop)} {formatUsdt(Math.abs(sessTop))}
            </b>
          </div>
        </div>
        <div className="ticks" data-testid="tick-count">
          {snap.tickCount.toLocaleString('tr-TR')} işlem · {statusLabel(status)}
        </div>
        <p className="disclaimer">Bu tavsiye değil. Sadece borsadan gelen alış-satış sayımı.</p>
        <button
          type="button"
          className="retry"
          onClick={() => {
            downloadSessionShot(snap)
            haptic()
          }}
        >
          {t.tr.saveShot}
        </button>
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

function toneClass(n: number): string {
  const w = netWord(n)
  if (w === 'ALIŞ') return 'alis'
  if (w === 'SATIŞ') return 'satis'
  return 'duz'
}

function statusLabel(s: string): string {
  if (s === 'acik') return 'canlı'
  if (s === 'baglaniyor') return 'bağlanıyor'
  if (s === 'yeniden') return 'yeniden'
  if (s === 'olmedi') return 'koptu'
  return 'kapalı'
}

function metaLine(snap: {
  burst: { count: number; merged: number } | null
  oi: number | null
  oiDelta: number | null
  oiState: OiState
  price: number
  lastLiq: { side: string; notional: number } | null
  edgeMode: string
}): string {
  const bits: string[] = []
  bits.push(snap.edgeMode === 'adaptif' ? 'eşik: adaptif' : 'eşik: sabit')
  if (snap.burst) {
    bits.push(`salvo ${snap.burst.count} vuruş ≈ ${formatUsdt(snap.burst.merged)}`)
  }
  const oiU = oiToUsdt(snap.oi, snap.price)
  const dU = oiToUsdt(snap.oiDelta, snap.price)
  bits.push(oiMeta(snap.oiState, oiU, dU, formatUsdt))
  if (snap.lastLiq) {
    bits.push(`likidasyon ${snap.lastLiq.side} ${formatUsdt(snap.lastLiq.notional)}`)
  }
  return bits.join(' · ')
}
