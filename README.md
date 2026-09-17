# StitchCraft

Tarayıcıda çalışan nakış tasarım uygulaması. `https://stitchcraft.wasmer.app/` sitesinin
düzenlenebilir kaynak kodu olarak yeniden yapılandırılmış hâlidir (Vite + React 18 + TypeScript).

## Çalıştırma

```bash
npm install
npm run dev        # geliştirme sunucusu
npm run build      # dist/ klasörüne statik derleme
npm run preview    # derlenmiş hâli yerelde önizle
npm run typecheck  # tsc ile tip kontrolü
```

`dist/` klasörü tamamen statiktir; Wasmer, Netlify, GitHub Pages gibi her statik barındırmaya yüklenebilir.

## Özellikler

- 7 dikiş türü: running, back, cross, chain, satin, french knot, lazy daisy
- Araçlar: iğne (çizim), silgi, kaydırma, yakınlaştırma, damlalık (klavye: N, E, H, Z, I)
- Kumaş dokusu prosedürel olarak üretilir; iplikler gölge, büküm ve parlama ile çizilir
- 5 hazır şablon (Robot, Wildflowers, Cottage, Sailboat, Hot air balloon)
- Geri al / yinele, IndexedDB'ye otomatik kayıt, PNG (1x / 3x) ve JSON dışa aktarma, JSON içe aktarma
- Masaüstü, tablet (çekmeceler) ve telefon (alt sayfalar) düzenleri

## Kod yapısı

```
src/
  main.tsx              giriş noktası
  styles.css            tüm stiller (CSS değişkenleri :root altında)
  core/
    types.ts            ortak tipler (Point, Stitch, ProjectData ...)
    constants.ts        dikiş türleri, etiketler, tuval boyutu, grid
    geom.ts             vektör matematiği, yumuşatma, yeniden örnekleme, tarama (hatch)
    stitches/           her dikiş türü için geometri üreteci + kayıt (index.ts)
    document.ts         dikiş listesi, uzamsal indeks, hit-test, JSON
    history.ts          geri al / yinele yığını
    commands.ts         AddStitch, Erase, ReplaceDocument komutları
    viewport.ts         pan / zoom dönüşümü
    fabric.ts           dokuma kumaş dokusu ve kasnak kenarlığı
    render.ts           iplik çizimi (gölge, büküm, parlama, delikler)
    renderer.ts         üç katmanlı canvas çizici (kumaş / dikişler / overlay)
    input.ts            pointer, tekerlek ve boşluk tuşu ile kaydırma
    export.ts           PNG / JSON dışa aktarma
    storage.ts          IndexedDB kayıt / yükleme
    store.ts            küçük harici store (useSyncExternalStore ile)
    editor.ts           uygulama denetleyicisi; PALETTE ve EditorState burada
  templates/            hazır şablonlar ve çizim yardımcıları (helpers.ts)
  ui/                   React bileşenleri (Header, Stage, paneller, mobil, vb.)
```

Sık değiştirilecek yerler:

- Renk paleti: `src/core/editor.ts` içindeki `PALETTE`
- Tema renkleri / yazı tipleri: `src/styles.css` başındaki `:root` değişkenleri
- Varsayılan dikiş ayarları: `src/core/editor.ts` içindeki `INITIAL_STATE`
- Yeni şablon: `src/templates/` altına dosya ekleyip `index.ts` içindeki `TEMPLATES` listesine kaydedin
- Tuval boyutu: `src/core/constants.ts`
