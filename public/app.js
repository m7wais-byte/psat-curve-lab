const $ = (id) => document.getElementById(id);
let points = [],
  result = null,
  tool = 'high',
  demo = false,
  loadedText = '',
  history = [],
  presentation = false,
  viewBounds = null,
  autoBounds = null;
let fitWorker = null,
  fitSequence = 0,
  searchInfo = null;
function stopFit(message = '', clearInfo = true) {
  fitSequence++;
  fitWorker?.terminate();
  fitWorker = null;
  if (clearInfo) searchInfo = null;
  $('suggest').disabled = false;
  $('cancelFit').hidden = true;
  $('fitSearchStatus').textContent = message;
}
// Nonzero points Deep fit left out of both fits. searchInfo is cleared by any selection
// edit, so this only describes Deep fit's own, unchanged selection.
function deepFitExcluded() {
  return searchInfo ? points.filter((p) => p.group === 'none' && p.p !== 0) : [];
}
function pointNumbers(list) {
  const ids = list.map((p) => p.id + 1);
  return ids.length > 12
    ? ids.slice(0, 12).join(', ') + ` and ${ids.length - 12} more`
    : ids.join(', ');
}
// Trend shape per branch: 1 = straight, 2 = quadratic.
function degrees() {
  return { high: Number($('shapeHigh').value), low: Number($('shapeLow').value) };
}
function runDeepFit(saveUndo = false) {
  stopFit('', false);
  const requestId = fitSequence;
  const snapshot = points.map((p) => ({ ...p }));
  const degree = degrees();
  $('suggest').disabled = true;
  $('cancelFit').hidden = false;
  $('fitSearchStatus').textContent = 'Deep fit is comparing point selections…';
  err('');
  $('evidence').textContent = 'Searching fits…';
  function finish(data) {
    if (
      requestId !== fitSequence ||
      (data.requestId != null && data.requestId !== requestId)
    )
      return;
    if (data.type === 'progress') {
      $('fitSearchStatus').textContent =
        `Deep fit · ${num(data.progress.examined, 0)} selections compared…`;
      return;
    }
    fitWorker?.terminate();
    fitWorker = null;
    $('suggest').disabled = false;
    $('cancelFit').hidden = true;
    if (data.type === 'error') {
      $('fitSearchStatus').textContent = 'No new selection applied.';
      err(data.message);
      render();
      return;
    }
    if (saveUndo) remember();
    points = data.points;
    searchInfo = data.search;
    syncRanges();
    fitNow(false);
    const excluded = deepFitExcluded();
    $('fitSearchStatus').textContent =
      `Deep fit · ${searchInfo.complete ? 'All permitted selections compared' : 'Bounded search — optimum not guaranteed'} · ${num(searchInfo.examined, 0)} tested · ${points.filter((p) => p.group !== 'none').length}/${points.length} points used` +
      (excluded.length
        ? ` · Left out: point${excluded.length > 1 ? 's' : ''} ${pointNumbers(excluded)} (marked ×)`
        : ' · No points left out');
  }
  if (typeof Worker !== 'undefined') {
    try {
      fitWorker = new Worker('fit-worker.js?v=14');
      fitWorker.onmessage = (event) => finish(event.data);
      fitWorker.onerror = () =>
        finish({
          type: 'error',
          message: 'Deep fit could not run. Try again or select points manually.',
        });
      fitWorker.postMessage({ requestId, points: snapshot, degree });
    } catch (e) {
      finish({ type: 'error', message: e.message });
    }
  } else {
    // Compatibility path for environments without Web Workers.
    try {
      finish({ type: 'result', ...PV.deepFit(snapshot, degree) });
    } catch (e) {
      finish({ type: 'error', message: e.message });
    }
  }
}
$('cancelFit').onclick = () => {
  stopFit('Search stopped. Current selections kept.', false);
  render();
};
function pressureSelection() {
  const [unit, basis] = $('punit').value.split(':');
  return { unit, basis };
}
function pressureLabel() {
  const { unit, basis } = pressureSelection();
  return unit === 'psi'
    ? basis === 'Gauge'
      ? 'psig'
      : 'psia'
    : unit + (basis === 'Gauge' ? ' (gauge)' : ' (absolute)');
}
const num = (v, d = 3) =>
  Number(v).toLocaleString(undefined, { maximumFractionDigits: d });
