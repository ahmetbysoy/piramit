# Piramit

Binance USD-M futures **agresyon haritası**. Fiyat tahmini değil; taker alış/satış **USDT notional** katmanları.

Canlı: https://piramit.vercel.app · Bot: [@piramitler_bot](https://t.me/piramitler_bot)

## Ne bakıyorsun

- **Katman** (Toz → Kraken): `fiyat × adet` = USDT. Adet sayılmaz.
- **Adaptif eşik**: yüzdelik. **Sabit**: BTC tablosu × bu coin’in medyan USDT’si.
- **1dk vs açılıştan**: kısa/uzun çelişki cümlesi.
- **Toplama / boşaltma**: tepe vs taban + fiyat (`tanh`). OI yoksa yalan yok.
- **OI**: Binance kontrat verir; ekran `kontrat × fiyat` USDT. CORS → “OI yok”.
- **Salvo**, radar, favori, yerel alarm, veri tasarrufu.

Telegram Mini App: BotFather `/newapp` → `https://piramit.vercel.app` → `t.me/piramitler_bot/app?startapp=ETH`. Site: `?s=ETH` / `#ETH`.

## Veri

- WS: `wss://fstream.binance.com/market` — `aggTrade`, `!forceOrder@arr`, radar’da `!miniTicker@arr`
- REST: `exchangeInfo` (tohum liste + fapi/fapi1/fapi2), `openInterest`
- **API key yok.** Public market. Mock yok.

## Mimari

`src/core` React tanımaz. `unwrapWs` bir kez parse. Motor 20fps snapshot. Soket mümkünse Worker.

```
src/core/engine   piramit, pencere, divergence
src/core/ws       BinanceSocket + worker
src/core/market   aggTrade / OI / forceOrder
src/features      piramit (HTML 3 kolon), akış, radar, ayar
src/telegram      tema, Back, Paylaş, start_param
```

## Geliştirme

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

Sinyal: `src/core/engine/signalConfig.ts`

## Bilinçli redler

- Canvas içine yazı yok (dar katmanda çorba).
- `X-Frame-Options: DENY` yok — Telegram iframe kırılır.
- Binance secret env yok — gerekmez.
