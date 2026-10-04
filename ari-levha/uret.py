"""Petek (altıgen) arı nakış levhası: STL + önizleme SVG'leri + desen şeması üretir.

Gerekenler: pip install manifold3d numpy trimesh
Çalıştırma: python3 uret.py
"""
import math

import manifold3d as mf
import numpy as np
import trimesh

# ---------------- Parametreler (mm) ----------------
ADIM = 5.0           # delikler arası mesafe
DELIK_CAP = 3.0      # delik çapı
TABAN = 2.2          # levha kalınlığı
KENAR_YUKSEK = 1.4   # dış çerçevenin tabandan yüksekliği
KENAR_EN = 4.5       # dış çerçeve genişliği
KOSE_R = 6.0         # altıgen köşe yuvarlatması
PAY = 1.6            # en dıştaki delik ile çerçeve arası boşluk
ASKI_CAP = 6.0       # asma deliği çapı
FN = 24              # delik çemberi çözünürlüğü

SARI, SIYAH = '#F5B820', '#22201E'

DESEN = [s.rstrip('\n') for s in open('ari_desen.txt') if s.strip()]
DH, DW = len(DESEN), len(DESEN[0])


# Desen hücresi (c, r) -> köşe delikleri; delik (i, j) -> (x, y), y yukarı, merkez 0
def delik_xy(i, j):
    return (i - DW / 2) * ADIM, (DH / 2 - j) * ADIM


def altigen_icinde(x, y, apotem):  # sivri tepeli altıgen
    x, y = abs(x), abs(y)
    return x <= apotem and 0.5 * x + math.sqrt(3) / 2 * y <= apotem


def gerekli_apotem():
    r = DELIK_CAP / 2
    ic = 0.0
    for j, row in enumerate(DESEN):
        for i, ch in enumerate(row):
            if ch == '.':
                continue
            for di in (0, 1):
                for dj in (0, 1):
                    x, y = delik_xy(i + di, j + dj)
                    ic = max(ic, abs(x), 0.5 * abs(x) + math.sqrt(3) / 2 * abs(y))
    return ic + r + PAY + KENAR_EN


APOTEM = math.ceil(gerekli_apotem() + 1.0)
R_TEPE = APOTEM * 2 / math.sqrt(3)
ASKI_Y = R_TEPE - KOSE_R - 5.0
IC_APOTEM = APOTEM - KENAR_EN - PAY - DELIK_CAP / 2

