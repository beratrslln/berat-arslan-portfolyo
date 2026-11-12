# Berat Arslan — Portfolyo (React)

Gece ofisi temalı portfolyo. Tek HTML dosyası olarak yapılan tasarım, görünüm ve hareketler değişmeden Vite + React + TypeScript projesine taşındı. İçerik ve form, ileride yazılacak backend'e bağlanacak şekilde ayrı bir veri katmanından gelir.

## Çalıştırma

```bash
npm install
npm run dev        # geliştirme: http://localhost:5173
npm run build      # yayın paketi: dist/
npm run preview    # dist/ klasörünü yerelde aç
```

## Klasörler

```
src/
  icerik/          Projeler, profil, iletişim bilgileri ve form seçenekleri (yerel veri)
  api/             Veri katmanı: yerel veri ya da backend (istemci.ts, useIcerik.ts)
  tipler.ts        Ön yüz ile backend'in ortak veri biçimleri
  sahne/           Kamera ve kaydırma motoru, ekran köşeleri, kod renklendirme
  bilesenler/
    ofis/          Ofis sahnesi, perde, monitörler, monitör demoları
    patron/        Son sahne: patron odası
    tablet/        Tablet: iletişim kanalları, proje formu, hakkında
    arayuz/        Üst marka, sağdaki duraklar, alt çubuk, ipucu
  stiller/site.css Tasarımın bütün stili (tek dosyadan birebir taşındı)
public/gorseller/  Ofis ve patron odası görselleri, hazır bulanık ve hareket izli kopyaları
```

İçeriği değiştirmek için yalnız `src/icerik/` altındaki dosyaları düzenlemeniz yeterli. Ofiste dört monitör var; ilk dört proje soldan sağa monitörlere yerleşir.

## Neden sahne motoru React dışında?

Kamera, kaydırma ve geçişler her karede çalışır (`src/sahne/motor.ts`). Bunları React durumuyla yönetmek her karede yeniden çizim demek olur ve akıcılığı bozar. Motor bu yüzden DOM'a doğrudan yazar; React yalnız seyrek değişen durumu dinler: hangi durakta olunduğu ve tabletin açık olup olmadığı. Bileşenler motora `useSahne()` ile ulaşır (`motor.current.git(...)`, `monitoreGit`, `ilerle`).

## Backend'e geçiş

`.env.example` dosyasını `.env` olarak kopyalayın.

- `VITE_API_AKTIF=true`: İçerik ve form API üzerinden çalışır.
- `VITE_API_URL`: Canlıda API'nin adresi. Boş bırakılırsa aynı alan adı kullanılır.
- `VITE_API_PROXY`: Yalnız geliştirmede `/api` isteklerinin gideceği yerel backend (ör. `http://localhost:3000`).

Beklenen uç noktalar (veri biçimleri `src/tipler.ts` içinde):

| Yöntem | Yol | Döner / Alır |
|---|---|---|
| GET | `/api/projeler` | `Proje[]` |
| GET | `/api/profil` | `Profil` |
| GET | `/api/iletisim` | `Iletisim` |
| POST | `/api/mesajlar` | `ProjeTalebi` alır, 2xx döner |

API kapalıyken site yerel veriyle çalışır; proje formu e-posta uygulamasında hazır bir mesaj açar. API açıkken ulaşılamazsa içerik yerel veriye düşer, form ise kullanıcıya hata gösterir.

## Yayın

`netlify.toml` hazır: Netlify bu klasörü bağladığınızda `npm run build` çalıştırıp `dist/` klasörünü yayınlar. Başka bir yere yayınlarken de `dist/` klasörü yeterlidir.

## Bilinen noktalar

- Monitörlerdeki demolar temsilîdir; ekranlarda "temsilî ekran" yazar.
- Hakkında metni yer tutucudur (`src/icerik/profil.ts`).
- Yayın paketine güvenlik kuralı (Content-Security-Policy) eklenir (`vite.config.ts`, yalnız `npm run build`). Satır içi betik çalışmaz; Netlify'ın ücretsiz plan rozeti de bu yüzden görünmez. Yeni bir dış kaynak (betik, API, yazı tipi) eklerseniz kurala da ekleyin.
- Animasyon kütüphaneleri (GSAP, Lenis) pakete dahildir; yazı tipleri Google Fonts'tan yüklenir.
