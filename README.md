# Piramit

Binance USD-M futures **agresyon haritası**. Fiyat değil; taker alış/satış büyüklük katmanları.

Canlı: https://piramit.vercel.app

## Ne bakıyorsun

- **Katmanlar** (Toz → Kraken): trade notional’ına göre. Varsayılan **adaptif** (yüzdelik). **Sabit** mod BTC tablosunu bu coin’in medyan trade’ine ölçekler — PEPE’de 1M$ Kraken olmaz.
- **1dk vs açılıştan**: kısa/uzun çelişki asıl cümle.
- **Toplama / boşaltma**: tepe vs taban + fiyat (tanh, oturum %’si 0.4’te satüre olmaz). OI varsa dipnot.
- **Salvo**: 3sn benzer vuruşlar.
- Radar, favori, yerel alarm, veri tasarrufu Ayar’da.

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