delikler = []
for i in range(-40, 41):
    for j in range(-40, 41):
        x, y = delik_xy(i + DW // 2, j + DH // 2)
        if not altigen_icinde(x, y, IC_APOTEM):
            continue
        if math.hypot(x, y - ASKI_Y) < ASKI_CAP / 2 + KENAR_EN + DELIK_CAP:
            continue
        delikler.append((i + DW // 2, j + DH // 2, x, y))

for j, row in enumerate(DESEN):  # desenin tüm köşe delikleri levhada olmalı
    for i, ch in enumerate(row):
        if ch != '.':
            mevcut = {(a, b) for a, b, _, _ in delikler}
            assert all((i + a, j + b) in mevcut for a in (0, 1) for b in (0, 1)), (i, j)


# ---------------- 3D model ----------------
def altigen_kesit(apotem, kose):
    rr = (apotem - kose) * 2 / math.sqrt(3)
    pts = [(rr * math.cos(math.radians(90 + 60 * k)), rr * math.sin(math.radians(90 + 60 * k))) for k in range(6)]
    return mf.CrossSection([pts]).offset(kose, mf.JoinType.Round, circular_segments=48)


dis = altigen_kesit(APOTEM, KOSE_R)
ic = altigen_kesit(APOTEM - KENAR_EN, max(KOSE_R - KENAR_EN, 1.0))
aski_halka = mf.CrossSection.circle(ASKI_CAP / 2 + KENAR_EN, 48).translate((0, ASKI_Y))
aski_delik = mf.CrossSection.circle(ASKI_CAP / 2, 48).translate((0, ASKI_Y))

taban = dis.extrude(TABAN)
cerceve = ((dis - ic) + aski_halka).extrude(TABAN + KENAR_YUKSEK)
govde = taban + cerceve

kesiciler = [mf.Manifold.cylinder(TABAN + 2, DELIK_CAP / 2, DELIK_CAP / 2, FN).translate((x, y, -1))
             for _, _, x, y in delikler]
kesiciler.append(aski_delik.extrude(TABAN + KENAR_YUKSEK + 2).translate((0, 0, -1)))
levha = govde - mf.Manifold.batch_boolean(kesiciler, mf.OpType.Add)

mesh = levha.to_mesh()
tm = trimesh.Trimesh(np.array(mesh.vert_properties)[:, :3], np.array(mesh.tri_verts), process=False)
assert tm.is_watertight
tm.export('ari_levha.stl')

# ---------------- SVG ortak ----------------
S = 5  # px / mm
PAD = 14
GEN = 2 * APOTEM + 2 * PAD
YUK = 2 * R_TEPE + 2 * PAD


def px(x, y):
    return (x + APOTEM + PAD) * S, (R_TEPE + PAD - y) * S


def altigen_yol(apotem, kose):
    pts = altigen_kesit(apotem, kose).to_polygons()[0]
    return 'M' + ' L'.join('%.1f,%.1f' % px(x, y) for x, y in pts) + ' Z'


DEFS = '''<defs>
 <radialGradient id="plaka" cx="40%" cy="30%" r="80%">
  <stop offset="0" stop-color="#FFFEFA"/><stop offset="1" stop-color="#EDE6D8"/></radialGradient>
 <linearGradient id="cerceve" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#F3EEE3"/><stop offset="1" stop-color="#D9D0BF"/></linearGradient>
 <radialGradient id="delik" cx="38%" cy="35%" r="70%">
  <stop offset="0" stop-color="#6F675B"/><stop offset=".7" stop-color="#9C9384"/><stop offset="1" stop-color="#CFC6B6"/></radialGradient>
 <filter id="golge" x="-10%" y="-10%" width="120%" height="125%">
  <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#3b2a10" flood-opacity=".28"/></filter>
 <filter id="iplik" x="-20%" y="-20%" width="140%" height="140%">
  <feDropShadow dx=".6" dy="1.4" stdDeviation="1.1" flood-color="#000" flood-opacity=".38"/></filter>
</defs>'''


def plaka_svg():
    o = [f'<g filter="url(#golge)"><path d="{altigen_yol(APOTEM, KOSE_R)}" fill="url(#cerceve)"/></g>',
         f'<path d="{altigen_yol(APOTEM - KENAR_EN, max(KOSE_R - KENAR_EN, 1))}" fill="url(#plaka)" '
         f'stroke="#D6CDBB" stroke-width="2.5"/>']
    ax, ay = px(0, ASKI_Y)
    o.append(f'<circle cx="{ax:.1f}" cy="{ay:.1f}" r="{(ASKI_CAP / 2 + KENAR_EN) * S:.1f}" fill="url(#cerceve)" '
             f'stroke="#D6CDBB" stroke-width="2"/>')
    o.append(f'<circle cx="{ax:.1f}" cy="{ay:.1f}" r="{ASKI_CAP / 2 * S:.1f}" fill="url(#delik)"/>')
    for _, _, x, y in delikler:
        cx, cy = px(x, y)
        o.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{DELIK_CAP / 2 * S:.1f}" fill="url(#delik)"/>')
    return o


def ilmek_bacak(x0, y0, x1, y1, renk, acik, koyu):
    a, b = px(x0, y0)
    c, d = px(x1, y1)
    w = 1.75 * S
    nx, ny = (d - b), -(c - a)
    L = math.hypot(nx, ny)
    nx, ny = nx / L * w * .18, ny / L * w * .18
    return (f'<line x1="{a:.1f}" y1="{b:.1f}" x2="{c:.1f}" y2="{d:.1f}" stroke="{renk}" stroke-width="{w:.1f}" stroke-linecap="round"/>'
            f'<line x1="{a:.1f}" y1="{b:.1f}" x2="{c:.1f}" y2="{d:.1f}" stroke="{koyu}" stroke-width="{w:.1f}" '
            f'stroke-dasharray="1.6 2.6" stroke-opacity=".35"/>'
            f'<line x1="{a - nx:.1f}" y1="{b - ny:.1f}" x2="{c - nx:.1f}" y2="{d - ny:.1f}" stroke="{acik}" '
            f'stroke-width="{w * .28:.1f}" stroke-linecap="round" stroke-opacity=".75"/>')


def ilmekler_svg():
    renk = {'Y': (SARI, '#FFE58A', '#9A6A00'), 'K': (SIYAH, '#6A6560', '#000000')}
    alt, ust = [], []
    for j, row in enumerate(DESEN):
        for i, ch in enumerate(row):
            if ch == '.':
                continue
            x0, y0 = delik_xy(i, j)
            x1, y1 = delik_xy(i + 1, j + 1)
            alt.append(ilmek_bacak(x0, y0, x1, y1, *renk[ch]))   # \  alt bacak
            ust.append(ilmek_bacak(x0, y1, x1, y0, *renk[ch]))   # /  üst bacak
    return ['<g filter="url(#iplik)">'] + alt + ust + ['</g>']


def svg(icerik, arkaplan=None):
    bg = f'<rect width="100%" height="100%" fill="{arkaplan}"/>' if arkaplan else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {GEN * S:.0f} {YUK * S:.0f}" '
            f'width="{GEN * S:.0f}" height="{YUK * S:.0f}">{DEFS}{bg}' + '\n'.join(icerik) + '</svg>')


open('levha_bos.svg', 'w').write(svg(plaka_svg()))
open('levha_ari_onizleme.svg', 'w').write(svg(plaka_svg() + ilmekler_svg(), '#F3EDE2'))

# ---------------- Desen şeması ----------------
c = 30
i0 = min(i for i, _, _, _ in delikler); i1 = max(i for i, _, _, _ in delikler)
j0 = min(j for _, j, _, _ in delikler); j1 = max(j for _, j, _, _ in delikler)
m = 70
gw, gh = round(2 * APOTEM * c / ADIM + 2 * m), round(2 * R_TEPE * c / ADIM + m + 110)
mevcut = {(a, b) for a, b, _, _ in delikler}
o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {gw} {gh}" width="{gw}" height="{gh}" '
     f'font-family="Nunito, Arial Rounded MT Bold, Arial, sans-serif">', '<rect width="100%" height="100%" fill="#FFFDF7"/>']
X = lambda i: m + (APOTEM + (i - DW / 2) * ADIM) * c / ADIM
Y = lambda j: m + (R_TEPE - (DH / 2 - j) * ADIM) * c / ADIM
for i in range(i0, i1):
    for j in range(j0, j1):
        if all((i + a, j + b) in mevcut for a in (0, 1) for b in (0, 1)):
            o.append(f'<rect x="{X(i)}" y="{Y(j)}" width="{c}" height="{c}" fill="none" stroke="#E4DCCB" stroke-width="1"/>')
for j, row in enumerate(DESEN):
    for i, ch in enumerate(row):
        if ch == '.':
            continue
        fill = SARI if ch == 'Y' else SIYAH
        o.append(f'<rect x="{X(i) + 1.5}" y="{Y(j) + 1.5}" width="{c - 3}" height="{c - 3}" rx="5" fill="{fill}"/>')
        o.append(f'<text x="{X(i) + c / 2}" y="{Y(j) + c * .68}" font-size="14" font-weight="700" text-anchor="middle" '
                 f'fill="{"#7A5300" if ch == "Y" else "#FFFFFF"}">{"A" if ch == "Y" else "S"}</text>')
for a, b, _, _ in delikler:
    o.append(f'<circle cx="{X(a)}" cy="{Y(b)}" r="3.2" fill="#B9AE99"/>')
# levha çerçevesi (mm -> şema koordinatı)
mm = lambda x, y: (X(x / ADIM + DW / 2), Y(DH / 2 - y / ADIM))
for ap, kr in ((APOTEM, KOSE_R), (APOTEM - KENAR_EN, max(KOSE_R - KENAR_EN, 1))):
    pts = altigen_kesit(ap, kr).to_polygons()[0]
    o.append('<path d="M' + ' L'.join('%.1f,%.1f' % mm(x, y) for x, y in pts) + ' Z" fill="none" stroke="#CFC4AE" stroke-width="2"/>')
ax, ay = mm(0, ASKI_Y)
o.append(f'<circle cx="{ax:.1f}" cy="{ay:.1f}" r="{ASKI_CAP / 2 / ADIM * c:.1f}" fill="none" stroke="#CFC4AE" stroke-width="2"/>')
ox = X(DW // 2)
o.append(f'<line x1="{ox}" y1="{ay + 30}" x2="{ox}" y2="{Y(j1) + 10}" stroke="#E07B39" stroke-width="2" stroke-dasharray="6 6" opacity=".8"/>')
o.append(f'<text x="{ox + 8}" y="{Y(j1) + 4}" font-size="14" fill="#E07B39">orta sıra: asma deliğinin tam altındaki delikler</text>')
ns = sum(r.count('Y') for r in DESEN); nk = sum(r.count('K') for r in DESEN)
yy = gh - 52
o.append(f'<rect x="{m}" y="{yy - 18}" width="24" height="24" rx="5" fill="{SARI}"/>'
         f'<text x="{m + 34}" y="{yy}" font-size="18" fill="#3A3226">A · Sarı — {ns} çarpı</text>')
o.append(f'<rect x="{m + 250}" y="{yy - 18}" width="24" height="24" rx="5" fill="{SIYAH}"/>'
         f'<text x="{m + 284}" y="{yy}" font-size="18" fill="#3A3226">S · Siyah — {nk} çarpı</text>')
o.append(f'<text x="{m}" y="{yy + 30}" font-size="14" fill="#8A7E68">Her kare, 4 delik arasına atılan bir çarpıdır (X). '
         f'Boş kareler levha rengi kalır: kanatların içi beyaz görünür.</text>')
o.append('</svg>')
open('ari_desen_semasi.svg', 'w').write('\n'.join(o))

print(f'altıgen: köşeden köşeye {2 * R_TEPE:.1f} mm, kenardan kenara {2 * APOTEM:.1f} mm; '
      f'{len(delikler)} delik; hacim {levha.volume() / 1000:.1f} cm³; sarı {ns}, siyah {nk}')
