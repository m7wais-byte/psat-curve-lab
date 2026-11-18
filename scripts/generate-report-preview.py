"""Generate the fixed example preview as a vector A4 PDF (development only).

Install requirements-report.txt, then run this script after editing the preview.
This does not generate live user reports; report-preview.html contains example data.
"""
from pathlib import Path
import json
import math
import subprocess

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import simpleSplit
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
node = r"""
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(process.argv[1],'utf8');
const match=source.match(/const data = ([\s\S]*?);\s*const plot/);
if(!match)throw new Error('Cannot locate preview example data');
console.log(vm.runInNewContext('JSON.stringify('+match[1]+')'));
"""
data = json.loads(subprocess.check_output(
    ['node', '-e', node, str(ROOT / 'public/report-preview.html')], text=True
))
OUTPUT = ROOT / 'public/report-preview.pdf'
W, H = A4
M = 36
INK = '#223b35'
QUIET = '#66796f'
HIGH = '#0f766e'
LOW = '#c97725'
RULE = '#d8e3dc'
c = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=0, invariant=1)
c.setTitle('VAPS A4 report preview - example values')
c.setAuthor('Psat Curve Lab')


def text(x, y, value, size=10, color=INK, align='left', bold=False):
    c.setFillColor(HexColor(color))
    c.setFont('Helvetica-Bold' if bold else 'Helvetica', size)
    if align == 'right':
        c.drawRightString(x, y, value)
    elif align == 'center':
        c.drawCentredString(x, y, value)
    else:
        c.drawString(x, y, value)


def line(x1, y1, x2, y2, color=RULE, width=0.6):
    c.setStrokeColor(HexColor(color))
    c.setLineWidth(width)
    c.line(x1, y1, x2, y2)


def logo(x, top, width):
    c.saveState()
    c.translate(x, top)
    c.scale(width / 200, -width / 200)
    p = c.beginPath()
    p.moveTo(7, 8)
    p.curveTo(33, 5, 47, 12, 54, 35)
    p.lineTo(69, 85)
    p.lineTo(111, 30)
    p.lineTo(61, 109)
    p.lineTo(39, 50)
    p.curveTo(31, 25, 25, 12, 7, 8)
    p.close()
    c.setFillColor(HexColor('#2d7db8'))
    c.drawPath(p, fill=1, stroke=0)
    line(62, 104, 112, 28, '#2d7db8', 1.6)
    line(66, 108, 116, 30, '#25ad68', 2.1)
    c.saveState()
    c.translate(31, 49)
    c.setFillColor(HexColor('#ffffff'))
    c.circle(0, 0, 16, stroke=0, fill=1)
    for angle in range(0, 360, 30):
        c.saveState()
        c.rotate(angle)
        c.setFillColor(HexColor('#2d7db8'))
        c.rect(-1.8, -16.1, 3.6, 5.5, fill=1, stroke=0)
        c.restoreState()
    c.setFillColor(HexColor('#ffffff'))
    c.setStrokeColor(HexColor('#2d7db8'))
    c.setLineWidth(2.1)
    c.circle(0, 0, 12.2, stroke=1, fill=1)
    c.setFillColor(HexColor('#28bf74'))
    c.circle(0, 0, 8.7, stroke=0, fill=1)
    c.restoreState()
    c.translate(94, 85)
    c.scale(1, -1)
    text(0, 0, 'APS', size=38, color='#2d7db8', bold=True)
    c.restoreState()


logo(M, H-M, 105)
text(W-M, H-44, 'Saturation pressure report', 17, align='right')
text(W-M, H-62, 'Final pressure-volume plot', 10, QUIET, 'right')
text(W-M, H-80, 'PREVIEW - EXAMPLE VALUES', 9, '#927039', 'right')
line(M, H-108, W-M, H-108, HIGH, 1.3)
rows = [
    ('Sample / case', 'Example sample 01', 'Date', '18 Nov 2026'),
    ('Test type', 'Bubble point', 'Temperature', 'Not recorded'),
    ('Pressure unit', 'psig', 'Volume unit', 'cc'),
    ('Trend shape', 'Quadratic curves', 'Points used', f"{data['used']} of {data['used'] + data['excluded']}"),
]
OFF = 21  # the fourth details row moves everything below it down, as in the live PDF
mid = W/2 + 10
for i, (a, b, d, e) in enumerate(rows):
    y = H-134-i*21
    text(M, y, a, 9, QUIET)
    text(mid-24, y, b, 9, align='right')
    text(mid, y, d, 9, QUIET)
    text(W-M, y, e, 9, align='right')
    line(M, y-7, mid-24, y-7, '#edf1ed', .4)
    line(mid, y-7, W-M, y-7, '#edf1ed', .4)
