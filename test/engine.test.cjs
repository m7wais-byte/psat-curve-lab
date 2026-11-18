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

function contaminated(noisy = false) {
  return Array.from({ length: 40 }, (_, id) => {
    const v = 1 + (4 * id) / 39,
      d = v - 3;
    let p = d < 0 ? 1000 - 500 * d + 30 * d * d : 1000 - 100 * d + 5 * d * d;
    if (noisy) p += Math.sin(id * 2.3) * 1.5;
    if (id === 8) p += 250;
    if (id === 32) p += 70;
    return { id, v, p, group: 'none' };
  });
}
test('auto fit excludes isolated off-trend readings in both branches and recovers known crossing', () => {
  const points = contaminated();
  const before = JSON.stringify(points);
  const selected = PV.autoAssign(points),
    r = PV.analyze(selected);
  assert.equal(selected[8].group, 'none');
  assert.equal(selected[32].group, 'none');
  assert(Math.abs(r.intersection.p - 1000) < 1e-6);
  assert(Math.abs(r.intersection.v - 3) < 1e-8);
  assert(r.high.r2 > 0.999999);
  assert(r.low.r2 > 0.999999);
  assert.equal(JSON.stringify(points), before);
  assert.equal(r.omitted, 2);
});
test('noisy auto fit improves both R² values without dropping most measurements', () => {
  const points = contaminated(true);
  const baseline = PV.analyze(
    points.map((p) => ({ ...p, group: p.v < 3 ? 'high' : 'low' })),
  );
  const selected = PV.autoAssign(points),
    r = PV.analyze(selected);
  assert(r.high.r2 > baseline.high.r2);
  assert(r.low.r2 > baseline.low.r2);
  assert(r.used >= Math.ceil(0.75 * points.length));
  assert(r.high.count >= 5 && r.low.count >= 5);
  assert(Math.abs(r.intersection.p - 1000) < 10);
  assert(r.high.r2 < 1 && r.low.r2 < 1);
  assert.deepEqual(PV.autoAssign([...points].reverse()).reverse(), selected);
  const scaled = PV.autoAssign(points.map((p) => ({ ...p, p: p.p * 0.01 })));
  assert.deepEqual(
    scaled.map((p) => p.group),
    selected.map((p) => p.group),
  );
});
test('automatic fitting rejects insufficient evidence and does not force parallel trends', () => {
  assert.throws(() => PV.autoAssign(contaminated().slice(0, 9), 2), /at least 10/);
  const parallel = Array.from({ length: 20 }, (_, id) => ({
    id,
    v: 1 + id / 10,
    p: 2000 - 100 * (1 + id / 10),
    group: 'none',
  }));
  assert.throws(() => PV.autoAssign(parallel, 1), /No supported deep fit/);
});
test('a crossing exactly at a selected end point is not reported as extrapolated', () => {
  // Same shape as the in-app Example: the break at V = 35 is itself a measurement.
  const points = Array.from({ length: 21 }, (_, id) => {
    const v = Number((33 + id * 0.2).toFixed(3)),
      d = v - 35,
      p = d < 0 ? 1000 - 1400 * d + 150 * d * d : 1000 - 190 * d + 15 * d * d;
    return { id, v, p: Number(p.toFixed(3)), group: v <= 35 ? 'high' : 'low' };
  });
  const r = PV.analyze(points, 2);
  assert(r.intersection);
  assert(Math.abs(r.intersection.v - 35) < 1e-9);
  assert(Math.abs(r.intersection.p - 1000) < 1e-6);
  assert.equal(r.warning, '');
});
test('an extrapolated, nearly parallel crossing reports both warnings', () => {
  // Slopes −100 and −97 differ by 3%; the crossing at V = 5.5 lies beyond the gap [4, 5]
  // but within the 8% span allowance.
  const line = (slope, volumes, group, start) =>
    volumes.map((v, i) => ({ id: start + i, v, p: 1000 + slope * (v - 5.5), group }));
  const r = PV.analyze(
    [...line(-100, [0, 1, 2, 3, 4], 'high', 0), ...line(-97, [5, 6, 7, 8, 9], 'low', 5)],
    1,
  );
  assert(Math.abs(r.intersection.v - 5.5) < 1e-9);
  assert.match(r.warning, /outside the gap/);
  assert.match(r.warning, /Nearly parallel/);
});
test('parse errors report the line number as pasted, including leading blank lines', () => {
  const { points, errors } = PV.parse('\n\n1000,30\nabc,1\r\n\r\n900,31,5');
  assert.equal(points.length, 1);
  assert.deepEqual(errors, [
    'Line 4: use two numbers, pressure then volume.',
    'Line 6: use two numbers, pressure then volume.',
  ]);
});
test('each branch can use its own trend shape', () => {
  // Straight high branch, quadratic low branch, crossing exactly at V = 35, P = 1000.
  const points = [
    ...[33, 33.4, 33.8, 34.2, 34.6].map((v) => ({ v, p: 1000 - 1400 * (v - 35) })),
    ...[35.4, 35.8, 36.2, 36.6, 37].map((v) => ({
      v,
      p: 1000 - 190 * (v - 35) + 15 * (v - 35) ** 2,
    })),
  ].map((p, id) => ({ ...p, id, group: p.v < 35 ? 'high' : 'low' }));
  const r = PV.analyze(points, { high: 1, low: 2 });
  assert.equal(r.high.coeff.length, 2);
  assert.equal(r.low.coeff.length, 3);
  assert.deepEqual(r.degrees, { high: 1, low: 2 });
  assert.equal(r.degree, null);
  assert(
    Math.abs(r.intersection.v - 35) < 1e-9 && Math.abs(r.intersection.p - 1000) < 1e-6,
  );
  // A plain number still means the same shape for both branches.
  const same = PV.analyze(points, 2);
  assert.equal(same.degree, 2);
  assert.deepEqual(same.degrees, { high: 2, low: 2 });
  assert.throws(() => PV.analyze(points, { high: 3, low: 1 }), /straight or quadratic/);
  // Per-branch minimum counts follow each branch's shape.
  const few = points.map((p) => ({
    ...p,
    group: p.id < 3 ? 'high' : p.id < 7 ? 'low' : 'none',
  }));
  assert(PV.analyze(few, { high: 1, low: 2 }).high);
  assert.throws(
    () => PV.analyze(few, { high: 2, low: 2 }),
    /curved branch needs at least 4/,
  );
});
test('deep fit applies per-branch minimums and returns mixed-shape fits', () => {
  const points = Array.from({ length: 12 }, (_, id) => {
    const v = 33 + id * 0.4,
      d = v - 35;
    return {
      id,
      v,
      p: d < 0 ? 1000 - 1400 * d : 1000 - 190 * d + 15 * d * d,
      group: 'none',
    };
  });
  const d = PV.deepFit(points, { high: 1, low: 2 });
  assert.deepEqual(d.search.minimumPerBranch, { high: 4, low: 5 });
  const high = d.points.filter((p) => p.group === 'high').length,
    low = d.points.filter((p) => p.group === 'low').length;
  assert(high >= 4 && low >= 5);
  const r = PV.analyze(d.points, { high: 1, low: 2 });
  assert(Math.abs(r.intersection.p - 1000) < 1e-6);
  assert.equal(PV.deepFit(points, 2).search.minimumPerBranch, 5);
  // 8 nonzero points: enough for straight/straight (4 + 4) but not straight/curved (4 + 5).
  assert(
    PV.deepFit(
      points.slice(0, 8).map((p, i) => ({ ...p, id: i })),
      1,
    ),
  );
  assert.throws(
    () => PV.deepFit(points.slice(0, 8), { high: 1, low: 2 }),
    /Need at least 9 nonzero-pressure points/,
  );
});
// Synthetic bubble-point CCE in gauge pressure whose true Y-function is exactly linear:
// V/Vb − 1 = (Pb − P) / (P_abs · Y), Y = 2.2 + 0.0006 P_abs, Pb = 2500 psia, Vb = 50.
function yCase(atmosphere = 14.696) {
  return Array.from({ length: 16 }, (_, id) => {
    const P = 4000 - 200 * id,
      v =
        P >= 2500
          ? 50 * (1 - 1.2e-5 * (P - 2500))
          : 50 * (1 + (2500 - P) / (P * (2.2 + 0.0006 * P)));
    return { id, p: P - atmosphere, v, group: P >= 2500 ? 'high' : 'low' };
  });
}
test('Y-function check recovers the true bubble point and Vb on exact data', () => {
  const points = yCase(),
    r = PV.analyze(points, { high: 1, low: 2 }),
    y = PV.yFunction(points, r, 14.696);
  assert(Math.abs(y.best.pb - (2500 - 14.696)) < 0.05, `Pb ${y.best.pb}`);
  assert(Math.abs(y.best.vb - 50) < 1e-3, `Vb ${y.best.vb}`);
  assert(y.best.relativeRmse < 1e-6);
  assert(Math.abs(y.best.slope * 1e4 - 6) < 1e-3, 'Y slope matches the synthetic 0.0006');
  assert.deepEqual(y.bracket, [2400 - 14.696, 2600 - 14.696]);
  assert.equal(y.atEdge, false);
  assert.equal(y.best.rows.length, points.filter((p) => p.group === 'low').length);
  // The graphical estimate is evaluated with the same Y measure for comparison.
  assert(y.graphical === null || y.graphical.relativeRmse >= y.best.relativeRmse);
});
test('Y-function uses absolute pressure: ignoring the gauge offset biases Pb', () => {
  const points = yCase(),
    r = PV.analyze(points, { high: 1, low: 2 });
  const wrong = PV.yFunction(points, r, 0);
  assert(
    wrong.best.relativeRmse > 1e-6,
    'gauge treated as absolute is no longer exactly linear',
  );
  const absolute = yCase(0),
    ra = PV.analyze(absolute, { high: 1, low: 2 });
  assert(Math.abs(PV.yFunction(absolute, ra, 0).best.pb - 2500) < 0.05);
});
test('Y-function check rejects unsuitable selections', () => {
  const points = yCase(),
    r = PV.analyze(points, { high: 1, low: 2 });
  const fewLow = points.map((p) => (p.id > 10 ? { ...p, group: 'none' } : p));
  assert.throws(
    () => PV.yFunction(fewLow, PV.analyze(fewLow, { high: 1, low: 1 }), 14.696),
    /at least 4 low-pressure points/,
  );
  assert.throws(() => PV.yFunction(points, null), /Fit both branches/);
  assert.throws(() => PV.yFunction(points, r, -1), /Atmospheric/);
});
