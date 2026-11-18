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
  assert.match(markup, /Psat: 1,000.00 psig @ 35.000 cc/);
});
test('report HTML keeps separate summaries, actual metadata and safe script payloads', () => {
  const { model } = fixture();
  model.caseName = '</script><img src=x onerror=alert(1)>';
  model.phase = 'dew';
  model.pressureUnit = 'bar';
  model.pressureBasis = 'Absolute';
  const html = R.html(model, 'https://example.com/');
  assert.match(html, /Estimated saturation pressure/);
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

test('overview and magnified detail preserve measurements, coefficients and result values', () => {
  const { h, model } = fixture();
  const before = JSON.stringify(model),
    B = R.detailBounds(model);
  assert(B.vmin < model.intersection.v && B.vmax > model.intersection.v);
  assert(B.pmin < model.intersection.p && B.pmax > model.intersection.p);
  const svg = R.svg(model);
  assert.match(svg, /Intersection detail/);
  assert.match(svg, /zoomed pressure and volume axes/);
  assert.equal((svg.match(/data-report-point=/g) || []).length, model.points.length);
  assert.match(svg, /data-detail-point=/);
  assert(!/NaN|Infinity/.test(svg));
  assert.equal(JSON.stringify(model), before);
  assert.match(h.get('chart').innerHTML, /data-fit-detail="true"/);
  assert.match(h.get('chart').innerHTML, /zoomed axes/);
  const pdf = R.createPdf(model, jsPDF);
  assert.equal(pdf.getNumberOfPages(), 1);
  assert.match(pdf.output(), /Intersection detail - zoomed axes/);
  assert(!pdf.output().includes('/Subtype /Image'));
});

test('PDF clipping preserves continuous colored paths for both fitted branches', () => {
  const frame = { left: 0, right: 10, top: 0, bottom: 10 };
  const paths = R.clippedPaths(
    [
      [-5, 5],
      [5, 5],
      [15, 5],
    ],
    frame,
  );
  assert.equal(paths.length, 1);
  assert.equal(paths[0].length, 3);
  for (const op of paths[0])
    assert(op.c[0] >= 0 && op.c[0] <= 10 && op.c[1] >= 0 && op.c[1] <= 10);
  assert.deepEqual(
    R.clippedPaths(
      [
        [-5, -5],
        [-1, -1],
      ],
      frame,
    ),
    [],
  );
  const { model } = fixture(),
    strokes = [];
  function Recorder(options) {
    const doc = new jsPDF(options);
    let color;
    const set = doc.setDrawColor.bind(doc),
      path = doc.path.bind(doc);
    doc.setDrawColor = (value, ...args) => {
      color = value;
      return set(value, ...args);
    };
    doc.path = (ops) => {
      if (ops.length > 3 && ops.every((p) => p.op === 'm' || p.op === 'l'))
        strokes.push({ color, ops });
      return path(ops);
    };
    return doc;
  }
  const pdf = R.createPdf(model, Recorder);
  assert(strokes.some((p) => p.color === '#0f766e'));
  assert(strokes.some((p) => p.color === '#c05a13'));
  for (const p of strokes) for (const op of p.ops) assert(op.c.every(Number.isFinite));
  assert.equal(pdf.getNumberOfPages(), 1);
});
