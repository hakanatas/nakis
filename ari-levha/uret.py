"""Arı nakış levhası: STL (3D baskı) + SVG önizleme üretir. Sadece standart Python."""
import math, struct

# ---- Parametreler (mm) ----
ADIM = 5.0          # delikler arası mesafe
DELIK_CAP = 3.2     # delik çapı
KALINLIK = 2.4      # levha kalınlığı
DELIK_X, DELIK_Y = 29, 23   # delik sayısı -> 28 x 22 ilmek karesi
KENAR = 2           # deliksiz kenar (hücre sayısı, 1 hücre = ADIM)
N = 16              # delik çemberinin kenar sayısı (4'ün katı olmalı)

DESEN = [s.rstrip('\n') for s in open('ari_desen.txt') if s.strip()]
DH, DW = len(DESEN), len(DESEN[0])
OX = (DELIK_X - 1 - DW) // 2   # deseni ortala (ilmek karesi koordinatı)
OY = (DELIK_Y - 1 - DH) // 2
SARI, SIYAH = '#F6C21C', '#1E1E1E'

CX, CY = DELIK_X + 2 * KENAR, DELIK_Y + 2 * KENAR   # toplam hücre sayısı
W, H = CX * ADIM, CY * ADIM

def delikli(i, j):
    return KENAR <= i < KENAR + DELIK_X and KENAR <= j < KENAR + DELIK_Y

# ---- STL ----
h = ADIM / 2
angs = [2 * math.pi * k / N for k in range(N)]
def kare_nokta(a):  # merkezden a açısıyla çıkan ışının kare kenarına değdiği nokta
    c, s = math.cos(a), math.sin(a)
    m = max(abs(c), abs(s))
    return h * c / m, h * s / m

tris = []
def tri(a, b, c): tris.append((a, b, c))
def quad(a, b, c, d): tri(a, b, c); tri(a, c, d)

r = DELIK_CAP / 2
for i in range(CX):
    for j in range(CY):
        mx, my = (i + .5) * ADIM, (j + .5) * ADIM
        sq = [(mx + x, my + y) for x, y in map(kare_nokta, angs)]
        for z, up in ((KALINLIK, True), (0.0, False)):
            if delikli(i, j):
                ci = [(mx + r * math.cos(a), my + r * math.sin(a)) for a in angs]
                for k in range(N):
                    k2 = (k + 1) % N
                    if up: quad((*ci[k], z), (*sq[k], z), (*sq[k2], z), (*ci[k2], z))
                    else:  quad((*ci[k], z), (*ci[k2], z), (*sq[k2], z), (*sq[k], z))
            else:
                c = (mx, my, z)
                for k in range(N):
                    k2 = (k + 1) % N
                    if up: tri(c, (*sq[k], z), (*sq[k2], z))
                    else:  tri(c, (*sq[k2], z), (*sq[k], z))
        if delikli(i, j):  # delik iç duvarı
            ci = [(mx + r * math.cos(a), my + r * math.sin(a)) for a in angs]
            for k in range(N):
                k2 = (k + 1) % N
                quad((*ci[k2], 0), (*ci[k], 0), (*ci[k], KALINLIK), (*ci[k2], KALINLIK))
        # dış duvarlar (levha kenarındaki hücreler)
        for k in range(N):
            k2 = (k + 1) % N
            a, b = sq[k], sq[k2]
            dis = ((i == 0 and abs(a[0] - i * ADIM) < 1e-9 and abs(b[0] - i * ADIM) < 1e-9) or
                   (i == CX - 1 and abs(a[0] - W) < 1e-9 and abs(b[0] - W) < 1e-9) or
                   (j == 0 and abs(a[1]) < 1e-9 and abs(b[1]) < 1e-9) or
                   (j == CY - 1 and abs(a[1] - H) < 1e-9 and abs(b[1] - H) < 1e-9))
            if dis:
                quad((*a, 0), (*b, 0), (*b, KALINLIK), (*a, KALINLIK))

def normal(a, b, c):
    u = [b[t] - a[t] for t in range(3)]; v = [c[t] - a[t] for t in range(3)]
    n = (u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0])
    l = math.sqrt(sum(x*x for x in n)) or 1
    return tuple(x / l for x in n)

with open('ari_levha.stl', 'wb') as f:
    f.write(b'ari nakis levhasi'.ljust(80, b' '))
    f.write(struct.pack('<I', len(tris)))
    for t in tris:
        f.write(struct.pack('<3f', *normal(*t)))
        for p in t: f.write(struct.pack('<3f', *p))
        f.write(b'\0\0')

# ---- SVG yardımcıları ----
def delik_xy(hx, hy):  # delik (hx,hy) -> svg koordinatı (y aşağı)
    return (KENAR + hx + .5) * ADIM, (KENAR + hy + .5) * ADIM

