# Piramit — Kullanım Kılavuzu (Walkthrough)

Piramit, Binance USD-M futures'ta **taker alış/satış agresyonunu USDT notional katmanları** olarak
gösterir. Fiyat tahmini yapmaz; "kim, ne büyüklükte, hangi yöne basıyor" sorusuna bakar.

## 0. Açılış

1. `https://piramit.vercel.app` veya Telegram `@piramitler_bot` (`/app?startapp=BTC`).
2. Açılış sembolü önceliği: **Telegram start_param** → **URL `?s=` / `#`** → kayıtlı tercih → `BTCUSDT`.
3. Ekran 4 sekme: **Piramit · Akış · Radar · Ayar**.

## 1. Piramit (ana görünüm)

- **7 katman:** Toz → Karınca → Balık → Yunus → Köpekbalığı → Balina → Kraken.
- **Ne bakıyorsun:** katman başına `fiyat × adet` = **USDT notional**. Adet sayılmaz.
- **Renk:** yeşil = net ALIŞ, kırmızı = net SATIŞ, gri = boş katman.
- **Eşik modu:**
  - **Adaptif** (varsayılan): bu coin'in kendi medyan notional'ından yüzdelik eşikler. 40 trade'den sonra kurulur; "Eşikler güncellendi — şekil değişebilir, bug değil" uyarısı normaldir.
  - **Sabit:** BTC tablosu (`100 / 1K / 10K / 50K / 250K / 1M`) × bu coin'in medyan USDT'si ile ölçeklenir.
- **Pencere:** `1dk · 5dk · 15dk · 1sa · Açılıştan`. Pencere, katmanların hangi zaman aralığından toplandığını seçer.
- **Şekil etiketi:** `klasik` (taban geniş), `kum saati` (alt+üst şişik, kavga), `ters` (sadece büyükler), `mantar` (Kraken patladı), `yassı` (hacim yok), `boş` (sessizlik).
- **Toplama / Boşaltma:** tepe vs taban + fiyat (`tanh`). Cümle örneği:
  "Küçükler kovalıyor, büyükler SATIŞ — boşaltma." OI varsa dipnot eklenir; OI yoksa "OI yok" der, **yalan söylemez**.
- **Çelişki cümlesi:** 1dk ile açılıştan ters yöndeyse `dönüş`/`dip`, aynı yöndeyse `teyit`.
- **Salvo:** 3 saniyede aynı yönde ≥8 benzer büyüklükte trade → birleşik niyet vurgusu (4 sn görünür).

## 2. Akış (tape)

- Son 50 trade, en yenisi üstte: yön, fiyat, **USDT büyüklük**.
- Likidasyonlar ayrı vurgulanır (forceOrder).

## 3. Radar

- Tüm USDT perp'lerinin miniTicker listesi: **% değişim** veya **quote hacim** sırasına göre sıralanır.
- Satıra tıklayınca o sembole geçilir.

## 4. Divergence Günlüğü

- Toplama/boşaltma sinyali bastığı anda kayıt düşer (sembol, tür, fiyat, saat).
- **later15:** 15 dakika sonraki fiyat otomatik işaretlenir; "isabet" sayacı sinyalin yönünü doğrular/yamultmaz.
- Aynı sembol+tür 60 sn içinde tekrar kaydedilmez (spam koruması).

## 5. Ayar

| Ayar | Etki |
|---|---|
| Sembol arama | `exchangeInfo` listesinden; CORS'ta tohum liste. Favorilere ekle/çıkar (yıldız). |
| Pencere varsayılanı | 1dk/5dk/15dk/1sa/Açılıştan |
| Eşik modu | Adaptif / Sabit |
| Veri tasarrufu | forceOrder + miniTicker akışlarını kapatır (yalnız aggTrade) |
| Yerel alarm | Kraken katmanı hacmi aniden artınca bildirim (+ haptic). İzin istenir. |
| Oturum kaydet | Katman dökümünü `.txt` indirir (Paylaş) |

## 6. Telegram Mini App Notları

- Tema otomatik Telegram renklerine uyar.
- Back tuşu sekmeler arası gezinir; ana sekmede uygulamayı kapatır.
- MainButton "Paylaş" için kullanılır.

## 7. İpuçları

- **Kraken katmanı boşsa** piyasa şu an kurumsal işlem yapmıyordur; sinyal çıkarmaya zorlama.
- **Adaptif kurulmadan** (40 trade) şekil/eşik geçicidir; "Adaptif kuruluyor" yazısına dikkat.
- **OI "yok"** görünüyorsa divergence cümlesi yalnızca alış/satış dengesinden türetilir; bu normaldir.
- Kısa tarama için: Radar'da % değişim sırala → ilginç sembole tıkla → Piramit'e dön.
