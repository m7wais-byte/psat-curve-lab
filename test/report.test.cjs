const test = require('node:test');
const assert = require('node:assert/strict');
const { harness } = require('./harness.cjs');
const R = require('../public/report.js');
const { jsPDF } = require('jspdf');
function fixture() {
  const h = harness();
  h.demo();
  h.get('case').value = 'CURRENT-CASE';
  return { h, model: h.run('currentReport()') };
}
test('report snapshots current selections without changing the fitted case', () => {
  const { h, model } = fixture();
  const original = JSON.stringify(model);
  h.run('setGroup(0,"none")');
  assert.equal(JSON.stringify(model), original);
  assert.equal(h.run('currentReport().points[0].group'), 'none');
  const markup = R.svg(model);
  assert.equal((markup.match(/data-report-point=/g) || []).length, model.points.length);
  assert.equal(
    (markup.match(/data-group="none"/g) || []).length,
    model.points.filter((p) => p.group === 'none').length,
  );
  assert.match(markup, /Pb: 1,000.00 psig @ 35.000 cc/);
});
test('report HTML keeps separate summaries, actual metadata and safe script payloads', () => {
  const { model } = fixture();
  model.caseName = '</script><img src=x onerror=alert(1)>';
  model.phase = 'dew';
  model.pressureUnit = 'bar';
  model.pressureBasis = 'Absolute';
  const html = R.html(model, 'https://example.com/');
  assert.match(html, /Estimated dew-point pressure · Pd/);
  assert.match(html, /Quadratic curves/);
  assert.match(html, /Points used/);
  assert.match(html, /Volume at saturation/);
  assert.match(html, /Dew point/);
  assert.match(html, /bar a/);
  assert(!html.includes(model.caseName));
  assert.match(html, /\\u003c\/script>/);
  assert.equal((html.match(/<\/script>/g) || []).length, 3);
  assert(!html.includes('<\\/script>'));
});
test('current-case PDF is one A4 page with vector content and real values', () => {
  const { model } = fixture();
  const pdf = R.createPdf(model, jsPDF);
  assert.equal(pdf.getNumberOfPages(), 1);
  assert(Math.abs(pdf.internal.pageSize.getWidth() - 595.28) < 0.1);
  assert(Math.abs(pdf.internal.pageSize.getHeight() - 841.89) < 0.1);
  const data = pdf.output();
  assert.match(data, /CURRENT-CASE/);
  assert.match(data, /1,000.00/);
  assert(!data.includes('/Subtype /Image'));
  assert.throws(() => R.buildModel({ points: [], result: null }), /Fit both branches/);
  model.caseName = 'عينة';
  assert.throws(() => R.createPdf(model, jsPDF), /use Print/);
});
test('Print and PDF actions receive the latest edited case; unavailable without a fit', () => {
  const h = harness();
  assert(h.get('print').disabled);
  assert(h.get('savePdf').disabled);
  h.demo();
  assert(!h.get('print').disabled);
  assert(!h.get('savePdf').disabled);
  let printed, saved, options;
  h.context.PVReport.open = (m, o) => {
    printed = m;
    options = o;
    return {};
  };
  h.context.PVReport.save = (m) => {
    saved = m;
  };
  h.get('case').value = 'APP-REPORT';
  h.run('setGroup(0,"none")');
  h.get('print').onclick();
  h.get('savePdf').onclick();
  assert.equal(printed.caseName, 'APP-REPORT');
  assert.equal(printed.points[0].group, 'none');
  assert.equal(options.print, true);
  assert.equal(JSON.stringify(printed), JSON.stringify(saved));
});
test('print listener is attached after opening the report document', () => {
  const fs = require('node:fs');
  const vm = require('node:vm');
  const { model } = fixture();
  let listener,
    printed = false,
    written = '';
  const target = {
    print() {
      printed = true;
    },
    addEventListener(name, fn) {
      listener = fn;
    },
    document: {
      open() {
        listener = null;
      },
      write(s) {
        written = s;
      },
      close() {
        listener?.();
      },
    },
  };
  const window = { open: () => target, location: { href: 'https://example.com/' } };
  const context = { window };
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(require.resolve('../public/report.js'), 'utf8'),
    context,
  );
  window.PVReport.open(model, { print: true });
  assert(printed);
  assert.match(written, /CURRENT-CASE/);
});
test('round axis helpers give 1/1.5/2/2.5/3/4/5/6/8 × 10^k steps that cover the data', () => {
  const round = (step) =>
    [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8].some((s) => {
      const k = step / s / 10 ** Math.round(Math.log10(step / s));
      return Math.abs(k - 1) < 1e-9;
    });
  for (const [min, max, div] of [
    [32.82, 37.18, 9],
    [420, 4772, 5],
    [0, 0.0031, 8],
    [101325, 101990, 4],
  ]) {
    const a = R.niceAxis(min, max, div);
    assert(round(a.step), `round step ${a.step}`);
    assert(a.min <= min && a.max >= max && a.min >= 0);
    assert(Math.abs((a.max - a.min) / a.step - div) < 1e-9);
    assert(Math.abs(a.min / a.step - Math.round(a.min / a.step)) < 1e-9);
  }
  assert.equal(R.niceStep(0.5, 'below'), 0.4);
  assert.equal(R.niceStep(0.5, 'above'), 0.6);
});
test('report shows Pb/Pd, trend shape, points used and unit-appropriate pressure digits', () => {
  const { model } = fixture();
  assert.equal(R.label(model), 'Pb: 1,000.00 psig @ 35.000 cc');
  const data = R.createPdf(model, jsPDF).output();
  assert.match(data, /Estimated bubble-point pressure - Pb/);
  assert.match(data, /Quadratic curves/);
  assert.match(data, /21 of 21/);
  const mpa = { ...model, pressureUnit: 'MPa', intersection: { p: 6.894757, v: 35 } };
  assert.match(R.label(mpa), /^Pb: 6\.895 MPa g/);
  assert.match(R.label({ ...mpa, pressureUnit: 'kPa', phase: 'dew' }), /^Pd: 6\.9 kPa g/);
  const straight = { ...model, degree: 1 };
  assert.match(R.html(straight), /Straight lines/);
});
test('report graph ticks are round values', () => {
  const { model } = fixture();
  const ticks = [...R.svg(model).matchAll(/fill="#546e5c">([^<]+)</g)].map((m) =>
    Number(m[1].replace(/,/g, '')),
  );
  assert(ticks.length >= 10);
  for (const t of ticks)
    assert(Math.abs(t * 100 - Math.round(t * 100)) < 1e-6, String(t));
});
