const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const PV = require('../public/engine.js');

function sample() {
  return PV.parse(
    fs.readFileSync(path.join(__dirname, '../examples/curved-demo.csv'), 'utf8'),
  ).points.map((p) => ({
    ...p,
    group: p.v < 34.7 ? 'high' : p.v > 35.3 ? 'low' : 'none',
  }));
}
function branches(high, low) {
  return [
    ...[1, 1.2, 1.4, 1.6].map((v) => ({ v, p: high(v), group: 'high' })),
    ...[2.4, 2.6, 2.8, 3].map((v) => ({ v, p: low(v), group: 'low' })),
  ].map((p, id) => ({ ...p, id }));
}

test('the two quadratic branches meet at the known synthetic crossing', () => {
  const result = PV.analyze(sample(), 2);
  assert(Math.abs(result.intersection.v - 35) < 1e-6);
  assert(Math.abs(result.intersection.p - 1000) < 1e-6);
  assert.equal(result.omitted, 3);
  assert(result.high.rmse < 1e-7);
  assert(result.low.rmse < 1e-7);
});

test('neither-fit points have no effect even when their pressure changes substantially', () => {
  const original = PV.analyze(sample(), 2);
  const changed = PV.analyze(
    sample().map((p) => ({ ...p, p: p.group === 'none' ? p.p + 9000 : p.p })),
    2,
  );
  assert.deepEqual(changed.intersection, original.intersection);
});

test('input acquisition order does not change the fitted crossing', () => {
  const a = PV.analyze(sample().reverse(), 2).intersection;
  const b = PV.analyze(sample(), 2).intersection;
  assert(Math.abs(a.v - b.v) < 1e-9);
  assert(Math.abs(a.p - b.p) < 1e-6);
});

test('automatic suggestion finds the synthetic crossing and preserves IDs', () => {
  const points = sample();
  const assigned = PV.autoAssign(points, 2);
  const result = PV.analyze(assigned, 2);
  assert(Math.abs(result.intersection.v - 35) < 0.1);
  assert.deepEqual(
    assigned.map((p) => p.id),
    points.map((p) => p.id),
  );
});

test('zero pressure is parseable but left for individual review by automatic selection', () => {
  assert.equal(PV.parse('0,12').errors.length, 0);
  const assigned = PV.autoAssign(
    [...sample(), { id: 99, p: 0, v: 34, group: 'none' }],
    2,
  );
  assert.equal(assigned.find((p) => p.id === 99).group, 'none');
});

test('straight branches have a known crossing without a quadratic coefficient', () => {
  const result = PV.analyze(
    branches(
      (v) => 1000 - 500 * (v - 2),
      (v) => 1000 - 100 * (v - 2),
    ),
    1,
  );
  assert(Math.abs(result.intersection.v - 2) < 1e-8);
  assert(Math.abs(result.intersection.p - 1000) < 1e-8);
  assert.equal(result.high.coeff.length, 2);
});

test('parallel trends do not produce a forced crossing', () => {
  const result = PV.analyze(
    branches(
      (v) => 2000 - 100 * v,
      (v) => 1900 - 100 * v,
    ),
    1,
  );
  assert.equal(result.intersection, null);
  assert.match(result.warning, /do not intersect/);
});

test('multiple nearby crossings are unresolved', () => {
  const result = PV.analyze(
    branches(
      (v) => 2000 - 300 * v + 10 * (v - 1.9) * (v - 2.1),
      (v) => 2000 - 300 * v,
    ),
    2,
  );
  assert.equal(result.intersection, null);
  assert.match(result.warning, /Multiple/);
});

test('a distant crossing is not reported as a nearby saturation estimate', () => {
  const result = PV.analyze(
    branches(
      (v) => 3000 - 200 * (v - 10),
      (v) => 3000 - 100 * (v - 10),
    ),
    1,
  );
  assert.equal(result.intersection, null);
});

test('nearly parallel trends retain a sensitivity warning', () => {
  const result = PV.analyze(
    branches(
      (v) => 1000 - 100 * (v - 2),
      (v) => 1000 - 101 * (v - 2),
    ),
    1,
  );
  assert(result.intersection);
  assert.match(result.warning, /Nearly parallel/);
});

test('a reversing/increasing fitted branch is not accepted', () => {
  const result = PV.analyze(
    branches(
      (v) => 1000 - 100 * (v - 2),
      (v) => 1000 + 50 * (v - 2),
    ),
    1,
  );
  assert.equal(result.intersection, null);
  assert.match(result.warning, /reverses/);
});

test('missing selections, overlapping ranges and degenerate volume spans are rejected', () => {
  assert.throws(
    () => PV.analyze(sample().map((p) => ({ ...p, group: 'none' }))),
    /Assign points/,
  );
  assert.throws(
    () => PV.analyze(sample().map((p) => ({ ...p, group: p.id % 2 ? 'high' : 'low' }))),
    /ranges separate/,
  );
  assert.throws(
    () => PV.analyze(sample().map((p) => ({ ...p, v: 35 }))),
    /Volumes must span/,
  );
  assert.throws(() => PV.analyze(sample().slice(0, 3)), /at least/);
});

test('parser accepts the supported separators and reports malformed/nonfinite values', () => {
  for (const separator of [',', ';', '\t', ' ']) {
    const parsed = PV.parse(
      `Pressure${separator}Volume\n1e3${separator}33.4\n900${separator}33.6`,
    );
    assert.equal(parsed.errors.length, 0);
    assert.equal(parsed.points.length, 2);
  }
  for (const row of ['100,bad', 'Infinity,12', '100,0', '-1,12', '100,12,13']) {
    assert.equal(PV.parse(row).errors.length, 1, row);
  }
  assert(
    PV.parse(Array.from({ length: 501 }, (_, i) => `${i + 1},12`).join('\n')).errors
      .length > 0,
  );
});

test('constant-pressure branch has undefined R²', () => {
  const fitted = PV.fit(
    [1, 2, 3, 4].map((v) => ({ v, p: 1000 })),
    2,
    1,
    3,
  );
  assert.equal(fitted.r2, null);
});
