# Arı Nakış Levhası (3D baskı)

Çocukların plastik iğne + yün/kalın nakış ipliğiyle **çarpı işi (X)** arı motifi yapacağı delikli levha.

| Dosya | Ne işe yarar |
|---|---|
| `ari_levha.stl` | Doğrudan dilimleyiciye atılacak baskı dosyası |
| `ari_levha.scad` | Ölçüleri değiştirmek için parametrik OpenSCAD dosyası |
| `levha_ari_onizleme.svg/.png` | Arının levha üzerinde bitmiş hâli |
| `ari_desen_semasi.svg/.png` | Çocuklar için kareli desen şeması (A = sarı, S = siyah) |
| `ari_desen.txt`, `uret.py` | Desen kaynağı ve tüm dosyaları yeniden üreten betik (`python3 uret.py`) |

## Levha
- 165 × 135 × 2.4 mm, 29 × 23 = 667 delik, delik çapı 3.2 mm, aralık 5 mm
- Çoğu yazıcıya sığar (Ender 3, Bambu A1 mini, Prusa MK4…)
- Baskı: PLA, **beyaz/krem** renk (kanatların içi levha rengiyle "beyaz" görünür),
  0.2 mm katman, %100 dolgu ya da 4 duvar; destek gerekmez.

## Desen
- 24 × 16 ilmek, iki renk: **sarı 84 çarpı, siyah 108 çarpı**
- Her çarpı, dört delik arasındaki bir kareyi kaplar. Desen levhaya ortalanmıştır:
  şemadaki sayılar (0, 5, 10…) sol üst delikten itibaren delik numarasıdır.
- Öneri: önce siyah çizgileri (kafa, şeritler), sonra sarı gövdeyi, en son kanat ve antenleri işleyin.
