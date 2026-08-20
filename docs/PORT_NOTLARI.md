# Piram → Piramit Taşıma Notları (Kod Çıkarımı)

> ⚠️ Yön: **piram → piramit** (web projesinin Android'den alacakları).
> Android projesi için gereken ters yön (`piramit → piram`) **piram reposunda**:
> [`piram/docs/PORT_NOTLARI.md`](https://github.com/ahmetbysoy/piram/blob/main/docs/PORT_NOTLARI.md)

> `piram` (Android/Kotlin) projesindeki **işe yarayacak fonksiyonlar, stratejiler, kurgular,
> mantıksal fikirler ve geliştirme patch'leri** — `piramit` (web/TypeScript) projesinde nereye
> lazım olur, ne alınır, ne uyarlanır, ne reddedilir.
>
> Not: `piramit` zaten birçok şeyi daha olgun yapıyor (window ledger, adaptif eşik + histerezis,
> divergence, journal + isabet oranı, Worker soket). Bu liste **farkları** ve **boşlukları** öne çıkarır.

---

## 0. Hızlı Karar Tablosu

| Parça (piram) | piramit'te durum | Verdict |
|---|---|---|
| Logaritmik mikro-kova (binning) | VAR (`microBuckets.ts`) | ✅ Zaten var |
| Katman adları + sabit eşikler | VAR (`layerNames.ts`) | ✅ Zaten var (7 katman, daha iyi) |
| Burst / salvo algılama | VAR (`burstDetector.ts`) | 🔁 piram'ın z-score yoğunluğu eklenebilir |
| Toplama/boşaltma (divergence) | VAR (`divergence.ts`) | ✅ Zaten var (daha olgun) |
| Adaptif eşik + histerezis | VAR (`adaptiveEdges.ts`) | ✅ Zaten var |
| Pencere çelişkisi (1dk vs oturum) | VAR (`windowClash.ts`) | ✅ Zaten var |
| Sinyal günlüğü + isabet | VAR (`signalJournal.ts`) | ✅ Zaten var |
| Whale tier işareti (üst 2 katman) | VAR (`TOP_LAYER_FROM=4`) | ✅ Zaten var |
| Reconnect (backoff + jitter + cap) | VAR (`backoff.ts` + hot-swap) | ✅ Zaten var |
| **Decay + lerp yumuşatma (animasyon)** | **YOK** | 🆕 Aday (akış görünümü) |
| **Burst z-score intensity** | **YOK** (median-pack var) | 🆕 Aday (skor) |
| **20 strateji + consensus motoru** | **YOK** (bilinçli "tahmin yok") | ⚠️ Seçmeli, gösterge olarak |
| **Çok-borsa (5 venue) WS** | **YOK** (Binance-only, bilinçli) | ⚠️ fapi/fapi1/fapi2'ye genişletilebilir |
| **Order book (L2) derinlik** | **YOK** (tape-only, bilinçli) | ⚠️ İstenirse ek modül |
| **Room/SQLite offline indeks** | **YOK** (localStorage; "IDB yok" diyor) | 🆕 Aday (IndexedDB) |
| **Whale-only tape filtresi** | **YOK** (TapeList tüm trade) | 🆕 Aday (filtre) |
| **Katman detay paneli (tooltip)** | Kısmen (Canvas `tip`) | 🔁 Zenginleştirilebilir |
| **3 seviyeli haptic pattern** | VAR (tek `impactOccurred`) | 🔁 Çeşitlendirilebilir |

---

## 1. Fonksiyonlar / Yardımcılar

### 1.1 Birebir karşılığı zaten piramit'te olanlar (boşuna taşınmasın)
- `MathUtils.createLogarithmicThresholds` + `findBucketIndex` ↔ piramit `microBuckets.notionalToBucket` / `bucketFloor` (10–10M, 10 kova/decade). **Aynı iş.**
- `MathUtils.formatPrice/formatVolume/formatUsd` ↔ piramit `format/money.ts` + `formatPrice.ts` (piramit tickSize'a göre kırpıyor, daha doğru).
- `MathUtils.calculateZScore` ↔ piramit `adaptiveEdges` içinde yüzdelik + `sizeScale` yaklaşımı. Kısmen karşılık var.
- `WsReconnectPolicy` (exp backoff + jitter + cap) ↔ piramit `backoff.ts` + `SocketRuntime` (hot-swap da var). **piramit daha iyi.**

### 1.2 piramit'te OLMAYAN, taşınmaya değer fonksiyonlar

**a) Üstel sönüm + lerp (smooth decay)** — `MicroBucket.decay/updateDisplay`
```text
current(t+dt) = current(t) * e^(-λ·dt)
display(t+dt) = display(t) + α·(current(t) − display(t))
barWidth    = sqrt(display) / sqrt(max)   // karekök normalizasyonu
```
- **Neden lazım:** piramit window-sum kullanıyor (keskin düşüşler, pencere bitince katman bir anda boşalır).
- **Nereye:** `src/core/engine` içinde `decay.ts` gibi yeni modül; snapshot'a `displayLayers` eklenip Canvas bunu çizsin. Mevcut `layers` (kesin hesap) kalır, sadece görsel katman yumuşar.

**b) Karekök genişlik ölçeği** — `PyramidCanvas` (piram)
- Katman çubuğu genişliğini `sqrt(notional)` ile normalize etmek, Kraken katmanının ekranı patlatmasını önler. piramit Canvas'ı da aynı dertte olabilir; `share` yerine `sqrt` ölçeği denenebilir.

**c) Teknik göstergeler (saf, bağımlılıksız)** — `TechnicalIndicators.kt`
- `vwap`, `orderFlowImbalance`, `volumeZScore`, `rsi`, `macd`, `bollingerBands`, `ema/emaSeries`, `donchianChannels`, `pointOfControl`, `standardDeviation`, `rateOfChange`.
- **Nereye:** piramit "fiyat tahmini değil" ilkesini koruyarak bunları **tahmin** değil **mikroyapı dipnotu** olarak kullanabilir:
  - `pointOfControl` (hacim profili POC) → Radar/Akış ekranına "günün en yoğun fiyatı".
  - `volumeZScore` → salvo eşiğine alternatif: "şu anki akış, son N tick'in z-skoru".
  - `orderFlowImbalance` → Kraken/Balina katmanı için tek sayılık özet.