function err(s) {
  $('errors').textContent = s;
}
function resetResult() {
  result = null;
  $('psat').textContent = '—';
  $('vsat').textContent = '—';
  $('evidence').textContent = points.length ? 'Select two branches' : 'Awaiting data';
  $('psatSub').textContent = 'Intersection of independent trends';
  $('diagnostics').textContent = '';
  $('equations').innerHTML =
    '<div class="equation-placeholder">Your branch equations and fit quality will appear here.</div>';
}
function fitNow(clearSearch = true) {
  if (clearSearch) stopFit();
  err('');
  resetResult();
  if (!phaseReady()) {
    render();
    return;
  }
  if (points.length) {
    try {
      result = PV.analyze(points, degrees());
    } catch (e) {
      err(e.message);
    }
  }
  render();
}
function load() {
  stopFit();
  err('');
  if (!phaseReady()) return;
  history = [];
  viewBounds = null;
  $('scaleError').textContent = '';
  let parsed = PV.parse($('data').value);
  if (parsed.errors.length) {
    points = [];
    resetResult();
    err(parsed.errors.join('\n'));
    render();
    return;
  }
  points = parsed.points;
  loadedText = $('data').value;
  resetResult();
  syncRanges();
  render();
  if (points.length) runDeepFit();
  if (points.length)
    $('analysis').scrollIntoView?.({ block: 'start', behavior: 'smooth' });
}
function syncRanges() {
  let hi = points.filter((p) => p.group === 'high'),
    lo = points.filter((p) => p.group === 'low');
  $('highEnd').value = hi.length ? Math.max(...hi.map((p) => p.v)) : '';
  $('lowStart').value = lo.length ? Math.min(...lo.map((p) => p.v)) : '';
}
function setGroup(id, group) {
  if (presentation || points.find((p) => p.id === id)?.group === group) return;
  remember();
  points = points.map((p) => (p.id === id ? { ...p, group } : p));
  syncRanges();
  fitNow();
}
function table() {
  const body = $('points'),
    autoExcluded = new Set(deepFitExcluded().map((p) => p.id));
  body.replaceChildren();
  points.forEach((p) => {
    let tr = document.createElement('tr');
    tr.className =
      (p.group === 'none' ? 'unassigned' : 'row-' + p.group) +
      (autoExcluded.has(p.id) ? ' auto-excluded' : '');
    let td = document.createElement('td'),
      select = document.createElement('select');
    [
      ['high', 'High-pressure fit'],
      ['low', 'Low-pressure fit'],
      ['none', 'Neither fit'],
    ].forEach(([value, text]) => {
      let opt = document.createElement('option');
      opt.value = value;
      opt.textContent = text;
      select.append(opt);
    });
    select.value = p.group;
    select.setAttribute('aria-label', 'Fit assignment for point ' + (p.id + 1));
    select.onchange = () => setGroup(p.id, select.value);
    td.append(select);
    tr.append(td);
    [
      p.id + 1 + (autoExcluded.has(p.id) ? ' · left out by Deep fit' : ''),
      num(p.p, 6) + (p.p === 0 ? ' · review zero' : ''),
      num(p.v, 6),
    ].forEach((value) => {
      let cell = document.createElement('td');
      cell.textContent = value;
      tr.append(cell);
    });
    body.append(tr);
  });
}
function minimumMessage() {
  const { high, low } = degrees();
  return high === low
    ? `Assign at least ${high + 2} points to each branch.`
    : `Assign at least ${high + 2} high-pressure and ${low + 2} low-pressure points.`;
}
function render() {
  let r = result,
    hi = points.filter((p) => p.group === 'high').length,
    lo = points.filter((p) => p.group === 'low').length,
    none = points.length - hi - lo;
  $('count').textContent = `${hi} high · ${lo} low · ${none} neither`;
  $('highCount').textContent = hi;
  $('lowCount').textContent = lo;
  $('noneCount').textContent = none;
  let note = points.some((p) => p.p === 0) ? ' Review zero-pressure readings.' : '';
  if (r) {
    $('evidence').textContent = r.intersection
      ? r.warning
        ? 'Review crossing'
        : 'Intersection found'
      : 'No clear crossing';
    $('evidence').style.color = r.intersection && !r.warning ? '#0f766e' : '#a16c34';
    if (r.intersection) {
      $('psat').innerHTML =
        num(r.intersection.p) + ' <small>' + pressureLabel() + '</small>';
      $('vsat').innerHTML =
        num(r.intersection.v) + ' <small>' + $('vunit').value + '</small>';
      $('psatSub').textContent = $('temp').value
        ? `Test temperature ${$('temp').value} ${$('tunit').value}`
        : 'Graphical estimate';
    }
    $('message').textContent =
      (r.warning || 'Review the fits and their intersection.') + note;
    $('diagnostics').textContent =
      `Pressure RMSE: high branch ${num(r.high.rmse, 4)} ${pressureLabel()}; low branch ${num(r.low.rmse, 4)} ${pressureLabel()}. ${r.omitted} point(s) remain visible but do not influence either fit.`;
  } else
    $('message').textContent =
      (points.length
        ? minimumMessage() + ' Points may be left out of both fits.'
        : 'Select a fit tool, then click the points to use.') + note;
  table();
  chart();
  equations();
  yCheck();
  updateWorkspace();
}
// Major grid divisions on the 900 × 500 plot area (100 px squares).
const X_DIV = 9,
  Y_DIV = 5;
