const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(
  path.join(__dirname, '../public/report-preview.html'),
  'utf8',
);
function preview(width) {
  const elements = new Map();
  const get = (selector) => {
    if (!elements.has(selector))
      elements.set(selector, {
        innerHTML: '',
        textContent: '',
        getBoundingClientRect: () => ({ width }),
      });
    return elements.get(selector);
  };
  const context = { document: { getElementById: () => ({ querySelector: get }) } };
  vm.createContext(context);
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInContext(script, context);
  return get;
}
test('A4 preview shows all measurements including the three excluded points', () => {
  for (const width of [320, 608]) {
    const get = preview(width),
      svg = get('[data-report-plot]').innerHTML;
    assert.equal((svg.match(/data-point=/g) || []).length, 21);
    assert.equal((svg.match(/data-group="none"/g) || []).length, 3);
    assert.equal((svg.match(/<circle /g) || []).length, 22);
    assert(svg.includes('#8b9790'));
    assert(!svg.includes('NaN'));
    assert(svg.includes('Pressure (psig)') && svg.includes('Volume (cc)'));
  }
  assert(html.includes('Excluded points shown; not used in either fit'));
});
test('A4 preview keeps the separate top values and combines the graph annotation only', () => {
  const get = preview(608);
  assert.equal(get('[data-result="pressure"]').innerHTML, '1,006.90<span>psig</span>');
  assert.equal(get('[data-result="volume"]').innerHTML, '34.9975<span>cc</span>');
  assert(get('[data-report-plot]').innerHTML.includes('Pb: 1,006.90 psig @ 34.998 cc'));
  assert.equal(get('[data-r2="high"]').textContent, 'R² = 0.999991');
  assert.equal(get('[data-r2="low"]').textContent, 'R² = 0.998976');
  assert(html.indexOf('<div class="details">') < html.indexOf('data-result="pressure"'));
});

test('Print and Save as PDF are separate actions and the PDF is an A4 vector report', () => {
  assert(/id="printReport"[^>]*onclick="window.print\(\)"/.test(html));
  assert(/id="saveReportPdf"[\s\S]*?href="report-preview.pdf"/.test(html));
  assert(html.includes('download="VAPS-report-preview.pdf"'));
  assert(!html.includes('Print / Save as PDF'));
  const pdf = fs
    .readFileSync(path.join(__dirname, '../public/report-preview.pdf'))
    .toString('latin1');
  assert(pdf.startsWith('%PDF-'));
  assert(/\/Count\s+1\b/.test(pdf));
  assert(pdf.includes('595.2756') && pdf.includes('841.8898'));
  assert(!pdf.includes('/Subtype /Image'));
  assert(pdf.includes('Pb: 1,006.90 psig @ 34.998 cc'));
  assert(pdf.includes('Estimated bubble-point pressure - Pb'));
  assert(pdf.includes('Quadratic curves') && pdf.includes('18 of 21'));
  assert(pdf.includes('Y-function check - bubble point'));
  assert(pdf.includes('Most-linear Pb 1,013.00 psig'));
  assert(!pdf.includes('Psat:'));
  assert(pdf.includes('0.999991') && pdf.includes('0.998976'));
});

test('A4 preview matches live reports: Pb wording, trend rows, round ticks and Y-function check', () => {
  assert(html.includes('Estimated bubble-point pressure · Pb'));
  assert(!html.includes('Estimated saturation pressure'));
  assert(/Trend shape<\/span\s*><span class="value">Quadratic curves/.test(html));
  assert(/Points used<\/span><span class="value">18 of 21/.test(html));
  for (const width of [320, 608]) {
    const get = preview(width),
      ticks = [
        ...get('[data-report-plot]').innerHTML.matchAll(/fill="#546e5c">([^<]+)</g),
      ].map((m) => Number(m[1].replace(/,/g, '')));
    const steps = new Set(
      ticks.slice(1).map((t, i) => Number((t - ticks[i]).toPrecision(6))),
    );
    assert(ticks.length >= 10);
    for (const t of ticks)
      assert(Math.abs(t * 10 - Math.round(t * 10)) < 1e-9, `round tick ${t}`);
    assert(steps.size <= 3, 'one step per axis (plus the jump between axes)');
  }
  // The Y-function values come from the engine for this example data.
  const PV = require('../public/engine.js');
  const data = vm.runInNewContext(
    '(' + html.match(/const data = ([\s\S]*?);\s*const plot/)[1] + ')',
  );
  const y = PV.yFunction(data.points, PV.analyze(data.points, 2), 14.696);
  assert.equal(y.best.pb, data.yCheck.pb);
  assert.equal(y.best.vb, data.yCheck.vb);
  assert.equal(y.graphical.relativeRmse, data.yCheck.graphicalRelativeRmse);
  const get = preview(608);
  assert.equal(
    get('[data-y-line="0"]').textContent,
    'Most-linear Pb 1,013.00 psig (Vb 34.9931 cc); difference from the graphical Pb +6.10 psig (+0.61%).',
  );
  assert.equal(
    get('[data-y-line="1"]').textContent,
    'Y line scatter 1.52% at the most-linear Pb; 1.61% at the graphical Pb.',
  );
});
