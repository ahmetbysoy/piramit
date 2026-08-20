# Piramit — API & WebSocket Referansı

> Yalnızca public piyasa verisi. **API key yok, secret yok, mock yok.**

## 1. WebSocket

| Amaç | Endpoint |
|---|---|
| Ana akış (combined) | `wss://fstream.binance.com/market/stream?streams=STREAM1/STREAM2/...` |
| Tek stream | `wss://fstream.binance.com/market/ws/STREAM` |

### 1.1 aggTrade (sinyalin kalbi)

- Stream adı: `{symbol}@aggTrade` (ör. `btcusdt@aggTrade`)
- Kritik alanlar:

| Alan | Tip | Anlam |
|---|---|---|
| `e` | string | `aggTrade` |
| `s` | string | sembol |
| `p` | string | fiyat |
| `q` | string | adet (base asset) |
| `nq` | string | **notional qty** (RPI) — varsa `q` yerine bu kullanılır |
| `m` | bool | alıcı maker mı? `false` → alıcı taker → **ALIŞ**, `true` → **SATIŞ** |
| `T` | number | trade zamanı (ms) |
| `a` | number | agg trade id |

- **Notional hesaplama:** `notional = price × qty` (adet sayılmaz; USDT cinsinden büyüklük esas).

### 1.2 forceOrder (likidasyon)

- Stream adı: `!forceOrder@arr` (tüm semboller, tek akış)
- Kritik alanlar: `o.s` sembol, `o.S` taraf (SELL/BUY), `o.p` fiyat, `o.q` adet, `o.ap` ortalama fiyat, `o.T` zaman.
- Notional: `price × qty`. Taraf eşlemesi: `S==='SELL'` → SATIŞ, değilse ALIŞ.

### 1.3 miniTicker (radar)

- Stream adı: `!miniTicker@arr` (tüm semboller)
- Kritik alanlar: `s` sembol, `c` son fiyat, `P` 24s % değişim, `q` quote hacim.
- Fallback: `P` yoksa `(c − o)/o × 100`.

### 1.4 Mesaj zarfı (combined stream)

```json
{ "stream": "btcusdt@aggTrade", "data": { ... } }
```

`unwrapWs` bu zarfı bir kez açar; `data` içindeki `e` alanına göre tür atar.

## 2. REST

| Amaç | Endpoint | Not |
|---|---|---|
| exchangeInfo | `fapi.binance.com/fapi/v1/exchangeInfo` | fallback: `fapi1`, `fapi2` |
| Açık pozisyon (OI) | `fapi.binance.com/fapi/v1/openInterest` | `?symbol=BTCUSDT` |

### 2.1 exchangeInfo

- Filtreler: `status === 'TRADING'`, `contractType === 'PERPETUAL'`, `quoteAsset ∈ {USDT, USDC}`.
- Kullanılan filters: `PRICE_FILTER.tickSize` (fiyat hanesi), `LOT_SIZE.stepSize`.
- CORS / erişim hatasında `SEED_SYMBOLS` tohum listesi devrede kalır (arama her zaman çalışır).

### 2.2 openInterest

- `openInterest` alanı **kontrat adedi** gelir; ekran `kontrat × mark fiyat` ile **USDT** gösterir.
- Başarısız olursa `oiState` = `'yok'` (CORS) veya `'eski'`; UI "OI yok — sadece alış/satış" der. **Yalan yok.**

## 3. Telegram Mini App

| Köprü | Amaç |
|---|---|
| `initDataUnsafe.start_param` | başlangıç sembolü (`/app?startapp=ETH`) |
| `themeParams` | arka plan/metin renkleri → CSS değişkenleri |
| `viewportStableHeight` | `--tg-vh` (iframe yükseklik) |
| `BackButton` | geri tuşu (sekmeler arası) |
| `MainButton` | birincil eylem (oturum kaydet vb.) |
| `HapticFeedback.impactOccurred` | dokunsal geri bildirim |

URL kısayolları: `?s=ETH` veya `#ETH` → sembol; `normalizeLaunchSymbol` (`ETH` → `ETHUSDT`).

## 4. Bilinçli Yoklar

| Şey | Neden |
|---|---|
| Kullanıcı akışları (user data stream) | API key ister; private veriye girilmez |
| Order book (depth) stream | Sinyal yalnızca trade tape'inden türetilir |
| Sunucu / backend | Yok; her şey tarayıcıda. Alarmlar tarayıcı Notification'ı |
| `X-Frame-Options: DENY` | Telegram iframe'i kırılır, bilinçli kapatıldı |