line(M, H-199-OFF, W-M, H-199-OFF)
text(M, H-217-OFF, 'Estimated bubble-point pressure - Pb', 9, QUIET)
text(mid, H-217-OFF, 'Volume at saturation - Vsat', 9, QUIET)
# Units follow the printed number, as in the live PDF.
psat_text, vsat_text = f"{data['psat']:,.2f}", f"{data['vsat']:.4f}"
text(M, H-247-OFF, psat_text, 25)
text(M+c.stringWidth(psat_text, 'Helvetica', 25)+6, H-247-OFF, 'psig', 10, QUIET)
text(mid, H-247-OFF, vsat_text, 25)
text(mid+c.stringWidth(vsat_text, 'Helvetica', 25)+6, H-247-OFF, 'cc', 10, QUIET)
line(M, H-263-OFF, W-M, H-263-OFF)
text(M, H-285-OFF, 'Pressure-volume graph', 11)
text(W-M, H-285-OFF, f"{data['used']} points used - {data['excluded']} excluded", 9, QUIET, 'right')
left, right, top = M+45, W-M-3, H-309-OFF
cell = (right-left)/8
bottom = top-cell*4


def nice_axis(lo, hi, divisions):
    """Same round-step rule as PVReport.niceAxis: 1/1.5/2/2.5/3/4/5/6/8 x 10^k."""
    raw = (hi-lo)/divisions
    e = math.floor(math.log10(raw))
    for k in range(e-1, e+3):
        for base in (1, 1.5, 2, 2.5, 3, 4, 5, 6, 8):
            step = float(f'{base*10**k:.12g}')
            if step < raw*(1-1e-9):
                continue
            start = max(0.0, float(f'{math.floor(lo/step+1e-9)*step:.12g}'))
            end = float(f'{start+divisions*step:.12g}')
            if end >= hi-1e-9*step:
                return start, end, step
    raise ValueError('no axis')


volumes = [p['v'] for p in data['points']] + [data['vsat']]
pressures = [p['p'] for p in data['points']] + [data['psat']]
vspan, pspan = max(volumes)-min(volumes), max(pressures)-min(pressures)
X0, X1, XS = nice_axis(max(0, min(volumes)-vspan*.045), max(volumes)+vspan*.045, 8)
Y0, Y1, YS = nice_axis(max(0, min(pressures)-pspan*.07), max(pressures)+pspan*.1, 4)
xp = lambda v: left+(v-X0)/(X1-X0)*(right-left)
yp = lambda p: bottom+(p-Y0)/(Y1-Y0)*(top-bottom)
tick = lambda v: f'{v:,.2f}'.rstrip('0').rstrip('.')
for i in range(41):
    x = left+i*cell/5
    line(x, bottom, x, top, '#cedbd3' if i%5 == 0 else '#eef3ef', .55 if i%5 == 0 else .3)
for i in range(21):
    y = bottom+i*cell/5
    line(left, y, right, y, '#cedbd3' if i%5 == 0 else '#eef3ef', .55 if i%5 == 0 else .3)
for i in range(9):
    text(left+i*cell, bottom-15, tick(X0+XS*i), 8, '#546e5c', 'center')
for i in range(5):
    text(left-8, bottom+i*cell-3, tick(Y0+YS*i), 8, '#546e5c', 'right')
text((left+right)/2, bottom-32, 'Volume (cc)', 9, '#344f3d', 'center')
c.saveState()
c.translate(M+4, (bottom+top)/2)
c.rotate(90)
text(0, 0, 'Pressure (psig)', 9, '#344f3d', 'center')
c.restoreState()


def predict(f, v):
    z = (v-data['origin'])/data['scale']
    return sum(coef*z**i for i, coef in enumerate(f['coef']))


def curve(f, start, end, color, dashed=False):
    c.setStrokeColor(HexColor(color))
    c.setLineWidth(1.35)
    c.setDash([4, 3] if dashed else [])
    p = c.beginPath()
    for i in range(101):
        v = start+(end-start)*i/100
        if i == 0:
            p.moveTo(xp(v), yp(predict(f, v)))
        else:
            p.lineTo(xp(v), yp(predict(f, v)))
    c.drawPath(p, fill=0, stroke=1)
    c.setDash([])


