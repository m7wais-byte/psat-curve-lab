const test = require('node:test');
const assert = require('node:assert/strict');
const { harness } = require('./harness.cjs');
const bounds = (h) => JSON.parse(h.run('JSON.stringify(viewBounds || autoBounds)'));
function fingerprint(h) {
  return h.run(
    'JSON.stringify({points,result:{intersection:result.intersection,high:result.high.coeff,low:result.low.coeff},history})',
  );
}

test('scale controls are unavailable before data is plotted', () => {
  const h = harness();
  assert(h.get('zoomIn').disabled);
  assert(h.get('applyScale').disabled);
  assert(h.get('focusScale').disabled);
});

test('zoom changes view ranges without changing fits, assignments, history or Psat', () => {
  const h = harness();
  h.demo();
  const initial = bounds(h),
    state = fingerprint(h),
    value = h.get('psat').innerHTML;
  h.get('zoomIn').onclick();
  const zoomed = bounds(h);
  assert(zoomed.vmax - zoomed.vmin < initial.vmax - initial.vmin);
  assert(zoomed.pmax - zoomed.pmin < initial.pmax - initial.pmin);
  assert.equal(h.get('psat').innerHTML, value);
  assert.equal(fingerprint(h), state);
  h.get('zoomOut').onclick();
  assert(bounds(h).vmax - bounds(h).vmin > zoomed.vmax - zoomed.vmin);
  assert.equal(fingerprint(h), state);
  h.get('autoScale').onclick();
  assert.deepEqual(bounds(h), initial);
  assert.equal(h.get('scaleMode').textContent, 'Automatic');
});

test('custom limits crop the chart and warn when the intersection is out of view', () => {
  const h = harness();
  h.demo();
  const state = fingerprint(h);
  h.get('vMin').value = '33';
  h.get('vMax').value = '34';
  h.get('pMin').value = '4200';
  h.get('pMax').value = '4500';
  h.get('applyScale').onclick();
  assert.deepEqual(bounds(h), { vmin: 33, vmax: 34, pmin: 4200, pmax: 4500 });
  assert.match(h.get('scaleStatus').textContent, /intersection is outside/);
  assert.match(h.get('scaleStatus').textContent, /All assigned points/);
  assert.equal(h.get('chart').pointElements.length, 1);
  assert(!h.get('chart').innerHTML.includes('Pb 1,000'));
  assert.match(h.get('chart').innerHTML, /<g clip-path="url\(#area\)">/);
  assert(!h.get('chart').innerHTML.includes('NaN'));
  assert.equal(fingerprint(h), state);
  h.get('focusScale').onclick();
  const focused = bounds(h);
  assert(focused.vmin < 35 && focused.vmax > 35);
  assert(focused.pmin < 1000 && focused.pmax > 1000);
  assert(!h.get('scaleStatus').textContent.includes('intersection is outside'));
  assert.equal(fingerprint(h), state);
});

test('invalid or blank limits preserve the current view', () => {
  const h = harness();
  h.demo();
  const initial = bounds(h);
  for (const [id, value] of [
    ['vMin', ''],
    ['vMin', '-1'],
    ['vMax', 'NaN'],
    ['pMax', '0'],
    ['vMax', '1e999'],
  ]) {
    h.get('autoScale').onclick();
    h.get(id).value = value;
    h.get('applyScale').onclick();
    assert(h.get('scaleError').textContent.length > 0);
    assert.deepEqual(bounds(h), initial);
  }
});

test('scale survives point edits and grid changes; new input restores automatic scaling', () => {
  const h = harness();
  h.demo();
  h.get('zoomIn').onclick();
  const view = bounds(h);
  h.run('setGroup(0, "none")');
  assert.deepEqual(bounds(h), view);
  h.get('grid').value = 'none';
  h.get('grid').onchange();
  assert.deepEqual(bounds(h), view);
  h.get('data').oninput();
  assert(h.get('zoomIn').disabled);
  h.get('load').onclick();
  assert.equal(h.get('scaleMode').textContent, 'Automatic');
});

test('export records the current axis bounds and mode', async () => {
  const h = harness();
  h.demo();
  h.get('zoomIn').onclick();
  const expected = bounds(h);
  h.get('export').onclick();
  const record = JSON.parse(await h.blobs.at(-1).text());
  assert.equal(record.graphView.mode, 'custom');
  assert.deepEqual(record.graphView.bounds, expected);
});
