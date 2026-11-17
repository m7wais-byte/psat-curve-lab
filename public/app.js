const $ = (id) => document.getElementById(id);
let points = [],
  result = null,
  tool = 'high',
  demo = false,
  loadedText = '',
  history = [],
  presentation = false;
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
function fitNow() {
  err('');
  resetResult();
  if (!phaseReady()) {
    render();
    return;
  }
  if (points.length) {
    try {
      result = PV.analyze(points, Number($('model').value));
    } catch (e) {
      err(e.message);
    }
  }
  render();
}
function load() {
  err('');
  if (!phaseReady()) return;
  history = [];
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
  try {
    points = PV.autoAssign(points, Number($('model').value));
  } catch (e) {
    err(e.message);
  }
  resetResult();
  if (points.length) {
    try {
      result = PV.analyze(points, Number($('model').value));
    } catch {}
  }
  syncRanges();
  render();
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
  const body = $('points');
  body.replaceChildren();
  points.forEach((p) => {
    let tr = document.createElement('tr');
    tr.className = p.group === 'none' ? 'unassigned' : 'row-' + p.group;
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
    [p.id + 1, num(p.p, 6) + (p.p === 0 ? ' · review zero' : ''), num(p.v, 6)].forEach(
      (value) => {
        let cell = document.createElement('td');
        cell.textContent = value;
        tr.append(cell);
      },
    );
    body.append(tr);
  });
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
  let note = points.some((p) => p.p === 0)
    ? ' Zero-pressure readings are flagged for review; suggestions leave them out.'
    : '';
  if (r) {
    $('evidence').textContent = r.intersection
      ? r.warning
        ? 'Review crossing'
        : 'Intersection found'
      : 'No clear crossing';
    $('evidence').style.color = r.intersection && !r.warning ? '#2563b9' : '#a16c34';
    if (r.intersection) {
      $('psat').innerHTML =
        num(r.intersection.p) +
        ' <small>' +
        $('punit').value +
        ' ' +
        ($('basis').value === 'Gauge' ? 'g' : 'a') +
        '</small>';
      $('vsat').innerHTML =
        num(r.intersection.v) + ' <small>' + $('vunit').value + '</small>';
      $('psatSub').textContent = $('temp').value
        ? `Test temperature ${$('temp').value} ${$('tunit').value}`
        : 'Temperature not provided · graphical estimate';
    }
    $('message').textContent =
      (r.warning ||
        'Independent trends fitted. Dashed portions are extrapolations toward the intersection; review the selected points.') +
      note;
    $('diagnostics').textContent =
      `Pressure RMSE: high branch ${num(r.high.rmse, 4)} ${$('punit').value}; low branch ${num(r.low.rmse, 4)} ${$('punit').value}. ${r.omitted} point(s) remain visible but do not influence either fit.`;
  } else
    $('message').textContent =
      (points.length
        ? 'Assign at least ' +
          (Number($('model').value) + 2) +
          ' points to each branch. Points may be left out of both fits.'
        : 'Your original points stay visible, including those left out of both fits.') +
      note;
  table();
  chart();
  equations();
  updateWorkspace();
}
function chart() {
  if (!points.length) {
    $('chart').innerHTML =
      '<div class="empty"><div class="empty-chart-icon">⌁</div><h3>Your analysis starts with a few points.</h3><p>Choose a phase, paste your measurements,<br>then select <strong>Plot & fit curves</strong>.</p><span class="empty-note">Or explore the workflow with sample data.</span></div>';
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
  vmin -= vs * 0.045;
  vmax += vs * 0.045;
  pmin = Math.max(0, pmin - ps * 0.07);
  pmax += ps * 0.1;
  const x = (v) => l + ((v - vmin) / (vmax - vmin)) * (W - l - rt),
    y = (p) => H - b - ((p - pmin) / (pmax - pmin)) * (H - t - b);
  let h = `<svg id="pvplot" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pressure on vertical axis, volume on horizontal axis; independent branch fits and their intersection"><defs><clipPath id="area"><rect x="${l}" y="${t}" width="${W - l - rt}" height="${H - t - b}"/></clipPath></defs>`;
  const grid = $('grid').value || 'paper';
  h += `<rect x="${l}" y="${t}" width="900" height="500" fill="white"/>`;
  if (r && $('shade').checked) {
    for (const [name, f, color] of [
      ['high', r.high, '#2563b9'],
      ['low', r.low, '#d47726'],
    ])
      h += `<rect data-region="${name}" x="${x(f.min)}" y="${t}" width="${Math.max(0, x(f.max) - x(f.min))}" height="500" fill="${color}" opacity=".055"><title>Selected ${name}-pressure fitting range</title></rect>`;
    h += `<rect data-region="gap" x="${x(r.gap[0])}" y="${t}" width="${Math.max(0, x(r.gap[1]) - x(r.gap[0]))}" height="500" fill="#758499" opacity=".065"><title>Interval between selected fitting ranges</title></rect>`;
  }

  for (let i = 0; i <= 45; i++) {
    let xx = l + i * 20,
      major = i % 5 === 0;
    if (grid === 'none' || (!major && grid !== 'paper')) continue;
    h += `<path d="M${xx} ${t}V${H - b}" stroke="${major ? '#c4d0dd' : '#e8edf3'}" stroke-width="${major ? 1.2 : 0.6}"/>`;
  }
  for (let i = 0; i <= 25; i++) {
    let yy = t + i * 20,
      major = i % 5 === 0;
    if (grid === 'none' || (!major && grid !== 'paper')) continue;
    h += `<path d="M${l} ${yy}H${W - rt}" stroke="${major ? '#c4d0dd' : '#e8edf3'}" stroke-width="${major ? 1.2 : 0.6}"/>`;
  }
  h += `<rect x="${l}" y="${t}" width="900" height="500" fill="none" stroke="#8191a4" stroke-width="1"/><path d="M${l} ${t}V${H - b}H${W - rt}" fill="none" stroke="#34475c" stroke-width="1.8"/>`;
  for (let i = 0; i <= 9; i++) {
    let v = vmin + ((vmax - vmin) * i) / 9;
    h += `<path d="M${x(v)} ${H - b}v6" stroke="#34475c"/><text x="${x(v)}" y="${H - b + 26}" text-anchor="middle" font-size="12" fill="#46596e">${num(v, 3)}</text>`;
  }
  for (let i = 0; i <= 5; i++) {
    let p = pmin + ((pmax - pmin) * i) / 5;
    h += `<path d="M${l - 6} ${y(p)}h6" stroke="#34475c"/><text x="${l - 13}" y="${y(p) + 4}" text-anchor="end" font-size="12" fill="#46596e">${num(p, 1)}</text>`;
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
  if (r) {
    for (let [f, color] of [
      [r.high, '#2563b9'],
      [r.low, '#d47726'],
    ]) {
      h += path(f, f.min, f.max, color, false);
      let target = c ? c.v : (r.gap[0] + r.gap[1]) / 2;
      if (target > f.max) h += path(f, f.max, target, color, true);
      if (target < f.min) h += path(f, target, f.min, color, true);
    }
    if (c) {
      h += `<path d="M${l} ${y(c.p)}H${x(c.v)}V${H - b}" stroke="#718378" stroke-dasharray="4 5"/><circle cx="${x(c.v)}" cy="${y(c.p)}" r="7" fill="white" stroke="#19352f" stroke-width="2.5"/><text x="${Math.min(W - 180, x(c.v) + 15)}" y="${y(c.p) - 17}" font-size="13" fill="#19352f" stroke="white" stroke-width="5" paint-order="stroke">${phaseSymbol()} ${num(c.p)} ${$('punit').value}</text>`;
    }
  }
  points.forEach((p) => {
    let color =
      p.group === 'high' ? '#2563b9' : p.group === 'low' ? '#d47726' : '#9ba69f';
    h += `<g class="chartpoint" tabindex="0" role="button" data-id="${p.id}" aria-label="Assign point ${p.id + 1}, pressure ${p.p}, volume ${p.v}"><circle cx="${x(p.v)}" cy="${y(p.p)}" r="11" fill="transparent"/><circle cx="${x(p.v)}" cy="${y(p.p)}" r="5.2" fill="${p.group === 'none' ? 'white' : color}" stroke="${color}" stroke-width="2"><title>Point ${p.id + 1} · P ${p.p}, V ${p.v} · ${p.group === 'none' ? 'Neither fit' : p.group + ' branch'}</title></circle></g>`;
  });
  h += `<text x="${(W + l - rt) / 2}" y="${H - 13}" text-anchor="middle" font-size="13" fill="#52685b">Volume (${$('vunit').value})</text><text transform="translate(22 ${(H - b + t) / 2}) rotate(-90)" text-anchor="middle" font-size="13" fill="#52685b">Pressure (${$('punit').value}, ${$('basis').value.toLowerCase()})</text></svg>`;
  $('chart').innerHTML = h;
  $('chart')
    .querySelectorAll('[data-id]')
    .forEach((el) => {
      const inspect = () => {
        const p = points.find((p) => p.id === Number(el.dataset.id));
        if (p)
          $('pointReadout').textContent =
            `Point ${p.id + 1} · Pressure ${num(p.p, 6)} ${$('punit').value} · Volume ${num(p.v, 6)} ${$('vunit').value} · ${p.group === 'none' ? 'No fit' : p.group === 'high' ? 'High-pressure fit' : 'Low-pressure fit'}`;
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
  try {
    const suggested = PV.autoAssign(points, Number($('model').value));
    remember();
    points = suggested;
    syncRanges();
    fitNow();
  } catch (e) {
    err(e.message);
  }
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
  points = [];
  history = [];
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
  $('model').value = '2';
  $('case').value =
    'DEMONSTRATION · ' +
    ($('phase').value === 'dew' ? 'dew' : 'bubble') +
    ' curve fitting';
  $('punit').value = 'psi';
  $('basis').value = 'Gauge';
  $('vunit').value = 'cc';
  $('temp').value = '';
  demo = true;
  $('demoNote').textContent =
    'Synthetic curve-fitting demonstration only; not a fluid simulation or laboratory case.';
  load();
  setupPhase();
};
['model', 'temp', 'tunit', 'punit', 'basis', 'vunit'].forEach(
  (id) => ($(id).onchange = () => fitNow()),
);
$('print').onclick = () => window.print();
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
      application: 'Psat Curve Lab v6',
      case: $('case').value,
      syntheticDemo: demo,
      method: 'Independent pressure-versus-volume least-squares branch fits',
      temperature: $('temp').value || null,
      temperatureUnit: $('tunit').value,
      pressureUnit: $('punit').value,
      pressureBasis: $('basis').value,
      volumeUnit: $('vunit').value,
      expectedTransition: $('phase').value,
      pressurePath: $('direction').value,
      dewBoundary: $('phase').value === 'dew' ? $('boundary').value : null,
      phaseLabels:
        'Expected from operator-selected test context, not confirmed by the fit',
      estimatedIntersection: r?.intersection || null,
      warning: r ? r.warning : 'Fit incomplete',
      degree: Number($('model').value),
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
    html += `<article><div class="eyebrow">${name}</div><code>${formula}</code><div class="fitstats"><span>R² <strong>${f.r2 === null ? 'Undefined' : num(f.r2, 6)}</strong></span><span>RMSE <strong>${num(f.rmse, 4)} ${$('punit').value}</strong></span><span><strong>${f.count}</strong> points</span></div></article>`;
  }
  html += `<p class="small normalization">For both equations: z = (V − ${num(r.origin, 6)}) / ${num(r.scale, 6)}. Pressure in ${$('punit').value}; volume in ${$('vunit').value}. Displayed coefficients are rounded; calculations use full precision.</p>`;
  $('equations').innerHTML = html;
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
      ? 'Synthetic curve-fitting example only; it does not simulate a lower dew boundary.'
      : $('demoNote').textContent;
}
['phase', 'direction', 'boundary'].forEach(
  (id) =>
    ($(id).onchange = () => {
      setupPhase();
      if (['bubble', 'dew'].includes($('phase').value)) fitNow();
      else {
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
      ? 'Blue tool selected: click a point to use it in the high-pressure fit.'
      : tool === 'low'
        ? 'Orange tool selected: click a point to use it in the low-pressure fit.'
        : 'Neither fit selected: click a point to leave it visible without affecting either curve.';
}
function updateWorkspace() {
  $('axisReadout').textContent =
    'Y: Pressure (' + $('punit').value + ') · X: Volume (' + $('vunit').value + ')';
  $('pointReadout').textContent =
    'Hover or focus a point to inspect its pressure and volume.';
  const ready = !!result?.intersection;
  $('present').disabled = !ready;
  $('undo').disabled = !history.length;
  const raw = $('data').value.trim();
  $('dataState').textContent = points.length
    ? points.length + ' points'
    : raw
      ? 'Not plotted'
      : 'No data';
  $('inputStatus').textContent = points.length
    ? 'Your points are plotted. Refine the branch selections on the graph.'
    : raw
      ? 'Measurements entered. Select Plot & fit curves to continue.'
      : $('phase').value
        ? 'Paste your measurements or import a CSV / TXT file.'
        : 'Choose a phase above to get started.';
  $('summaryCase').textContent =
    $('case').value.trim() ||
    (points.length ? 'Untitled analysis' : 'Your next analysis');
  const phase =
    $('phase').value === 'bubble'
      ? 'Bubble-point analysis'
      : $('phase').value === 'dew'
        ? 'Dew-point analysis · ' +
          ($('boundary').value === 'lower'
            ? 'lower boundary'
            : $('boundary').value === 'unknown'
              ? 'boundary unconfirmed'
              : 'upper boundary')
        : 'Phase not selected';
  $('summaryMeta').textContent =
    phase +
    ' · ' +
    $('punit').value +
    ' ' +
    ($('basis').value || '').toLowerCase() +
    ' · ' +
    $('vunit').value +
    ' · ' +
    ($('temp').value
      ? $('temp').value + ' ' + $('tunit').value
      : 'Temperature not provided');
  $('sampleBadge').hidden = !demo;
  if (presentation && !ready) {
    presentation = false;
    document.body.classList.toggle('presentation', false);
    $('present').textContent = '▣ Presentation view';
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
  $('present').textContent = presentation ? '← Back to editing' : '▣ Presentation view';
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
