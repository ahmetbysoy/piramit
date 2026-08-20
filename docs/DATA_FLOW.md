# Piramit — Veri Akışı

Uçtan uca: Binance WS baytları → katman notional'ları → 20fps snapshot → ekran.

## 1. Bağlantı ve Tek Parse

1. `FeedController.start(symbol)` → `streamsFor(symbol, radar, saver)` akış listesini kurar:
   - her zaman `{symbol}@aggTrade`
   - saver kapalıysa `!forceOrder@arr`
   - radar sekmesi açık ve saver kapalıysa `!miniTicker@arr`
2. `marketCombinedUrl` → `wss://fstream.binance.com/market/stream?streams=...`
3. `BinanceSocket.connect` → Worker varsa `socket.worker.ts`, yoksa ana thread `SocketRuntime`.
4. Her mesaj `unwrapWs(raw)` ile **bir kez** parse edilir ve türe ayrılır:
   - `{kind:'aggTrade'}`, `{kind:'forceOrder'}`, `{kind:'mini'}`, `{kind:'diger'}`.

## 2. Trade Yolu (ana hat)

```
aggTrade JSON
   │ parseAggTradePayload: p/q (nq varsa RPI hariç), m bayrağı, T zamanı
   │   sideFromMakerFlag: m=false → ALIŞ (alıcı taker), m=true → SATIŞ
   ▼
AggTrade { symbol, price, qty, notional=price×qty, side, timeMs }
   │ FeedController.route → engine.ingestTrade
   ▼
PyramidEngine.ingestTrade
   ├─ WindowLedger.ingest → notionalToBucket (log10, 10–10M) → 1sn slice'a yaz
   │     · slice.buckets[b] += (buy|sell)Notional, count++
   │     · session (oturum boyu) aynı şekilde
   │     · lastPrice / sessionOpenPrice güncellenir
   ├─ BurstDetector.push → 3sn pencerede aynı yönde ≥8 trade, median-pack (0.45–2.2×)
   │     → BurstHit { side, count, merged }
   ├─ lastTrade, tickCount++
   ├─ SignalJournal.markPrice (later5/15/60 doldurur)
   └─ dirty = true
```

## 3. Snapshot Üretimi (20fps)

`start(20)` interval'i yalnızca `dirty` iken `emit()` çağırır. `buildSnapshot()`:

1. **Eşikler:** `edgeMode='adaptif'` ve `tickCount ≥ 40` ise `edgesFromHistogram(sessionBuckets, prev)`
   → yüzdelikler `[0.5, 0.75, 0.9, 0.97, 0.99, 0.999]` + %18 histerezis. Değilse `scaleFixedEdges(medianNotional)`
   (BTC tablosu × `sizeScale`, medyan yoksa ham FIXED_EDGES).
2. **Pencere:** `windowSec` (60/300/900/3600) ise `ledger.sumWindow(windowSec, now)`; `'oturum'` ise `sessionBuckets()`.
3. **Gruplama:** `foldBuckets(winBuckets, edges)` → 7 katman `LayerWallet`.
4. **Salvo katkısı:** son 4sn içinde aktif salvo varsa, ilgili katmana `merged × 0.15` notional + 1 count eklenir
   (görsel vurgu; ham defter bozulmaz).
5. **Görünümler:** `toViews()` → `LayerView` (buyNotional, sellNotional, net, share, countShare).
6. **Şekil:** `detectShape(layers, scale)` → `klasik | kum | ters | mantar | yassi | bos` + Türkçe cümle.
7. **Divergence:** `scoreDivergence({ priceChange, topNet, botNet, topAbs, botAbs, oiDelta, minVol })`
   → `toplama | bosaltma | yok`; OI yalnız dipnot.
8. **Çelişki:** `readClash(shortNet, sessNet, minAbs)` → `donus | dip | teyit | yok`.
9. **Sonuç:** `PyramidSnapshot` cache'lenir, listener'lara verilir; `commitJournal` yeni divergence kaydı basar.

## 4. Yardımcı Veri Yolları

### 4.1 Likidasyon (forceOrder)
```
forceOrder JSON → parseForceOrder → Liq { symbol, side, priceStr, qty, notional }
   → FeedController.route → engine.ingestLiq (yalnızca aktif sembolle eşleşirse)
   → snapshot.lastLiq
```

### 4.2 Radar (miniTicker)
```
miniTicker array → parseMiniTickerArr → MiniRow[] { symbol, last, changePct, quoteVol }
   → FeedController.radar = rows → App radar sekmesinde sıralama (pct/vol) + tıklayınca sembol seçimi
```

### 4.3 Açık Pozisyon (OI)
```
REST fapi openInterest (periyodik) → parseOpenInterest → OiSnap { symbol, oi, at }
   → oiDelta(prev, next) → engine.setOi(oi, delta) · oiState = ok
   → oiToUsdt(kontrat, fiyat) = kontrat × fiyat  (ekran USDT gösterir)
   Başarısızsa markOiFail() → oiState = 'eski' veya 'yok'  ("OI yok — yalan yok")
```

### 4.4 Sembol Listesi (exchangeInfo)
```
fetch exchangeInfo (fapi → fapi1 → fapi2 fallback) → PrecisionRegistry.ingest
   → tickSize / stepSize / TRADING+PERPETUAL+USDT-USDC filtresi
   → SymbolSearch araması (rank: exact > startsWith > includes)
   CORS vb. hata → SEED_SYMBOLS (tohum liste) devrede kalır.
```

## 5. Durum ve Kalıcılık

| Yol | Mekanizma |
|---|---|
| Motor → UI | `useSyncExternalStore(engine.subscribe, engine.snapshot)` |
| UI → motor | `engine.setSymbol/setWindow/setEdgeMode` (reset tetikler) |
| Sembol kaynağı | Telegram start_param > URL `?s=`/`#hash` > prefs |
| Prefs | `savePrefs` (symbol, window, edge) — localStorage |
| Journal | `SignalJournal` (localStorage, son 80, later5/15/60) |
| Favori / saver / alarm | localStorage anahtarları (bkz. ARCHITECTURE.md) |

## 6. Zamanlama Özeti

| Bileşen | Ritim |
|---|---|
| WS mesajı | anlık (Binance push) |
| Defter ingest | her trade |
| Snapshot emit | 20fps, yalnızca dirty |
| OI poll | periyodik (REST) |
| Reconnect | 1s·2^n + jitter, cap 30s, max 12 deneme |
| Hot-swap | 23 saatte bir (soket tazeleme) |
| Journal later | +5dk / +15dk / +60dk işaretleme |
