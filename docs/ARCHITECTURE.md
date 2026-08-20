# Piramit — Mimari

Binance **USD-M futures** agresyon haritası. Fiyat tahmini **değil**; taker alış/satış **USDT notional**
katmanları. React UI, saf TypeScript çekirdek, mümkünse Worker içinde WebSocket.

## Bilinçli Redler (tasarım kararları)

- **API key yok.** Sadece public market verisi. Mock yok.
- **Order book yok.** Sinyal yalnızca trade tape'inden (aggTrade) ve forceOrder'dan.
- **`src/core` React tanımaz.** DOM/localStorage/fetch kullanan modüller bile React import etmez.
- **Tek parse.** `unwrapWs` gelen ham JSON'u bir kez açar, sınıflandırır; sonrası tipli nesnelerle çalışır.
- **Motor 20fps snapshot.** Her trade'de değil, `dirty` bayrağıyla toplu emit.
- **Canvas içine yazı yok** (dar katmanda okunmaz); metinler HTML katmanında.
- **`X-Frame-Options: DENY` yok** — Telegram iframe'i kırılır (bkz. `vercel.json`).

## Katmanlar

```
┌─────────────────────────────────────────────────────────────┐
│                       Binance USD-M                         │
│   WS: aggTrade · !forceOrder@arr · !miniTicker@arr          │
│   REST: exchangeInfo · openInterest                         │
└──────────────────────────────┬──────────────────────────────┘
                               │ ham JSON (string)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  src/core/ws         BinanceSocket → SocketRuntime/Worker    │
│                      backoff · hot-swap · streamPlan        │
└──────────────────────────────┬──────────────────────────────┘
                               │ unwrapWs (tek parse)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  src/core/market     aggTrade / forceOrder / miniTicker / OI │
└──────────────────────────────┬──────────────────────────────┘
                               │ tipli nesne
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  src/features/feed   FeedController: sembol→WS+OI→engine     │
└──────────────────────────────┬──────────────────────────────┘
                               │ ingestTrade / setOi / ingestLiq
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  src/core/engine     PyramidEngine                          │
│   WindowLedger (1sn×mikro-kova) · BurstDetector             │
│   adaptiveEdges · morphology · divergence · windowClash     │
│   SignalJournal · oiState                                   │
│   → 20fps PyramidSnapshot (cache + dirty)                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ subscribe()
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  src/bridge          useEngine = useSyncExternalStore        │
└──────────────────────────────┬──────────────────────────────┘
                               │ snapshot
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  src/features (React)  Piramit · Akış · Radar · Ayar        │
│  src/app/App.tsx       tab yönetimi, prefs, Telegram köprü   │
└─────────────────────────────────────────────────────────────┘
```

## Modül Haritası (tek sorumluluk)

### `src/core/engine` — çekirdek, React'siz
| Dosya | Sorumluluk |
|---|---|
| `pyramidEngine.ts` | tick al → deftere yaz → snapshot üret; `PyramidSnapshot` şeması, 20fps emit |
| `microBuckets.ts` | notional → sabit logaritmik kova indeksi (10–10M, 10/decade) |
| `layerMapper.ts` | mikro-kova dizisini 7 katmana grupla (`foldBuckets`) |
| `layerNames.ts` | 7 katman adı + sabit (USDT) eşikler + üst/alt dilimler |
| `layerWallet.ts` | katman alış/satış sayacı (cents ile float kayması kesilir) |
| `windowLedger.ts` | 1sn × mikro-kova defteri; pencere toplamı + oturum |
| `adaptiveEdges.ts` | kova histogramından yüzdelik eşik + histerezis + sabit ölçekleme |
| `burstDetector.ts` | kısa salvo → birleşik niyet (median-pack) |
| `morphology.ts` | 7 katman payından şekil etiketi (klasik/kum/ters/mantar/yassı/boş) |
| `divergence.ts` | tepe/taban vs fiyat (`tanh`) → toplama/boşaltma; OI yalnız dipnot |
| `windowClash.ts` | kısa pencere ↔ oturum çelişkisi |
| `signalJournal.ts` | sinyal anı + later5/15/60 fiyat + isabet oranı (localStorage) |
| `oiState.ts` | OI durumu (bekliyor/ok/yok/eski) — "yalan yok" |
| `signalConfig.ts` | tüm sinyal eşikleri (sihirli sayılar tek yerde) |