function chart() {
  if (!points.length) {
    autoBounds = null;
    updateScaleControls();
    $('chart').innerHTML =
      '<div class="empty"><div class="empty-chart-icon">⌁</div><h3>Add your measurements</h3><p>Choose a test type, paste data, then select <strong>Plot graph</strong>.</p></div>';
    return;
  }
  const W = 1020,
    H = 620,
    l = 90,
    rt = 30,
    t = 40,
    b = 80,
    r = result,
    c = r?.intersection,
    volumes = points.map((p) => p.v),
    pressures = points.map((p) => p.p);
  if (c) {
    volumes.push(c.v);
    pressures.push(c.p);
  }
  let vmin = Math.min(...volumes),
    vmax = Math.max(...volumes),
    pmin = Math.min(...pressures),
    pmax = Math.max(...pressures),
    vs = vmax - vmin || 1,
    ps = pmax - pmin || 1;
  // Snap the padded data range to round steps on the major grid lines.
  const vAxis = PVReport.niceAxis(
      Math.max(0, vmin - vs * 0.045),
      vmax + vs * 0.045,
      X_DIV,
    ),
    pAxis = PVReport.niceAxis(Math.max(0, pmin - ps * 0.07), pmax + ps * 0.1, Y_DIV);
  ({ min: vmin, max: vmax } = vAxis);
  ({ min: pmin, max: pmax } = pAxis);
  autoBounds = { vmin, vmax, pmin, pmax };
  if (viewBounds) ({ vmin, vmax, pmin, pmax } = viewBounds);
  updateScaleControls();
  const inside = (p) => p.v >= vmin && p.v <= vmax && p.p >= pmin && p.p <= pmax;
  const visible = points.filter(inside).length;
  $('scaleStatus').textContent =
    `${viewBounds ? 'Custom' : 'Auto'} scale · ${visible} / ${points.length} points visible.` +
    (visible < points.length ? ' All assigned points still count in the fit.' : '') +
    (c && !inside(c)
      ? ' The intersection is outside this view. Reset or focus to see it.'
      : '');
  const x = (v) => l + ((v - vmin) / (vmax - vmin)) * (W - l - rt),
    y = (p) => H - b - ((p - pmin) / (pmax - pmin)) * (H - t - b);
  let h = `<svg id="pvplot" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pressure on vertical axis, volume on horizontal axis; independent branch fits and their intersection"><desc>Graphical pressure-volume analysis. Changing axis limits changes only the view, not the fitted result.</desc><defs><clipPath id="area"><rect x="${l}" y="${t}" width="${W - l - rt}" height="${H - t - b}"/></clipPath></defs>`;
  const grid = $('grid').value || 'paper';
  h += `<rect x="${l}" y="${t}" width="900" height="500" fill="white"/>`;
  if (r && $('shade').checked) {
    for (const [name, f, color] of [
      ['high', r.high, '#0f766e'],
      ['low', r.low, '#c97725'],
    ])
      h += `<rect clip-path="url(#area)" data-region="${name}" x="${x(f.min)}" y="${t}" width="${Math.max(0, x(f.max) - x(f.min))}" height="500" fill="${color}" opacity=".055"><title>Selected ${name}-pressure fitting range</title></rect>`;
    h += `<rect clip-path="url(#area)" data-region="gap" x="${x(r.gap[0])}" y="${t}" width="${Math.max(0, x(r.gap[1]) - x(r.gap[0]))}" height="500" fill="#758499" opacity=".065"><title>Interval between selected fitting ranges</title></rect>`;
  }

  for (let i = 0; i <= 45; i++) {
    let xx = l + i * 20,
      major = i % 5 === 0;
    if (grid === 'none' || (!major && grid !== 'paper')) continue;
    h += `<path d="M${xx} ${t}V${H - b}" stroke="${major ? '#ccd9d2' : '#edf2ee'}" stroke-width="${major ? 1.2 : 0.6}"/>`;
  }
  for (let i = 0; i <= 25; i++) {
    let yy = t + i * 20,
      major = i % 5 === 0;
    if (grid === 'none' || (!major && grid !== 'paper')) continue;
    h += `<path d="M${l} ${yy}H${W - rt}" stroke="${major ? '#ccd9d2' : '#edf2ee'}" stroke-width="${major ? 1.2 : 0.6}"/>`;
  }
  h += `<rect x="${l}" y="${t}" width="900" height="500" fill="none" stroke="#8191a4" stroke-width="1"/><path d="M${l} ${t}V${H - b}H${W - rt}" fill="none" stroke="#34475c" stroke-width="1.8"/>`;
  for (let i = 0; i <= X_DIV; i++) {
    let v = vmin + ((vmax - vmin) * i) / X_DIV;
    h += `<path d="M${x(v)} ${H - b}v6" stroke="#34475c"/><text x="${x(v)}" y="${H - b + 26}" text-anchor="middle" font-size="12" fill="#46596e">${axisTick(v, (vmax - vmin) / X_DIV)}</text>`;
  }
  for (let i = 0; i <= Y_DIV; i++) {
    let p = pmin + ((pmax - pmin) * i) / Y_DIV;
    h += `<path d="M${l - 6} ${y(p)}h6" stroke="#34475c"/><text x="${l - 13}" y="${y(p) + 4}" text-anchor="end" font-size="12" fill="#46596e">${axisTick(p, (pmax - pmin) / Y_DIV)}</text>`;
  }
  function path(f, start, end, color, dashed) {
    let d = '';
    for (let i = 0; i <= 100; i++) {
      let v = start + ((end - start) * i) / 100,
        p = f.predict(v);
      d += (i ? 'L' : 'M') + x(v) + ',' + y(p);
    }
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="3.2" stroke-dasharray="${dashed ? '7 5' : ''}" clip-path="url(#area)"/>`;
  }
  h += `<g clip-path="url(#area)">`;
  if (r) {
    for (let [f, color] of [
      [r.high, '#0f766e'],
      [r.low, '#c97725'],
    ]) {
      h += path(f, f.min, f.max, color, false);
      let target = c ? c.v : (r.gap[0] + r.gap[1]) / 2;
      if (target > f.max) h += path(f, f.max, target, color, true);
      if (target < f.min) h += path(f, target, f.min, color, true);
    }
    if (c && inside(c)) {
      h += `<path d="M${l} ${y(c.p)}H${x(c.v)}V${H - b}" fill="none" stroke="#718378" stroke-dasharray="4 5"/><circle cx="${x(c.v)}" cy="${y(c.p)}" r="7" fill="white" stroke="#19352f" stroke-width="2.5"/><text x="${Math.min(W - 180, x(c.v) + 15)}" y="${y(c.p) - 17}" font-size="13" fill="#19352f" stroke="white" stroke-width="5" paint-order="stroke">${phaseSymbol()} ${num(c.p)} ${pressureLabel()}</text>`;
    }
  }
  const autoExcluded = new Set(deepFitExcluded().map((p) => p.id));
  $('autoExcludedLegend').hidden = !autoExcluded.size;
  points.filter(inside).forEach((p) => {
    let color =
        p.group === 'high' ? '#0f766e' : p.group === 'low' ? '#c97725' : '#82918c',
      auto = autoExcluded.has(p.id),
      cx = x(p.v),
      cy = y(p.p),
      state = auto
        ? 'Left out by Deep fit'
        : p.group === 'none'
          ? 'Neither fit'
          : p.group + ' branch';
    // Deep fit exclusions get a cross so they read differently from manual "neither" points.
    h += `<g class="chartpoint" tabindex="0" role="button" data-id="${p.id}" aria-label="Assign point ${p.id + 1}, pressure ${p.p}, volume ${p.v}${auto ? ', left out by Deep fit' : ''}"><circle cx="${cx}" cy="${cy}" r="11" fill="transparent"/><circle cx="${cx}" cy="${cy}" r="5.2" fill="${p.group === 'none' ? 'white' : color}" stroke="${color}" stroke-width="2"><title>Point ${p.id + 1} · P ${p.p}, V ${p.v} · ${state}</title></circle>${auto ? `<path data-auto-excluded="${p.id}" d="M${cx - 3} ${cy - 3}l6 6m0 -6l-6 6" stroke="${color}" stroke-width="1.6" pointer-events="none"/>` : ''}</g>`;
  });
  h += `</g>`;
  h += `<text x="${(W + l - rt) / 2}" y="${H - 13}" text-anchor="middle" font-size="13" fill="#52685b">Volume (${$('vunit').value})</text><text transform="translate(22 ${(H - b + t) / 2}) rotate(-90)" text-anchor="middle" font-size="13" fill="#52685b">Pressure (${pressureLabel()})</text></svg>`;
  $('chart').innerHTML = h;
  $('chart')
    .querySelectorAll('[data-id]')
    .forEach((el) => {
      const inspect = () => {
        const p = points.find((p) => p.id === Number(el.dataset.id));
        if (p)
          $('pointReadout').textContent =
            `Point ${p.id + 1} · Pressure ${num(p.p, 6)} ${pressureLabel()} · Volume ${num(p.v, 6)} ${$('vunit').value} · ${p.group === 'none' ? (autoExcluded.has(p.id) ? 'Left out by Deep fit' : 'No fit') : p.group === 'high' ? 'High-pressure fit' : 'Low-pressure fit'}`;
      };
      el.onmouseenter = inspect;
      el.onfocus = inspect;
      el.onclick = () => setGroup(Number(el.dataset.id), tool);
      el.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setGroup(Number(el.dataset.id), tool);
        }
      };
    });
}
$('load').onclick = () => {
  if (!demo) $('demoNote').textContent = '';
  load();
};
$('suggest').onclick = () => {
  if (!points.length) {
    err('Plot your data first.');
    return;
  }
  runDeepFit(true);
};
$('ranges').onclick = () => {
  if (!points.length) {
    err('Plot your data first.');
    return;
  }
  let a = Number($('highEnd').value),
    b = Number($('lowStart').value);
  if (!$('highEnd').value || !$('lowStart').value || !(a < b)) {
    err(
      'Enter two volume limits: the high-pressure range end must be smaller than the low-pressure range start.',
    );
    return;
  }
  remember();
  points = points.map((p) => ({
    ...p,
    group: p.p === 0 ? 'none' : p.v <= a ? 'high' : p.v >= b ? 'low' : 'none',
  }));
  fitNow();
};
$('clear').onclick = () => {
  remember();
  points = points.map((p) => ({ ...p, group: 'none' }));
  syncRanges();
  fitNow();
};
document.querySelectorAll('[data-tool]').forEach(
  (btn) =>
    (btn.onclick = () => {
      tool = btn.dataset.tool;
      toolHint();
      document.querySelectorAll('[data-tool]').forEach((b) => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
    }),
);
$('data').oninput = () => {
  stopFit();
  points = [];
  history = [];
  viewBounds = null;
  demo = false;
  $('demoNote').textContent = '';
  resetResult();
  err('');
  render();
};
$('file').onchange = async (e) => {
  let f = e.target.files[0];
  if (!f) return;
  if (f.size > 1e6) {
    err('Use a file smaller than 1 MB.');
    return;
  }
  $('data').value = await f.text();
  demo = false;
  $('demoNote').textContent = '';
  load();
  e.target.value = '';
};
$('demo').onclick = () => {
  if (!phaseReady()) return;
  let rows = ['Pressure,Volume'];
  for (let i = 0; i <= 20; i++) {
    let v = 33 + i * 0.2,
      p =
        v < 35
          ? 1000 - 1400 * (v - 35) + 150 * (v - 35) ** 2
          : 1000 - 190 * (v - 35) + 15 * (v - 35) ** 2;
    rows.push(p.toFixed(3) + ',' + v.toFixed(3));
  }
  $('data').value = rows.join('\n');
  $('shapeHigh').value = '2';
  $('shapeLow').value = '2';
  $('case').value =
    'DEMONSTRATION · ' +
    ($('phase').value === 'dew' ? 'dew' : 'bubble') +
    ' curve fitting';
  $('punit').value = 'psi:Gauge';
  $('vunit').value = 'cc';
  $('temp').value = '';
  demo = true;
  $('demoNote').textContent = 'Example data — not a laboratory test.';
  load();
  setupPhase();
};
// A new shape changes the fit, so it cancels a running Deep fit like a manual edit.
$('shapeHigh').onchange = $('shapeLow').onchange = () => fitNow();
// Units and temperature only relabel values: keep a running Deep fit and its search record.
['temp', 'tunit', 'punit', 'vunit'].forEach(
  (id) => ($(id).onchange = () => (fitWorker ? render() : fitNow(false))),
);
function currentReport() {
  return PVReport.buildModel({
    points,
    result,
    caseName: $('case').value,
    phase: $('phase').value,
    pressureUnit: pressureSelection().unit,
    pressureBasis: pressureSelection().basis,
    volumeUnit: $('vunit').value,
    temperature: $('temp').value,
    temperatureUnit: $('tunit').value,
    boundary: $('boundary').value,
    syntheticDemo: demo,
    grid: $('grid').value,
    yCheck: yResult && {
      pb: yResult.best.pb,
      vb: yResult.best.vb,
      relativeRmse: yResult.best.relativeRmse,
      graphicalRelativeRmse: yResult.graphical?.relativeRmse ?? null,
      atEdge: yResult.atEdge,
      atmosphere: yResult.atmosphere,
    },
  });
}
$('print').onclick = () => {
  try {
    if (!PVReport.open(currentReport(), { print: true }))
      err('Allow pop-ups for this site to open the printable report.');
  } catch (e) {
    err(e.message);
  }
};
$('savePdf').onclick = () => {
  try {
    PVReport.save(currentReport());
  } catch (e) {
    err(e.message);
  }
};
$('grid').onchange = () => chart();
$('shade').onchange = () => chart();
$('saveSvg').onclick = () => {
  if (!points.length) {
    err('Plot a dataset before saving the graph.');
    return;
  }
  const svg = $('chart').querySelector('svg');
  if (svg)
    download(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
        svg.outerHTML.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '),
      'psat-graph.svg',
      'image/svg+xml',
    );
};
function download(data, name, type) {
  let u = URL.createObjectURL(new Blob([data], { type })),
    a = document.createElement('a');
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
$('export').onclick = () => {
  if (!phaseReady()) return;
  if (!points.length) {
    err('Plot a dataset before exporting.');
    return;
  }
  let r = result,
    record = {
      application: 'Psat Curve Lab v13',
      case: $('case').value,
      syntheticDemo: demo,
      method: 'Independent pressure-versus-volume least-squares branch fits',
      temperature: $('temp').value || null,
      temperatureUnit: $('tunit').value,
      pressureUnit: pressureSelection().unit,
      pressureBasis: pressureSelection().basis,
      volumeUnit: $('vunit').value,
      expectedTransition: $('phase').value,
      pressurePath: $('direction').value,
      dewBoundary: $('phase').value === 'dew' ? $('boundary').value : null,
      phaseLabels:
        'Expected from operator-selected test context, not confirmed by the fit',
      graphView: {
        mode: viewBounds ? 'custom' : 'auto',
        bounds: viewBounds || autoBounds,
      },
      yFunctionCheck: yResult && {
        note: 'Cross-check only; does not change the graphical result.',
        atmosphereAdded: yResult.atmosphere,
        mostLinearPb: yResult.best.pb,
        vbAtMostLinearPb: yResult.best.vb,
        relativeRmse: yResult.best.relativeRmse,
        line: { intercept: yResult.best.intercept, slope: yResult.best.slope },
        graphicalRelativeRmse: yResult.graphical?.relativeRmse ?? null,
        bracket: yResult.bracket,
        atBracketEdge: yResult.atEdge,
      },
      automaticSelection: searchInfo && {
        ...searchInfo,
        excludedPointIds: deepFitExcluded().map((p) => p.id),
      },
      estimatedIntersection: r?.intersection || null,
      warning: r ? r.warning : 'Fit incomplete',
      degree: degrees().high === degrees().low ? degrees().high : null,
      trendShape: degrees(),
      branches: r
        ? {
            high: { coefficients: r.high.coeff, rmse: r.high.rmse, rSquared: r.high.r2 },
            low: { coefficients: r.low.coeff, rmse: r.low.rmse, rSquared: r.low.r2 },
            volumeOrigin: r.origin,
            volumeScale: r.scale,
          }
        : null,
      measurements: points,
      note: 'Graphical estimate; not validated against laboratory references. Polynomial coefficients use x=(volume-volumeOrigin)/volumeScale.',
    };
  download(
    JSON.stringify(record, null, 2),
    'psat-branch-analysis.json',
    'application/json',
  );
};

function equations() {
  if (!result) return;
  const r = result;
  let html = '';
  for (const [name, f] of [
    ['High-pressure branch', r.high],
    ['Low-pressure branch', r.low],
  ]) {
    const c = f.coeff,
      fmt = (n) => Number(n).toPrecision(7);
    let formula = 'P = ' + fmt(c[0]);
    for (let i = 1; i < c.length; i++)
      formula +=
        (c[i] < 0 ? ' − ' : ' + ') + fmt(Math.abs(c[i])) + (i === 1 ? 'z' : 'z²');
    html += `<article><div class="eyebrow">${name}</div><code>${formula}</code><div class="fitstats"><span>R² <strong>${f.r2 === null ? 'Undefined' : num(f.r2, 6)}</strong></span><span>RMSE <strong>${num(f.rmse, 4)} ${pressureLabel()}</strong></span><span><strong>${f.count}</strong> points</span></div></article>`;
  }
  html += `<p class="small normalization">For both equations: z = (V − ${num(r.origin, 6)}) / ${num(r.scale, 6)}. Pressure in ${pressureLabel()}; volume in ${$('vunit').value}. Displayed coefficients are rounded; calculations use full precision.</p>`;
  $('equations').innerHTML = html;
}

// Standard atmosphere per pressure unit: gauge readings need it for the Y-function's P_abs.
const ATMOSPHERE = { psi: 14.696, bar: 1.01325, kPa: 101.325, MPa: 0.101325 };
let yResult = null;
// Bubble-point Y-function cross-check of the graphical Pb. Display only: it never changes
// the selections, fits or the main result.
function yCheck() {
  yResult = null;
  const panel = $('yCheck');
  panel.hidden = $('phase').value !== 'bubble' || !result;
  if (panel.hidden) return;
  const { unit, basis } = pressureSelection(),
    atmosphere = basis === 'Gauge' ? ATMOSPHERE[unit] : 0,
    label = pressureLabel(),
    digits = unit === 'MPa' ? 4 : 2;
  $('yNote').textContent =
    (basis === 'Gauge'
      ? `Gauge readings are converted with one standard atmosphere (${num(atmosphere, 6)} ${unit}); this is an assumption, not your laboratory's barometric reading. `
      : 'Readings are treated as absolute pressure. ') +
    'Y = (Pb − P) / (P_abs · (V/Vb − 1)), with Vb read from the high-pressure trend. It should be close to a straight line in P when Pb is right. Points just below Pb are the most sensitive. This check does not change the graphical result.';
  try {
    yResult = PV.yFunction(points, result, atmosphere);
  } catch (e) {
    $('ySummary').textContent = '· not available';
    $('yResult').textContent = e.message;
    $('yChart').innerHTML = '';
    return;
  }
  const y = yResult,
    best = y.best,
    graph = result.intersection;
  const pct = (v) => num(100 * v, 2) + '%';
  $('ySummary').textContent = `· Pb ${num(best.pb, digits)} ${label}`;
  let text = `Most linear Y at Pb = ${num(best.pb, digits)} ${label} (Vb ${num(best.vb, 4)} ${$('vunit').value}; Y line scatter ${pct(best.relativeRmse)} of mean Y).`;
  if (graph) {
    const diff = best.pb - graph.p;
    text += ` Graphical Pb ${num(graph.p, digits)} ${label}: difference ${diff >= 0 ? '+' : '−'}${num(Math.abs(diff), digits)} ${label} (${diff >= 0 ? '+' : '−'}${pct(Math.abs(diff) / graph.p)}).`;
    text += y.graphical
      ? ` At the graphical Pb, Y scatter is ${pct(y.graphical.relativeRmse)}.`
      : ' The graphical Pb is outside the range between the selected branches, so Y cannot be evaluated there.';
  }
  $('yResult').innerHTML =
    esc(text) +
    (y.atEdge
      ? ` <span class="y-flag">${esc(`The most linear Pb is at the edge of the allowed range (${num(y.bracket[0], digits)}–${num(y.bracket[1], digits)} ${label}), so it is not resolved. Review the branch selections.`)}</span>`
      : '');
  $('yChart').innerHTML = yChart(y, label);
}
function esc(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}
function yChart(y, label) {
  const W = 640,
    H = 300,
    l = 64,
    r = 16,
    t = 18,
    b = 48,
    sets = [y.best.rows, ...(y.graphical ? [y.graphical.rows] : [])].flat(),
    ps = sets.map((q) => q.p),
    ys = sets.map((q) => q.y),
    pRange = Math.max(...ps) - Math.min(...ps) || 1,
    yRange = Math.max(...ys) - Math.min(...ys) || Math.abs(ys[0]) || 1,
    X = PVReport.niceAxis(
      Math.max(0, Math.min(...ps) - pRange * 0.06),
      Math.max(...ps) + pRange * 0.06,
      6,
    ),
    Y = PVReport.niceAxis(
      Math.max(0, Math.min(...ys) - yRange * 0.1),
      Math.max(...ys) + yRange * 0.1,
      4,
    );
  const x = (p) => l + ((p - X.min) / (X.max - X.min)) * (W - l - r),
    yy = (v) => H - b - ((v - Y.min) / (Y.max - Y.min)) * (H - t - b);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Y-function versus pressure for the low-pressure points"><defs><clipPath id="yArea"><rect x="${l}" y="${t}" width="${W - l - r}" height="${H - t - b}"/></clipPath></defs>`;
  for (let i = 0; i <= 6; i++) {
    const p = X.min + X.step * i;
    s += `<path d="M${x(p)} ${t}V${H - b}" stroke="#e8efe6"/><text x="${x(p)}" y="${H - b + 18}" text-anchor="middle" font-size="11" fill="#546e5c">${axisTick(p, X.step)}</text>`;
  }
  for (let i = 0; i <= 4; i++) {
    const v = Y.min + Y.step * i;
    s += `<path d="M${l} ${yy(v)}H${W - r}" stroke="#e8efe6"/><text x="${l - 8}" y="${yy(v) + 4}" text-anchor="end" font-size="11" fill="#546e5c">${axisTick(v, Y.step)}</text>`;
  }
  s += `<rect x="${l}" y="${t}" width="${W - l - r}" height="${H - t - b}" fill="none" stroke="#9db3a4"/><g clip-path="url(#yArea)">`;
  const line = (fit, color) =>
    `<path d="M${x(X.min)} ${yy(fit.intercept + fit.slope * X.min)}L${x(X.max)} ${yy(fit.intercept + fit.slope * X.max)}" stroke="${color}" stroke-width="1.6" fill="none"/>`;
  if (y.graphical) {
    s += line(y.graphical, '#a9b5ae');
    y.graphical.rows.forEach(
      (q) =>
        (s += `<circle data-y="graphical" cx="${x(q.p)}" cy="${yy(q.y)}" r="4" fill="white" stroke="#82918c" stroke-width="1.5"><title>Point ${q.id + 1} · Y ${num(q.y, 4)} at graphical Pb</title></circle>`),
    );
  }
  s += line(y.best, '#c97725');
  y.best.rows.forEach(
    (q) =>
      (s += `<circle data-y="best" cx="${x(q.p)}" cy="${yy(q.y)}" r="4.2" fill="#c97725"><title>Point ${q.id + 1} · Y ${num(q.y, 4)} at most-linear Pb</title></circle>`),
  );
  s += `</g><text x="${(W + l - r) / 2}" y="${H - 10}" text-anchor="middle" font-size="12" fill="#52685b">Pressure (${esc(label)})</text><text transform="translate(16 ${(H - b + t) / 2}) rotate(-90)" text-anchor="middle" font-size="12" fill="#52685b">Y (dimensionless)</text>`;
  s += `<g font-size="11" fill="#52685b"><circle cx="${l + 12}" cy="${t + 14}" r="4" fill="#c97725"/><text x="${l + 22}" y="${t + 18}">At most-linear Pb</text>${y.graphical ? `<circle cx="${l + 140}" cy="${t + 14}" r="4" fill="white" stroke="#82918c" stroke-width="1.5"/><text x="${l + 150}" y="${t + 18}">At graphical Pb</text>` : ''}</g></svg>`;
  return s;
}
function phaseSymbol() {
  return $('phase').value === 'bubble'
    ? 'Pb'
    : $('phase').value === 'dew'
      ? 'Pd'
      : 'Psat';
}
function phaseReady() {
  if (['bubble', 'dew'].includes($('phase').value)) return true;
  err(
    'Choose Bubble point or Dew point in the test setup above before entering or analyzing data.',
  );
  return false;
}
function setupPhase() {
  const phase = $('phase').value,
    valid = ['bubble', 'dew'].includes(phase),
    dew = phase === 'dew',
    boundary = $('boundary').value || 'upper',
    direction = $('direction').value || 'unknown';
  ['data', 'file', 'demo', 'load'].forEach((id) => ($(id).disabled = !valid));
  $('boundaryField').hidden = !dew;
  $('psatTitle').textContent =
    phase === 'bubble'
      ? 'ESTIMATED BUBBLE PRESSURE · Pb'
      : dew
        ? 'ESTIMATED DEW PRESSURE · Pd'
        : 'ESTIMATED Psat';
  let text = 'Select the phase above to unlock data entry.',
    high = '',
    low = '';
  if (valid) {
    if (phase === 'bubble') {
      high = 'Liquid';
      low = 'Liquid + gas';
      text =
        'Bubble point: the boundary where gas first appears from a liquid when entering the two-phase region.';
      if (direction === 'decreasing')
        text +=
          ' During pressure reduction, the expected path is liquid → first gas bubble → liquid + gas.';
      if (direction === 'increasing')
        text +=
          ' During compression across this boundary, the expected path is liquid + gas → last gas disappears → liquid.';
    } else {
      if (boundary === 'upper') {
        high = 'Gas';
        low = 'Gas + liquid';
        text =
          'Upper / retrograde dew point: liquid first appears from a gas when pressure is reduced into the two-phase region.';
        if (direction === 'increasing')
          text +=
            ' On the reverse compression path, the remaining liquid disappears at the boundary.';
      } else if (boundary === 'lower') {
        high = 'Gas + liquid';
        low = 'Gas';
        text =
          'Lower dew point: the low-pressure edge of the two-phase envelope. Here the expected single-gas region is on the lower-pressure side.';
        if (direction === 'increasing')
          text += ' On compression into the envelope, the first liquid appears.';
        if (direction === 'decreasing')
          text += ' On expansion out of the envelope, the remaining liquid disappears.';
      } else
        text =
          'Dew point: the boundary where liquid first appears from a gas when entering the two-phase region. Select upper or lower boundary before interpreting the regions.';
    }
    text +=
      ' The selection changes the expected phase labels, not the pressure–volume axes or the fitting equations.';
  }
  text += ' Units label your input; they do not convert its values.';
  $('phaseContext').textContent = text;
  $('expectedRegions').textContent = high
    ? `Expected regions near this boundary: higher pressure — ${high.toLowerCase()}; lower pressure — ${low.toLowerCase()}. These are test-context expectations, not confirmed phase detections.`
    : '';
  $('highLegend').textContent =
    'High-pressure fit' + (high ? ' · ' + high.toLowerCase() + ' expected' : '');
  $('lowLegend').textContent =
    'Low-pressure fit' + (low ? ' · ' + low.toLowerCase() + ' expected' : '');
  if (dew && boundary === 'lower')
    $('demoNote').textContent = demo
      ? 'Example data only — not a lower-dew simulation.'
      : $('demoNote').textContent;
}
['phase', 'direction', 'boundary'].forEach(
  (id) =>
    ($(id).onchange = () => {
      setupPhase();
      if (['bubble', 'dew'].includes($('phase').value)) fitNow();
      else {
        stopFit();
        resetResult();
        render();
      }
    }),
);
setupPhase();
updateWorkspace();

