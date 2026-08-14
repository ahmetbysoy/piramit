# Piramit

Binance USD-M futures **agresyon haritası**. Fiyat değil; taker alış/satış büyüklük katmanları.

Canlı: https://piramit.vercel.app

## Ne bakıyorsun

- **Katmanlar** (Toz → Kraken): **USDT notional** = fiyat × adet. Adet sayılmaz. Varsayılan **adaptif** (yüzdelik). **Sabit** mod BTC tablosunu bu coin’in medyan USDT’sine ölçekler.
- **OI**: Binance kontrat verir; ekranda `kontrat × fiyat` → USDT. CORS olursa “OI yok” yazar.
- **1dk vs açılıştan**: kısa/uzun çelişki asıl cümle.
- **Toplama / boşaltma**: tepe vs taban + fiyat (tanh, oturum %’si 0.4’te satüre olmaz). OI gelmezse (CORS/451) metinde **OI yok** yazar, uydurma yok.
- **Salvo**: 3sn benzer vuruşlar.
- Radar, favori, yerel alarm, veri tasarrufu Ayar’da.
- Telegram: [@piramitler_bot](https://t.me/piramitler_bot) menü = site. `t.me/piramitler_bot/app?startapp=ETH` için BotFather `/newapp`. `?s=ETH` / `#ETH` aynı.

## Veri

- WS: `wss://fstream.binance.com/market` (`aggTrade`, `!forceOrder@arr`, radar açıkken `!miniTicker@arr`)
- REST: `fapi.binance.com` `exchangeInfo` + `openInterest`
- Mock / simülasyon yok.

## Geliştirme

```bash
npm install
npm run dev
npm test
```

Sinyal eşikleri: `src/core/engine/signalConfig.ts`

## Mimari

`src/core` React tanımaz. WS mesajı bir kez parse edilir (`unwrapWs`), motor 20fps snapshot basar.