### `src/core/ws` — bağlantı
| Dosya | Sorumluluk |
|---|---|
| `endpoints.ts` | WS/REST adresleri + combined stream URL kurucu |
| `socketRuntime.ts` | WebSocket yaşam döngüsü: reconnect + jitter + 23s hot-swap |
| `socket.worker.ts` | Worker tarafı: soket burada, UI thread boş |
| `BinanceSocket.ts` | yüzey: Worker varsa Worker, yoksa ana thread |
| `backoff.ts` | üstel gecikme (cap + jitter) |
| `streamPlan.ts` | hangi stream açılacak (saver/radar'a göre) |
| `unwrap.ts` | combined JSON'u bir kez aç, türe ayır |

### `src/core/market` — protokol
| Dosya | Sorumluluk |
|---|---|
| `aggTrade.ts` | aggTrade → yönü netleşmiş trade (`nq` varsa RPI hariç) |
| `forceOrder.ts` | likidasyon parse |
| `miniTicker.ts` | radar satırı parse |
| `openInterest.ts` | OI parse + delta + `kontrat × fiyat` USDT dönüşümü |

### `src/core/format` — biçimlendirme
`cents.ts` (kuruş birikimi), `formatPrice.ts` (tickSize'a göre kırpmadan yaz), `money.ts` (USDT metin),
`precision.ts` (exchangeInfo → tickSize + sembol listesi + arama), `seedSymbols.ts` (CORS fallback tohum liste),
`sessionShot.ts` (oturum metni/indirme), `edgeRange.ts` (eşik aralığı yazısı).

### `src/core/store` — kalıcılık (localStorage)
`prefs.ts` (son oturum), `tapeBuffer.ts` (son N trade, GC'siz ring), `dataSaver.ts`, `favorites.ts`.

### `src/core/alert` — yerel alarm
`localAlert.ts`: tarayıcı/Telegram Notification, izin yönetimi, `pingAlert`.

### `src/features` — React UI
| Dosya | Sorumluluk |
|---|---|
| `feed/FeedController.ts` | sembol → WS + OI → motoru besle; radar/tape/status yönetimi |
| `pyramid/PyramidCanvas.tsx` | HTML 3 kolon çizim + katman ipucu |
| `pyramid/LayerLegend.tsx` | katman adları + eşik aralıkları |
| `flow/TapeList.tsx` | son 50 trade akışı |
| `radar/RadarList.tsx` | miniTicker listesi (pct/vol sıralama) |
| `divergence/JournalList.tsx` | toplama/boşaltma günlüğü + later15 |
| `settings/SymbolSearch.tsx` | sembol arama (precision registry) |
| `settings/FavChips.tsx` | favori çipleri |
| `alert/watchAlerts.ts` | snapshot'tan Kraken hacim alarmı (spam yok) |

### Köprüler
- `src/bridge/useEngine.ts` — `useSyncExternalStore` ile motor snapshot'ını React'e bağlar (re-render sadece snapshot değişince).
- `src/telegram/` — `webApp.ts` (tema, Back/Main button, haptic, start_param), `launch.ts` (URL/hash → sembol).
- `src/ui/` — `moneyTone.ts` (renk/yön), `strings.ts` (etiketler), `SettingCard.tsx`.

## Durum Yönetimi

- **Tek doğru kaynak:** `PyramidEngine` içindeki `cached: PyramidSnapshot`.
- **Güncelleme:** `ingestTrade/ingestLiq/setOi` → `dirty = true` → `start(20)` interval → `emit()` → `buildSnapshot()` → listener'lar.
- **React tarafı:** `useSyncExternalStore(engine.subscribe, engine.snapshot)` — prop drilling yok, context yok.
- **UI durumu** (`tab`, `symbol`, `status`, `tapeTick`, …) `App.tsx` içinde `useState`; kalıcı olanlar `prefs.ts`.

## Depolama Anahtarları

| Anahtar | İçerik |
|---|---|
| `piramit-prefs-v1` | symbol, window, edge |
| `piramit-saver-v1` | veri tasarrufu |
| `piramit-fav-v1` | favori semboller |
| `piramit-alert-on` | alarm açık mı |
| `piramit-journal-v1` | sinyal günlüğü (son 80) |

## Build / Test / Deploy

- **Build:** `tsc -b && vite build` → Vercel (`vercel.json`).
- **Lint:** oxlint. **Test:** vitest (unit, `src/**/*.test.ts`). **e2e:** Python + Playwright benzeri snapshot (`tests/e2e_pyramid.py`, `tests/snap_pyramid.py`).
- **CI:** `.github/workflows/ci.yml` (test + güvenlik header doğrulaması).

## Genişleme Noktaları (bkz. PORT_NOTLARI.md)

Decay-lerp "akış modu", salvo intensity skoru, seçili mikro göstergeler (OFI/velocity/z-score/POC),
IndexedDB oturum indeksi — öneriler ve kaynak eşleşmeleri `docs/PORT_NOTLARI.md` içinde.
