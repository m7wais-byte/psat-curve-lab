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
  assert.equal(get('[data-result="pressure"]').innerHTML, '1,006.90<span>psi g</span>');
  assert.equal(get('[data-result="volume"]').innerHTML, '34.9975<span>cc</span>');
  assert(get('[data-report-plot]').innerHTML.includes('Psat: 1,006.90 psig @ 34.998 cc'));
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
  assert(pdf.includes('Psat: 1,006.90 psig @ 34.998 cc'));
  assert(pdf.includes('0.999991') && pdf.includes('0.998976'));
});