c.saveState()
clip = c.beginPath()
clip.rect(left, bottom, right-left, top-bottom)
c.clipPath(clip, stroke=0, fill=0)
curve(data['high'], data['high']['min'], data['high']['max'], HIGH)
curve(data['high'], data['high']['max'], data['vsat'], HIGH, True)
curve(data['low'], data['low']['min'], data['low']['max'], LOW)
curve(data['low'], data['vsat'], data['low']['min'], LOW, True)
c.setDash([2, 3])
line(left, yp(data['psat']), xp(data['vsat']), yp(data['psat']), '#6b8272', .65)
line(xp(data['vsat']), bottom, xp(data['vsat']), yp(data['psat']), '#6b8272', .65)
c.setDash([])
for point in data['points']:
    color = HIGH if point['group']=='high' else LOW if point['group']=='low' else '#8b9790'
    c.setStrokeColor(HexColor(color))
    c.setFillColor(HexColor('#ffffff'))
    c.setLineWidth(.9)
    c.circle(xp(point['v']), yp(point['p']), 2.5, stroke=1, fill=1)
c.setStrokeColor(HexColor(INK))
c.setLineWidth(1.2)
c.circle(xp(data['vsat']), yp(data['psat']), 3.5, stroke=1, fill=1)
c.restoreState()
text(right-4, yp(data['psat'])+16, f"Pb: {data['psat']:,.2f} psig @ {data['vsat']:.3f} cc", 9, INK, 'right')
legend_y = bottom-51
for x, name, color in [(M+18,'High-pressure fit',HIGH),(M+146,'Low-pressure fit',LOW),(M+271,'Extended trend','#7e8d84')]:
    c.setDash([3,2] if name=='Extended trend' else [])
    line(x, legend_y+2, x+15, legend_y+2, color, 1.2)
    c.setDash([])
    text(x+20, legend_y-1, name, 8, QUIET)
c.setStrokeColor(HexColor('#8b9790'))
c.setFillColor(HexColor('#ffffff'))
c.circle(W-M-92, legend_y+2, 2.5, stroke=1, fill=1)
text(W-M-84, legend_y-1, 'Excluded points', 8, QUIET)
line(M, bottom-70, W-M, bottom-70)
text(M, bottom-91, 'High-pressure fit', 10)
text(mid, bottom-91, 'Low-pressure fit', 10)
text(M, bottom-116, f"R² = {data['high']['r2']:.6f}", 17)
text(mid, bottom-116, f"R² = {data['low']['r2']:.6f}", 17)
# Y-function cross-check: values are engine results stored in the preview data.
yc = data['yCheck']
diff = yc['pb']-data['psat']
sign = '+' if diff >= 0 else '-'
y_lines = [
    (f"Most-linear Pb {yc['pb']:,.2f} psig (Vb {yc['vb']:.4f} cc); difference from the graphical Pb "
     f"{sign}{abs(diff):,.2f} psig ({sign}{100*abs(diff)/data['psat']:.2f}%).", INK),
    (f"Y line scatter {100*yc['relativeRmse']:.2f}% at the most-linear Pb; "
     f"{100*yc['graphicalRelativeRmse']:.2f}% at the graphical Pb.", INK),
    ('Cross-check only; the reported Pb is the graphical intersection. Gauge readings converted '
     f"with one standard atmosphere ({yc['atmosphere']} psi).", QUIET),
]
line(M, bottom-132, W-M, bottom-132)
text(M, bottom-149, 'Y-function check - bubble point', 10)
ty = bottom-164
for value, color in y_lines:
    for part in simpleSplit(value, 'Helvetica', 8.5, W-2*M):
        text(M, ty, part, 8.5, color)
        ty -= 10.5
assert ty > 63+6, 'Y-function section overlaps the footer'
line(M, 63, W-M, 63)
text(M, 48, 'Excluded points shown; not used in either fit', 8, QUIET)
text(W-M, 48, 'A4 portrait - Page 1 of 1', 8, QUIET, 'right')
c.showPage()
c.save()
print(f'Created {OUTPUT.name}: vector logo and plot; all {len(data["points"])} points included.')