function remember() {
  history.push(points.map((p) => ({ id: p.id, group: p.group })));
  if (history.length > 25) history.shift();
}
function toolHint() {
  $('toolHelp').textContent =
    tool === 'high'
      ? 'Click a point to add it to the high-pressure fit.'
      : tool === 'low'
        ? 'Click a point to add it to the low-pressure fit.'
        : 'Click a point to leave it out of both fits.';
}
function updateWorkspace() {
  $('axisReadout').textContent =
    'Y: Pressure (' + pressureLabel() + ') · X: Volume (' + $('vunit').value + ')';
  $('pointReadout').textContent = '';
  const ready = !!result?.intersection;
  $('present').disabled = !ready;
  $('print').disabled = !ready;
  $('savePdf').disabled = !ready;
  $('undo').disabled = !history.length;
  const raw = $('data').value.trim();
  $('dataState').textContent = points.length
    ? points.length + ' points'
    : raw
      ? 'Not plotted'
      : 'No data';
  $('inputStatus').textContent = points.length
    ? 'Click graph points to adjust the fit.'
    : raw
      ? 'Ready to plot.'
      : $('phase').value
        ? 'Paste data or upload CSV / TXT.'
        : 'Select a test type first.';
  $('summaryCase').textContent =
    $('case').value.trim() || (points.length ? 'Untitled case' : 'No case loaded');
  const phase =
    $('phase').value === 'bubble'
      ? 'Bubble point'
      : $('phase').value === 'dew'
        ? 'Dew point · ' +
          ($('boundary').value === 'lower'
            ? 'lower boundary'
            : $('boundary').value === 'unknown'
              ? 'boundary unconfirmed'
              : 'upper boundary')
        : 'Phase not selected';
  $('summaryMeta').textContent =
    phase +
    ' · ' +
    pressureLabel() +
    ' · ' +
    $('vunit').value +
    ($('temp').value ? ' · ' + $('temp').value + ' ' + $('tunit').value : '');
  $('inputPressureLabel').textContent = 'Pressure (' + pressureLabel() + ')';
  $('inputVolumeLabel').textContent = 'Volume (' + $('vunit').value + ')';
  $('sampleBadge').hidden = !demo;
  if (presentation && !ready) {
    ((presentation = false), (viewBounds = null), (autoBounds = null));
    document.body.classList.toggle('presentation', false);
    $('present').textContent = 'Present';
    $('present').setAttribute('aria-pressed', 'false');
  }
}
$('undo').onclick = () => {
  if (!history.length) return;
  const prev = new Map(history.pop().map((p) => [p.id, p.group]));
  points = points.map((p) => ({ ...p, group: prev.get(p.id) || 'none' }));
  syncRanges();
  fitNow();
};
$('present').onclick = () => {
  if (!result?.intersection) return;
  presentation = !presentation;
  document.body.classList.toggle('presentation', presentation);
  $('present').textContent = presentation ? '← Edit' : 'Present';
  $('present').setAttribute('aria-pressed', presentation ? 'true' : 'false');
  chart();
  window.scrollTo?.({ top: 0, behavior: 'smooth' });
};
window.addEventListener?.('keydown', (e) => {
  if (e.key === 'Escape' && presentation) $('present').onclick();
});
$('case').oninput = () => updateWorkspace();
document.querySelectorAll('a[href="#aboutTool"]').forEach(
  (a) =>
    (a.onclick = () => {
      $('aboutTool').open = true;
    }),
);