def levha_svg(dikisli, olcek=4, baslik=''):
    s = olcek
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W*s} {H*s}" width="{W*s}" height="{H*s}">',
         '<defs><filter id="g" x="-5%" y="-5%" width="110%" height="110%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity=".35"/></filter></defs>',
         f'<rect x="0" y="0" width="{W*s}" height="{H*s}" rx="{3*s}" fill="#FFFFFF" stroke="#BDBDBD" stroke-width="2"/>']
    for hx in range(DELIK_X):
        for hy in range(DELIK_Y):
            x, y = delik_xy(hx, hy)
            o.append(f'<circle cx="{x*s:.1f}" cy="{y*s:.1f}" r="{r*s:.1f}" fill="#9E9E9E"/>')
    if dikisli:
        for ry, row in enumerate(DESEN):
            for rx, ch in enumerate(row):
                if ch == '.': continue
                renk = SARI if ch == 'Y' else SIYAH
                x0, y0 = delik_xy(OX + rx, OY + ry); x1, y1 = delik_xy(OX + rx + 1, OY + ry + 1)
                g = f'stroke="{renk}" stroke-width="{1.7*s:.1f}" stroke-linecap="round"'
                o.append(f'<g filter="url(#g)"><line x1="{x0*s:.1f}" y1="{y1*s:.1f}" x2="{x1*s:.1f}" y2="{y0*s:.1f}" {g}/>'
                         f'<line x1="{x0*s:.1f}" y1="{y0*s:.1f}" x2="{x1*s:.1f}" y2="{y1*s:.1f}" {g}/></g>')
    o.append('</svg>')
    return '\n'.join(o)

open('levha_bos.svg', 'w').write(levha_svg(False))
open('levha_ari_onizleme.svg', 'w').write(levha_svg(True))

# ---- Desen şeması (numaralı kareli) ----
c = 26; m = 40
gw, gh = DELIK_X - 1, DELIK_Y - 1
o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {gw*c+2*m} {gh*c+2*m+60}" width="{gw*c+2*m}" height="{gh*c+2*m+60}" font-family="Arial,sans-serif">',
     f'<rect width="100%" height="100%" fill="#fff"/>']
for ry, row in enumerate(DESEN):
    for rx, ch in enumerate(row):
        if ch == '.': continue
        x, y = m + (OX + rx) * c, m + (OY + ry) * c
        o.append(f'<rect x="{x}" y="{y}" width="{c}" height="{c}" fill="{SARI if ch=="Y" else SIYAH}"/>')
        if ch == 'K': o.append(f'<text x="{x+c/2}" y="{y+c*.7}" font-size="13" fill="#fff" text-anchor="middle">S</text>')
        else: o.append(f'<text x="{x+c/2}" y="{y+c*.7}" font-size="13" fill="#5a4500" text-anchor="middle">A</text>')
for k in range(gw + 1):
    w = 2 if k % 5 == 0 else .6
    o.append(f'<line x1="{m+k*c}" y1="{m}" x2="{m+k*c}" y2="{m+gh*c}" stroke="#777" stroke-width="{w}"/>')
for k in range(gh + 1):
    w = 2 if k % 5 == 0 else .6
    o.append(f'<line x1="{m}" y1="{m+k*c}" x2="{m+gw*c}" y2="{m+k*c}" stroke="#777" stroke-width="{w}"/>')
for k in range(0, gw + 1, 5):
    o.append(f'<text x="{m+k*c}" y="{m-10}" font-size="12" text-anchor="middle" fill="#444">{k}</text>')
for k in range(0, gh + 1, 5):
    o.append(f'<text x="{m-8}" y="{m+k*c+4}" font-size="12" text-anchor="end" fill="#444">{k}</text>')
ns = sum(r.count('Y') for r in DESEN); nk = sum(r.count('K') for r in DESEN)
yy = m + gh * c + 40
o.append(f'<rect x="{m}" y="{yy-16}" width="20" height="20" fill="{SARI}"/><text x="{m+28}" y="{yy}" font-size="16">A = Sarı: {ns} çarpı</text>')
o.append(f'<rect x="{m+250}" y="{yy-16}" width="20" height="20" fill="{SIYAH}"/><text x="{m+278}" y="{yy}" font-size="16">S = Siyah: {nk} çarpı</text>')
o.append(f'<text x="{m+gw*c}" y="{yy}" font-size="13" text-anchor="end" fill="#666">Her kare = 4 delik arasında bir çarpı (X)</text>')
o.append('</svg>')
open('ari_desen_semasi.svg', 'w').write('\n'.join(o))
print(f'levha {W:.0f} x {H:.0f} x {KALINLIK} mm, {DELIK_X*DELIK_Y} delik, {len(tris)} üçgen; sarı {ns}, siyah {nk}')