- Öneri: `src/core/engine/indicators.ts` (pure, test'li) — yalnızca kullanılacak 3–4 tanesi.

**d) `DepthAggregator` (çoklu kitap birleştirme)** — piram'ın Phase 5 çıktısı
- piramit order book kullanmıyor; ama **aynı mantık** "aynı sembolün farklı kaynaklardan gelen fiyat/akışı" için kullanılabilir (fapi/fapi1/fapi2 fallback + miniTicker çapraz doğrulama).
- **Nereye:** ileride "kaynaklar arası spread" kartı eklenirse `src/core/engine/sourceSpread.ts`.

**e) `OneMinuteVolumeTracker` (60 sn kayan alış/satış hacmi)**
- piramit bunu zaten `WindowLedger.sumWindow(60)` ile yapıyor (daha doğru). **Taşınmasına gerek yok** — sadece "1dk akış" kartı zaten pencere 60 iken görünüyor.

### 1.3 piram'daki **bilinçli reddedilen** şeyler (piramit'e de taşınmamalı)
- `ui/theme` çift paket (template artığı) → piramit'te yok, iyi.
- `Example*Test`, `greeting.png` → piramit'te yok; `hero.png` var (kullanılıyor mu kontrol et — bkz. §4.3).
- Mock/simülasyon verisi → piramit "Mock yok" ilkesiyle zaten reddediyor. ✅

---

## 2. Stratejiler (20 adet) — hangisi piramit'e uyar?

piram'daki 20 strateji 5 kategoride. piramit "tahmin yok, taker notional" dediği için **hepsi** uymaz.
Aşağıda "Al (gösterge olarak) / Uyarla / Gerek yok" sınıflandırması:

| # | Strateji (piram) | Mantık | piramit için |
|---|---|---|---|
| 1 | Trend Following (EMA9/21+VWAP) | trend | ❌ Tahmin kokuyor |
| 2 | Mean Reversion (Bollinger %B, z) | trend | ❌ |
| 3 | Momentum Surge (ROC) | momentum | ⚠️ Radar'a "ivme" sütunu olabilir |
| 4 | Volume Spike (z-score) | hacim | ✅ **AL** — salvo alternatifi |
| 5 | RSI | momentum | ❌ |
| 6 | MACD | momentum | ❌ |
| 7 | Bollinger Bands | vol | ❌ |
| 8 | Support/Resistance | trend | ⚠️ POC ile birleşir |
| 9 | Breakout (Donchian) | vol | ❌ |
| 10 | Volume Profile (POC) | hacim | ✅ **AL** — "günün yoğun fiyatı" |
| 11 | Divergence (delta) | mikro | ✅ piramit'te daha iyisi var |
| 12 | Volatility Expansion | vol | ⚠️ Opsiyonel |
| 13 | Order Flow Imbalance (OFI) | mikro | ✅ **AL** — tek sayı özet |
| 14 | Market Microstructure (spread) | mikro | ❌ (book yok) |
| 15 | Liquidity Hunt (sweep) | mikro | ⚠️ forceOrder ile yakın |
| 16 | Statistical Arbitrage (cross-venue) | arb | ⚠️ fapi/fapi1/fapi2 spread'i |
| 17 | Trade Arrival Velocity | momentum | ✅ **AL** — "tick hızı" göstergesi |
| 18 | Order Book Pressure | mikro | ❌ (book yok) |
| 19 | Tick Price Action | trend | ⚠️ |
| 20 | Burst Momentum Arb | arb | ✅ piramit burst zaten var |

**Öneri:** piramit'e "strateji motoru" değil, **`indicators.ts` + `flowStats`** ekle:
`volumeZScore`, `arrivalVelocity`, `ofi`, `poc`. Bunlar snapshot'a 2–3 alan olarak girsin;
kullanıcıya "sinyal" değil "mikroyapı metrikleri" olarak sunulsun.

**Consensus motoru (piram `StrategyEngine`)** — ağırlıklı oylama:
- piramit'in `divergence + morphology + windowClash` üçlüsü zaten kendi "konsensüs"ü.
- İstenirse bu üçünün ağırlıklı skoru tek "durum" etiketine bağlanabilir (ör. `durum = toplama %70 · teyit %20 · şekil %10`). Düşük öncelik.

---

## 3. Kurgular / Mantıksal Fikirler (piramit'te yoksa aday)

### 3.1 piramit'te zaten olan, tekrar iş yapmayalım
- Logaritmik katmanlama + sokak adları (Toz→Kraken) ✅
- Salvo birleştirme (median-pack) ✅
- Toplama/boşaltma + OI dipnotu ✅ ("OI yoksa yalan yok" → piram'daki `oiState` ile aynı ruh)
- Adaptif eşik + histerezis ✅
- 1dk vs oturum çelişkisi ✅
- Journal + isabet (later15) ✅ — piram'da bu yok, **piramit önde**.
- Veri tasarrufu + favori + yerel alarm ✅

### 3.2 piramit'te OLMAYAN fikirler (taşınmaya değer)

1. **"Akış modu" (decay + lerp)** — pencere toplamına ek, yumuşatılmış görsel katman. Kullanıcı "canlı ısı haritası" hissini alır. (Bknz. §1.2a)
2. **Salvo z-score yoğunluğu** — piram: `intensity = n*1.5 + velocity/threshold`. piramit salvo'yu boolean gibi kullanıyor; `BurstHit`'e `intensity` eklenip Radar/Tape'te "sıcaklık" gösterilebilir.
3. **Cross-source spread** — piram'ın VenueStrip'i 5 borsa fiyatını karşılaştırıyordu. piramit'te `fapi/fapi1/fapi2` üç REST kaynağı + `miniTicker` fiyatı karşılaştırılıp "kaynak tutarsızlığı" uyarısı verilebilir.
4. **Whale-only tape filtresi** — piram `TickerTape` yalnız whale trade'leri akıtıyordu. piramit `TapeList` hepsini gösteriyor; "Yalnız Köpekbalığı+" filtresi eklenebilir.
5. **Katman detay paneli** — piram `TooltipOverlay`: katmana basınca buy/sell %, adet, USDT, whale mi. piramit `PyramidCanvas` içinde `tip` var; bunu tam panele çevirmek (katman başına ▲/▼ + net + pay) dokunulabilirlik katar.
6. **Haptic çeşitlendirme** — piram 3 pattern: whale (çift titreşim), burst (kısa), tick (hafif). piramit `haptic()` tek tip; Telegram `impactOccurred('light'|'medium'|'heavy')` ile eşlenebilir.
7. **Offline trade indeksi** — piram Room/SQLite ile tüm trade'leri saklıyordu. piramit "IDB yok" diyor; **IndexedDB** ile "veri tasarrufu kapalıyken son N tick'i sakla, açılışta geri doldur" fikri (özellikle `oturum` penceresi için).
8. **24s ticker istatistikleri** — piram `MarketSnapshot` içinde `high24h/low24h/volume24h/priceChange24h` tanımlı ama beslenmiyordu (ölü kod). piramit'te `miniTicker` zaten `changePct` + `quoteVol` veriyor → Radar kartına "24s değişim + işlem hacmi" sütunları. (piram'dan ders: tanımladığın alanı besle.)

