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

test('pointer wheel zoom keeps the chosen data location fixed and does not intercept page scrolling', () => {
  const h = harness();
  h.demo();
  const before = bounds(h),
    state = fingerprint(h);
  let prevented = false;
  const event = {
    clientX: 810,
    clientY: 440,
    deltaY: -200,
    deltaMode: 0,
    preventDefault() {
      prevented = true;
    },
  };
  h.get('chart').onwheel(event);
  assert(!prevented);
  assert.deepEqual(bounds(h), before);
  h.get('panGraph').onclick();
  h.get('chart').onwheel(event);
  assert(prevented);
  const after = bounds(h);
  assert(
    Math.abs(
      before.vmin +
        0.8 * (before.vmax - before.vmin) -
        (after.vmin + 0.8 * (after.vmax - after.vmin)),
    ) < 1e-9,
  );
  assert(
    Math.abs(
      before.pmax -
        0.8 * (before.pmax - before.pmin) -
        (after.pmax - 0.8 * (after.pmax - after.pmin)),
    ) < 1e-8,
  );
  assert.equal(fingerprint(h), state);
});
test('dragging pans the viewport without reassigning points and Fit all recovers the graph', () => {
  const h = harness();
  h.demo();
  h.get('zoomIn').onclick();
  h.get('panGraph').onclick();
  const B = bounds(h),
    state = fingerprint(h),
    event = { button: 0, pointerId: 1, clientX: 540, clientY: 290, preventDefault() {} };
  h.get('chart').onpointerdown(event);
  h.get('chart').onpointerdown({ ...event, pointerId: 2 });
  h.get('chart').onpointermove({ ...event, clientX: 630, clientY: 340 });
  const after = bounds(h);
  assert(after.vmin < B.vmin);
  assert(after.pmin > B.pmin);
  h.get('chart').pointElements[0]?.onclick();
  assert.equal(fingerprint(h), state);
  h.get('chart').onpointerup(event);
  h.get('recoverScale').onclick();
  assert.equal(h.get('scaleMode').textContent, 'Automatic');
  assert.equal(fingerprint(h), state);
});
test('repeated button zoom retains the intersection, is bounded, and double-click restores overview', () => {
  const h = harness();
  h.demo();
  const initial = bounds(h),
    state = fingerprint(h);
  for (let i = 0; i < 70; i++) h.get('zoomIn').onclick();
  const B = bounds(h),
    C = h.run('result.intersection');
  assert(B.vmin <= C.v && B.vmax >= C.v && B.pmin <= C.p && B.pmax >= C.p);
  assert(B.vmax - B.vmin >= ((initial.vmax - initial.vmin) / 1e6) * 0.999);
  assert(!h.get('chart').innerHTML.includes('NaN'));
  h.get('chart').ondblclick({ clientX: 540, clientY: 290, preventDefault() {} });
  assert.deepEqual(bounds(h), initial);
  assert.equal(fingerprint(h), state);
});

test('automatic, zoomed and focused views keep round tick values on the grid', () => {
  const h = harness();
  h.demo();
  const ticks = () =>
    [...h.get('chart').innerHTML.matchAll(/fill="#46596e">([^<]+)</g)].map((m) =>
      Number(m[1].replace(/,/g, '')),
    );
  const isRound = (values) => {
    const step = values[1] - values[0];
    return h.run(`PVReport.niceStep(${step})`) === Number(step.toPrecision(12));
  };
  const check = () => {
    const all = ticks(),
      x = all.slice(0, 10),
      y = all.slice(10);
    assert.equal(x.length, 10);
    assert.equal(y.length, 6);
    assert(isRound(x), `x ticks ${x}`);
    assert(isRound(y), `y ticks ${y}`);
  };
  check();
  h.get('zoomIn').onclick();
  check();
  h.get('zoomOut').onclick();
  h.get('zoomOut').onclick();
  check();
  h.get('focusScale').onclick();
  check();
  const b = bounds(h);
  assert(b.vmin < 35 && b.vmax > 35 && b.pmin < 1000 && b.pmax > 1000);
});
