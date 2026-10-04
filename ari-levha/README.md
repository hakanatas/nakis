# Petek Arı Nakış Levhası (3D baskı)

Çocukların plastik iğne ve kalın nakış ipliği/yünle **çarpı işi (X)** arı motifi yapacağı,
petek gözü şeklinde (altıgen) delikli levha.

| Dosya | Ne işe yarar |
|---|---|
| `ari_levha.stl` | Dilimleyiciye doğrudan atılacak baskı dosyası |
| `levha_ari_onizleme.svg/.png` | Arının levha üzerindeki bitmiş hâli (üstten) |
| `levha_masada.png` | Bitmiş levhanın masada duruşu |
| `levha_bos.svg` | Boş levha görünümü |
| `ari_desen_semasi.svg/.png` | Çocuklar için desen şeması (A = sarı, S = siyah) |
| `ari_desen.txt`, `uret.py` | Desen kaynağı ve her şeyi yeniden üreten betik |

Yeniden üretmek için: `pip install manifold3d numpy trimesh && python3 uret.py`
(ölçüler `uret.py` dosyasının başındaki parametrelerden değiştirilir).

## Levha
- Sivri tepeli altıgen, yuvarlatılmış köşeler: 164 mm (köşeden köşeye) × 142 mm (kenardan kenara).
  180 mm tablalı yazıcılara da sığar (Bambu A1 mini, Prusa Mini…).
- 2.2 mm taban + 1.4 mm yükseltilmiş çerçeve (levhayı sertleştirir, kenarı çerçeve gibi gösterir).
- 547 delik, Ø 3.0 mm, 5 mm aralık. Tepede Ø 6 mm asma deliği var; bitince duvara asılabilir.
- Baskı: PLA, **beyaz veya krem** renk, 0.2 mm katman, destek gerekmez, çerçeve yukarı bakacak şekilde.

## Desen
- Yandan görünüşlü tombul arı: kavisli şeritler, göz, anten, iğne, iki kanat ve iki bacak.
- **Sarı 92, siyah 120 çarpı**. Kanatların içi boş bırakılır ve levhanın beyazı görünür.
- Şemadaki turuncu kesikli çizgi, asma deliğinin tam altındaki delik sırasıdır; çocuklar yerini bununla bulur.
- Önerilen sıra: önce siyah dış çizgi ve şeritler, sonra sarı dolgu, en son kanatlar ve anten.