---

## 4. Geliştirme Patch'leri / Dersler (piram tarihinden)

1. **Stub bırakma** — piram'da 4 borsanın `depth()`'i `awaitClose{}` stub'dı; "multi-venue" iddiası çöküyordu. → piramit'te `unwrapWs`'in `diger` dalı ve tüm snapshot alanları **gerçekten tüketiliyor mu** diye periyodik audit.
2. **Ölü kod = yalan** — piram'da `exchangePrices`, `buyVolume1m` tanımlı ama beslenmiyordu. → piramit'te `MarketSnapshot`-benzeri her alanın tek yazıcısı olsun (kural: "tanımla → besle → göster").
3. **WS handshake'i doğru yap** — piram KuCoin token almadan bağlanıyordu (hiç çalışmıyordu). → piramit Binance combined stream'de subscription yok (her şey push), ama REST fallback (fapi1/fapi2) zaten örnek. Aynı özen OI'da var.
4. **Template temizliği** — piram'da kullanılmayan `ui/theme` paketi, Example testleri, eski `greeting.png` silindi. → piramit'te `hero.png` ve kullanılmayan asset/referans kontrolü (oxlint + grep).
5. **CI'da test adımı** — piram workflow'una `testDebugUnitTest` eklendi; APK üretiminden önce test geçiyor. → piramit `ci.yml` içinde `npm test` (vitest) zaten var mı kontrol et; yoksa build'den önce ekle. e2e (`tests/e2e_pyramid.py`) de CI'a bağlanabilir.
6. **Sürüm + doküman disiplini** — piram her patch'te `versionCode/versionName` + ROADMAP/PROGRESS/CHANGELOG güncelledi. → piramit `package.json` version sabit (`0.0.0`); en az CHANGELOG yok. Küçük de olsa changelog/not başlat.
7. **Reconnect'te jitter + cap + max deneme** — iki projede de var; piram'da ayrıca `cleanClose` (close→cancel fallback). piramit `tearDownSocket` bunu yapıyor. ✅ Kapalı.

---

## 5. Öncelik Sırası (piramit için önerilen yol haritası)

| Öncelik | İş | Kaynak (piram) | Efor |
|---|---|---|---|
| P1 | `indicators.ts`: volumeZScore + arrivalVelocity + OFI + POC | TechnicalIndicators | Küçük |
| P1 | Salvo'ya `intensity` skoru | BurstDetector | Küçük |
| P1 | "Akış modu" decay+lerp görsel katman | MicroBucket decay/updateDisplay | Orta |
| P2 | Whale-only tape filtresi + katman detay paneli | TickerTape + TooltipOverlay | Orta |
| P2 | Radar'a 24s değişim/hacim sütunları | (miniTicker zaten var) | Küçük |
| P3 | IndexedDB oturum indeksi | Room/SQLite tasarımı | Büyük |
| P3 | Kaynak tutarsızlığı (fapi/fapi1/fapi2 spread) | DepthAggregator/VenueStrip | Orta |
| — | Çok-borsa WS + order book | 5 venue client + depth | **Bilinçli redde bağlı** |

---

## 6. Sonuç (tek cümle)

> piramit, piram'ın **görsel/kurgusal** ruhunu çoktan aşmış durumda; piram'dan asıl taşınacaklar
> **dekoratif değil ölçülebilir** olanlar: decay-lerp akış modu, salvo yoğunluk skoru, seçili mikro
> göstergeler (OFI/velocity/z-score/POC) ve "tanımla → besle → göster" disiplini.
