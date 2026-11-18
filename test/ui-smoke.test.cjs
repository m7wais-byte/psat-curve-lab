const test = require('node:test');
const assert = require('node:assert/strict');
const { harness } = require('./harness.cjs');

test('phase choice gates entry and the synthetic example produces the known result', () => {
  const h = harness();
  assert(h.get('data').disabled);
  h.get('load').onclick();
  assert.match(h.get('errors').textContent, /Choose Bubble point or Dew point/);
  h.demo();
  assert(!h.get('data').disabled);
  assert.match(h.get('psat').innerHTML, /1,000/);
  assert.match(h.get('chart').innerHTML, /Volume \(cc\)/);
  assert.match(h.get('chart').innerHTML, /Pressure \(psig\)/);
  assert(h.get('analysis').scrolled);
});

test('phase/direction labels change without silently changing the numerical result', () => {
  const h = harness();
  h.demo();
  const value = h.get('psat').innerHTML;
  h.get('phase').value = 'dew';
  h.get('phase').onchange();
  assert.match(h.get('highLegend').textContent, /gas expected/);
  assert.match(h.get('chart').innerHTML, /Pd /);
  h.get('direction').value = 'increasing';
  h.get('direction').onchange();
  assert.match(h.get('phaseContext').textContent, /reverse compression/);
  h.get('boundary').value = 'lower';
  h.get('boundary').onchange();
  assert.match(h.get('highLegend').textContent, /gas \+ liquid/);
  assert.match(h.get('lowLegend').textContent, /gas expected/);
  assert.equal(h.get('psat').innerHTML, value);
});

test('range changes, point changes and Undo preserve the selection workflow', () => {
  const h = harness();
  h.demo();
  h.get('highEnd').value = '34.6';
  h.get('lowStart').value = '35.4';
  h.get('ranges').onclick();
  const selected = h.get('count').textContent;
  h.run('setGroup(0, "none")');
  assert.notEqual(h.get('count').textContent, selected);
  h.get('undo').onclick();
  assert.equal(h.get('count').textContent, selected);
  h.get('clear').onclick();
  assert.equal(h.get('psat').textContent, '—');
  h.get('undo').onclick();
  assert.equal(h.get('evidence').textContent, 'Intersection found');
});

test('all display backgrounds preserve Psat and group counts match data', () => {
  const h = harness();
  h.demo();
  const value = h.get('psat').innerHTML;
  assert.equal(
    Number(h.get('highCount').textContent) +
      Number(h.get('lowCount').textContent) +
      Number(h.get('noneCount').textContent),
    21,
  );
  assert.match(h.get('chart').innerHTML, /data-region="high"/);
  h.get('shade').checked = false;
  h.get('shade').onchange();
  assert(!h.get('chart').innerHTML.includes('data-region='));
  for (const grid of ['major', 'none', 'paper']) {
    h.get('grid').value = grid;
    h.get('grid').onchange();
    assert.equal(h.get('psat').innerHTML, value);
  }
  assert.match(h.get('axisReadout').textContent, /Y: Pressure \(psig\)/);
});

test('tool choice and point inspection use actual event handlers', () => {
  const h = harness();
  h.demo();
  h.tools[2].onclick();
  assert.match(h.get('toolHelp').textContent, /out of both fits/);
  const point = h.get('chart').pointElements[0];
  point.onmouseenter();
  assert.match(h.get('pointReadout').textContent, /Point 1 · Pressure/);
  point.onclick();
  assert.equal(h.run('points[0].group'), 'none');
});

test('presentation prevents point reassignment and Escape returns to editing', () => {
  const h = harness();
  h.demo();
  const selected = h.get('count').textContent;
  h.get('present').onclick();
  assert(h.document.body.classList.contains('presentation'));
  h.run('setGroup(0, "none")');
  assert.equal(h.get('count').textContent, selected);
  h.events.keydown({ key: 'Escape' });
  assert(!h.document.body.classList.contains('presentation'));
});

test('synthetic labeling survives replotting; input edits clear stale results', () => {
  const h = harness();
  h.demo();
  h.get('load').onclick();
  assert.equal(h.get('sampleBadge').hidden, false);
  h.get('data').value = '100,12\n90,13';
  h.get('data').oninput();
  assert.equal(h.get('psat').textContent, '—');
  assert.equal(h.get('dataState').textContent, 'Not plotted');
  assert.equal(h.get('errors').textContent, '');
  assert(h.get('present').disabled);
});