// Display bounds are deliberately independent of point selection and regression state.
function axisTick(value, step) {
  const decimals = Math.max(0, Math.ceil(-Math.log10(step)) + 1);
  if (decimals > 8 || Math.abs(value) >= 1e9) {
    const digits = Math.max(
      3,
      Math.min(14, Math.ceil(Math.log10(Math.max(Math.abs(value), step) / step)) + 1),
    );
    return value.toExponential(digits);
  }
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: decimals });
}
function updateScaleControls() {
  const ready = points.length > 0 && autoBounds !== null;
  for (const id of [
    'zoomIn',
    'zoomOut',
    'autoScale',
    'applyScale',
    'vMin',
    'vMax',
    'pMin',
    'pMax',
  ])
    $(id).disabled = !ready;
  $('focusScale').disabled = !ready || !result?.intersection;
  $('scaleMode').textContent = viewBounds ? 'Custom' : 'Automatic';
  $('volumeScaleLabel').textContent = 'Volume · X axis (' + $('vunit').value + ')';
  $('pressureScaleLabel').textContent = 'Pressure · Y axis (' + pressureLabel() + ')';
  const bounds = viewBounds || autoBounds;
  for (const [id, key] of [
    ['vMin', 'vmin'],
    ['vMax', 'vmax'],
    ['pMin', 'pmin'],
    ['pMax', 'pmax'],
  ])
    $(id).value = bounds ? String(bounds[key]) : '';
  if (!ready) $('scaleStatus').textContent = 'Plot data to adjust the graph scale.';
}
function applyView(bounds) {
  if (!points.length || !autoBounds) return;
  const values = Object.values(bounds);
  const valid =
    values.length === 4 &&
    values.every(Number.isFinite) &&
    bounds.vmin >= 0 &&
    bounds.pmin >= 0 &&
    bounds.vmax > bounds.vmin &&
    bounds.pmax > bounds.pmin;
  if (!valid) {
    $('scaleError').textContent =
      'Enter finite, nonnegative limits. Each maximum must be greater than its minimum.';
    return;
  }
  for (const [min, max] of [
    [bounds.vmin, bounds.vmax],
    [bounds.pmin, bounds.pmax],
  ]) {
    if (
      !Number.isFinite(max - min) ||
      max - min < Number.EPSILON * Math.max(Math.abs(min), Math.abs(max), 1) * 1000
    ) {
      $('scaleError').textContent =
        'That range is too narrow to display reliably. Choose a wider axis range.';
      return;
    }
  }
  viewBounds = { ...bounds };
  $('scaleError').textContent = '';
  chart();
}
// Zoom moves one round step smaller ('in') or larger ('out'); focus uses a quarter of the
// automatic range around the intersection. Every result keeps round tick values.
function zoomView(direction, focus = null) {
  if (!autoBounds || !points.length) return;
  const b = viewBounds || autoBounds;
  const axis = (min, max, autoMin, autoMax, divisions, center) => {
    const step = focus
      ? PVReport.niceStep(((autoMax - autoMin) / divisions) * 0.25)
      : PVReport.niceStep(
          (max - min) / divisions,
          direction === 'in' ? 'below' : 'above',
        );
    return PVReport.alignedAxis(center - (divisions * step) / 2, step, divisions);
  };
  const v = axis(
      b.vmin,
      b.vmax,
      autoBounds.vmin,
      autoBounds.vmax,
      X_DIV,
      focus ? focus.v : (b.vmin + b.vmax) / 2,
    ),
    p = axis(
      b.pmin,
      b.pmax,
      autoBounds.pmin,
      autoBounds.pmax,
      Y_DIV,
      focus ? focus.p : (b.pmin + b.pmax) / 2,
    );
  applyView({ vmin: v.min, vmax: v.max, pmin: p.min, pmax: p.max });
}
$('applyScale').onclick = () => {
  const ids = ['vMin', 'vMax', 'pMin', 'pMax'];
  if (ids.some((id) => String($(id).value).trim() === '')) {
    $('scaleError').textContent = 'Enter all four axis limits, or choose Auto scale.';
    return;
  }
  applyView({
    vmin: Number($('vMin').value),
    vmax: Number($('vMax').value),
    pmin: Number($('pMin').value),
    pmax: Number($('pMax').value),
  });
};
$('zoomIn').onclick = () => zoomView('in');
$('zoomOut').onclick = () => zoomView('out');
$('focusScale').onclick = () => {
  if (result?.intersection) zoomView('in', result.intersection);
};
$('autoScale').onclick = () => {
  viewBounds = null;
  $('scaleError').textContent = '';
  chart();
};
updateScaleControls();
