const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const PVReport = require('../public/report.js');
const { build, EXAMPLE } = require('../scripts/generate-report-preview.cjs');

const read = (name) => fs.readFileSync(path.join(__dirname, '../public', name));
const html = read('report-preview.html').toString('utf8');

test('committed preview files match the live report code (run npm run preview after report changes)', () => {
  const fresh = build();
  assert.equal(html, fresh.html, 'report-preview.html is stale');
  assert(read('report-preview.pdf').equals(fresh.pdf), 'report-preview.pdf is stale');
});

test('preview model is the engine fit of the fixed example, including excluded points', () => {
  const { model } = build();
  assert.equal(model.points.length, EXAMPLE.length);
  assert.equal(model.points.filter((p) => p.group === 'none').length, 3);
  assert.equal(PVReport.label(model), 'Pb: 1,006.90 psig @ 34.998 cc');
  assert.equal(model.high.rSquared.toFixed(6), '0.999991');
  assert.equal(model.low.rSquared.toFixed(6), '0.998976');
  assert(model.syntheticDemo, 'example data is labelled as example data');
  assert.equal(model.yCheck.pb.toFixed(2), '1013.00');
});

test('preview HTML is the live A4 report with overview, detail panel and Y-function check', () => {
  assert.match(html, /EXAMPLE DATA/);
  assert.match(html, /Estimated bubble-point pressure · Pb/);
  assert.match(html, /Quadratic curves/);
  assert.match(html, /18 of 21/);
  assert.match(html, /Y-function check · bubble point/);
  assert.match(html, /Most-linear Pb 1,013.00 psig/);
  assert.match(html, /<script src="report\.js\?v=\d+"><\/script>/);
  // The page draws its graph with PVReport.svg; check that drawing at both layouts.
  const { model } = build();
  for (const width of [320, 608]) {
    const svg = PVReport.svg(model, width);
    assert.equal((svg.match(/data-report-point=/g) || []).length, 21);
    assert.equal(
      (svg.match(/data-report-point="\d+" data-group="none"/g) || []).length,
      3,
    );
    assert.match(svg, /data-fit-detail="true"/);
    assert.match(svg, /data-detail-point=/);
    assert(!/NaN|Infinity/.test(svg));
  }
});

test('preview PDF is one vector A4 page with the detail panel and Y-function check', () => {
  const pdf = read('report-preview.pdf').toString('latin1');
  assert(pdf.startsWith('%PDF-'));
  assert(/\/Count\s+1\b/.test(pdf));
  assert(/\/MediaBox \[0 0 595\.2\d* 841\.8\d*\]/.test(pdf), 'A4 page');
  assert(!pdf.includes('/Subtype /Image'));
  for (const text of [
    'Estimated bubble-point pressure - Pb',
    'Pb: 1,006.90 psig @ 34.998 cc',
    'Intersection detail - zoomed axes',
    'Y-function check - bubble point',
    'Most-linear Pb 1,013.00 psig',
    '0.999991',
    '0.998976',
  ])
    assert(pdf.includes(text), text);
});