test('case names remain text and analysis export records method and point groups', async () => {
  const h = harness();
  h.demo();
  h.get('case').value = '<img src=x onerror=alert(1)>';
  h.get('case').oninput();
  assert.equal(h.get('summaryCase').textContent, h.get('case').value);
  h.get('export').onclick();
  const record = JSON.parse(await h.blobs.at(-1).text());
  assert.equal(record.syntheticDemo, true);
  assert.equal(record.expectedTransition, 'bubble');
  assert.equal(record.measurements.length, 21);
  assert(record.branches.high.coefficients.length === 3);
  assert.match(record.note, /not validated/);
});

test('input column labels follow selected units', () => {
  const h = harness();
  h.demo();
  assert.equal(h.get('inputPressureLabel').textContent, 'Pressure (psig)');
  assert.equal(h.get('inputVolumeLabel').textContent, 'Volume (cc)');
  h.get('punit').value = 'bar:Gauge';
  h.get('punit').onchange();
  h.get('vunit').value = 'mL';
  h.get('vunit').onchange();
  assert.equal(h.get('inputPressureLabel').textContent, 'Pressure (bar (gauge))');
  assert.equal(h.get('inputVolumeLabel').textContent, 'Volume (mL)');
});

test('combined pressure selection preserves fits and exports the correct unit and reference', async () => {
  const h = harness();
  h.demo();
  const crossing = h.run('JSON.stringify(result.intersection)');
  for (const [choice, unit, basis, label] of [
    ['psi:Absolute', 'psi', 'Absolute', 'psia'],
    ['psi:Gauge', 'psi', 'Gauge', 'psig'],
    ['kPa:Absolute', 'kPa', 'Absolute', 'kPa (absolute)'],
  ]) {
    h.get('punit').value = choice;
    h.get('punit').onchange();
    assert.equal(h.run('JSON.stringify(result.intersection)'), crossing);
    assert(h.get('psat').innerHTML.includes(label));
    assert(h.get('inputPressureLabel').textContent.includes(label));
    const report = h.run('currentReport()');
    assert.equal(report.pressureUnit, unit);
    assert.equal(report.pressureBasis, basis);
    h.get('export').onclick();
    const data = JSON.parse(await h.blobs.at(-1).text());
    assert.equal(data.pressureUnit, unit);
    assert.equal(data.pressureBasis, basis);
  }
});

test('plot automatically selects both fits and Auto fit restores points with Undo available', () => {
  const h = harness();
  h.demo();
  const original = h.run('JSON.stringify(points.map(p=>p.group))');
  h.run('setGroup(0,"none")');
  const manual = h.run('JSON.stringify(points.map(p=>p.group))');
  assert.notEqual(manual, original);
  h.get('suggest').onclick();
  assert.equal(h.run('JSON.stringify(points.map(p=>p.group))'), original);
  h.get('undo').onclick();
  assert.equal(h.run('JSON.stringify(points.map(p=>p.group))'), manual);
});
test('Y-function check shows for bubble points only, explains its assumption and is exported', async () => {
  const h = harness();
  h.demo();
  const panel = h.get('yCheck');
  assert(!panel.hidden);
  assert.match(h.get('ySummary').textContent, /^· Pb [\d,.]+ psig$/);
  assert.match(h.get('yResult').innerHTML, /Most linear Y at Pb/);
  assert.match(h.get('yResult').innerHTML, /Graphical Pb 1,000 psig/);
  assert.match(h.get('yNote').textContent, /standard atmosphere \(14\.696 psi\)/);
  assert((h.get('yChart').innerHTML.match(/data-y="best"/g) || []).length > 3);
  const psat = h.get('psat').innerHTML;
  h.get('export').onclick();
  const data = JSON.parse(await h.blobs.at(-1).text());
  assert.equal(data.yFunctionCheck.atmosphereAdded, 14.696);
  assert(Number.isFinite(data.yFunctionCheck.mostLinearPb));
  h.get('punit').value = 'psi:Absolute';
  h.get('punit').onchange();
  assert.match(h.get('yNote').textContent, /treated as absolute/);
  assert.equal(
    h.get('psat').innerHTML.replace('psia', 'psig'),
    psat,
    'the check never changes Pb',
  );
  // A straight low branch fits with 3 points, but the Y-function check needs 4.
  h.get('shapeLow').value = '1';
  h.run(
    'points = points.map((p) => (p.group === "low" && p.v > 35.6 ? { ...p, group: "none" } : p)); fitNow();',
  );
  assert(!panel.hidden);
  assert.match(h.get('ySummary').textContent, /not available/);
  assert.match(h.get('yResult').textContent, /at least 4 low-pressure points/);
  h.get('phase').value = 'dew';
  h.get('phase').onchange();
  assert(panel.hidden);
});
