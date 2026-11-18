(function (root) {
  const REPORT_CSS =
    '\n      body {\n        margin: 0;\n        padding: 20px;\n        background: #f1f5f2;\n        font:\n          13px/1.5 Arial,\n          Helvetica,\n          sans-serif;\n        color: #29443a;\n      }\n      .preview-toolbar {\n        max-width: 680px;\n        margin: 0 auto 16px;\n        display: flex;\n        justify-content: space-between;\n        align-items: center;\n        gap: 16px;\n      }\n      .preview-toolbar h1 {\n        font-size: 16px;\n        font-weight: 500;\n        margin: 0;\n      }\n      .preview-toolbar p {\n        font-size: 12px;\n        color: #687e70;\n        margin: 4px 0 0;\n      }\n      .preview-toolbar button,\n      .preview-toolbar a {\n        background: #0f766e;\n        color: white;\n        border: 0;\n        border-radius: 6px;\n        padding: 10px 14px;\n        font:\n          13px Arial,\n          sans-serif;\n        cursor: pointer;\n        white-space: nowrap;\n      }\n      .preview-toolbar button:focus-visible,\n      .preview-toolbar a:focus-visible {\n        outline: 3px solid #8dbca4;\n        outline-offset: 3px;\n      }\n      .preview-actions {\n        display: flex;\n        gap: 8px;\n        flex-wrap: wrap;\n      }\n      .preview-toolbar a {\n        display: inline-block;\n        text-decoration: none;\n        background: white;\n        color: #0f766e;\n        box-shadow: inset 0 0 0 1px #a7cbbb;\n      }\n      @media (max-width: 480px) {\n        body {\n          padding: 12px;\n        }\n        .preview-toolbar {\n          align-items: flex-start;\n        }\n        .preview-toolbar button,\n        .preview-toolbar a {\n          font-size: 11px;\n          padding: 9px 10px;\n        }\n      }\n      @media print {\n        body {\n          padding: 0;\n          margin: 0;\n          background: white;\n        }\n        .preview-toolbar {\n          display: none !important;\n        }\n      }\n    \n\n        #case-a4-report {\n          --paper: #fff;\n          --ink: #223b35;\n          --quiet: #66796f;\n          --rule: #d8e3dc;\n          --high: #0f766e;\n          --low: #c97725;\n          max-width: 680px;\n          margin: 0 auto;\n          font:\n            13px/1.5 Arial,\n            Helvetica,\n            sans-serif;\n          color: var(--ink);\n        }\n        #case-a4-report * {\n          box-sizing: border-box;\n        }\n        #case-a4-report .paper {\n          background: var(--paper);\n          border: 1px solid var(--rule);\n          padding: 30px 34px 23px;\n          aspect-ratio: 210/297;\n          display: flex;\n          flex-direction: column;\n          gap: 14px;\n        }\n        #case-a4-report .report-header {\n          display: flex;\n          align-items: center;\n          justify-content: space-between;\n          gap: 20px;\n          padding-bottom: 16px;\n          border-bottom: 2px solid var(--high);\n        }\n        #case-a4-report .logo {\n          width: 128px;\n          min-width: 128px;\n          height: 76px;\n          display: flex;\n          align-items: center;\n          border: 0;\n        }\n        #case-a4-report .logo svg {\n          display: block;\n          width: 128px;\n          height: 76px;\n        }\n\n        #case-a4-report .heading {\n          text-align: right;\n        }\n        #case-a4-report h1 {\n          margin: 0;\n          font-size: 20px;\n          line-height: 1.25;\n          font-weight: 500;\n          letter-spacing: -0.35px;\n        }\n        #case-a4-report .subtitle {\n          margin-top: 5px;\n          font-size: 12px;\n          color: var(--quiet);\n        }\n        #case-a4-report .draft {\n          display: inline-block;\n          margin-top: 7px;\n          font-size: 11px;\n          color: #927039;\n        }\n        #case-a4-report .details {\n          display: grid;\n          grid-template-columns: 1fr 1fr;\n          column-gap: 25px;\n          row-gap: 7px;\n        }\n        #case-a4-report .detail {\n          display: flex;\n          gap: 10px;\n          justify-content: space-between;\n          border-bottom: 1px solid #edf1ed;\n          padding-bottom: 5px;\n          font-size: 12px;\n        }\n        #case-a4-report .label {\n          color: var(--quiet);\n        }\n        #case-a4-report .value {\n          text-align: right;\n          font-weight: 500;\n        }\n        #case-a4-report .results {\n          display: grid;\n          grid-template-columns: 1fr 1fr;\n          gap: 23px;\n          padding: 13px 0 14px;\n          border-top: 1px solid var(--rule);\n          border-bottom: 1px solid var(--rule);\n        }\n        #case-a4-report .result-label {\n          font-size: 12px;\n          color: var(--quiet);\n        }\n        #case-a4-report .result-number {\n          font-size: 30px;\n          font-weight: 500;\n          letter-spacing: -0.8px;\n          margin-top: 4px;\n          font-variant-numeric: tabular-nums;\n        }\n        #case-a4-report .result-number span {\n          font-size: 13px;\n          letter-spacing: 0;\n          margin-left: 5px;\n          color: var(--quiet);\n        }\n        #case-a4-report .plot-heading {\n          display: flex;\n          align-items: center;\n          justify-content: space-between;\n          gap: 10px;\n          font-size: 12px;\n          padding-top: 1px;\n        }\n        #case-a4-report .plot-heading strong {\n          font-weight: 500;\n        }\n        #case-a4-report .plot-heading span {\n          color: var(--quiet);\n          font-size: 11px;\n        }\n        #case-a4-report .plot {\n          width: 100%;\n        }\n        #case-a4-report .plot svg {\n          display: block;\n          width: 100%;\n          height: auto;\n          overflow: visible;\n          font-family: Arial, Helvetica, sans-serif;\n        }\n        #case-a4-report .legend {\n          display: flex;\n          justify-content: center;\n          gap: 18px;\n          flex-wrap: wrap;\n          font-size: 11px;\n          color: var(--quiet);\n          margin-top: 1px;\n        }\n        #case-a4-report .legend span {\n          display: flex;\n          align-items: center;\n          gap: 6px;\n        }\n        #case-a4-report .swatch {\n          display: inline-block;\n          width: 20px;\n          height: 0;\n          border-top: 2px solid var(--high);\n        }\n        #case-a4-report .swatch.low {\n          border-color: var(--low);\n        }\n        #case-a4-report .swatch.extension {\n          border-color: #7e8d84;\n          border-top-style: dashed;\n        }\n\n        #case-a4-report .swatch.excluded {\n          width: 7px;\n          height: 7px;\n          border: 1.3px solid #8b9790;\n          border-radius: 50%;\n          background: white;\n        }\n        #case-a4-report .fit-summary {\n          display: grid;\n          grid-template-columns: 1fr 1fr;\n          gap: 22px;\n          border-top: 1px solid var(--rule);\n          padding-top: 13px;\n        }\n        #case-a4-report .fit-label {\n          display: flex;\n          align-items: center;\n          gap: 7px;\n          font-size: 12px;\n        }\n        #case-a4-report .fit-label i {\n          width: 7px;\n          height: 7px;\n          background: var(--high);\n          border-radius: 50%;\n        }\n        #case-a4-report .fit-label .low {\n          background: var(--low);\n        }\n        #case-a4-report .r2 {\n          margin-top: 5px;\n          font-size: 20px;\n          font-weight: 500;\n          font-variant-numeric: tabular-nums;\n        }\n        #case-a4-report .report-footer {\n          margin-top: auto;\n          padding-top: 12px;\n          border-top: 1px solid var(--rule);\n          display: flex;\n          gap: 12px;\n          justify-content: space-between;\n          color: var(--quiet);\n          font-size: 11px;\n        }\n        @media (max-width: 480px) {\n          #case-a4-report .paper {\n            padding: 19px 15px;\n            gap: 13px;\n            aspect-ratio: auto;\n          }\n          #case-a4-report .report-header {\n            gap: 12px;\n          }\n          #case-a4-report .logo {\n            width: 96px;\n            min-width: 96px;\n            height: 60px;\n          }\n          #case-a4-report .logo svg {\n            width: 96px;\n            height: 60px;\n          }\n          #case-a4-report h1 {\n            font-size: 17px;\n          }\n          #case-a4-report .details {\n            gap: 7px 15px;\n          }\n          #case-a4-report .detail {\n            flex-direction: column;\n            gap: 2px;\n            font-size: 11px;\n          }\n          #case-a4-report .value {\n            text-align: left;\n          }\n          #case-a4-report .result-number {\n            font-size: 24px;\n          }\n          #case-a4-report .result-number span {\n            font-size: 11px;\n          }\n          #case-a4-report .plot-heading {\n            align-items: flex-start;\n          }\n          #case-a4-report .plot-heading span {\n            max-width: 100px;\n            text-align: right;\n          }\n          #case-a4-report .legend {\n            gap: 10px;\n          }\n          #case-a4-report .r2 {\n            font-size: 18px;\n          }\n          #case-a4-report .report-footer {\n            flex-wrap: wrap;\n          }\n        }\n        @media print {\n          @page {\n            size: A4 portrait;\n            margin: 0;\n          }\n          #case-a4-report {\n            max-width: none;\n            width: 210mm;\n          }\n          #case-a4-report .paper {\n            width: 210mm;\n            min-height: 297mm;\n            padding: 12mm;\n            border: 0;\n          }\n        }\n      \n#case-a4-report .report-warning, #case-a4-report #reportError {font-size:12px;line-height:1.7;color:#94602e;background:#fff7ec;padding:10px 12px;border-radius:4px;}\n';
  const LOGO_SVG =
    '<svg\n              xmlns="http://www.w3.org/2000/svg"\n              viewBox="0 0 200 118"\n              role="img"\n              aria-label="VAPS logo, recreated vector draft"\n            >\n              <path\n                d="M7 8C33 5 47 12 54 35L69 85L111 30L61 109L39 50C31 25 25 12 7 8Z"\n                fill="#2d7db8"\n              />\n              <path d="M62 104L112 28" fill="none" stroke="#2d7db8" stroke-width="1.6" />\n              <path d="M66 108L116 30" fill="none" stroke="#25ad68" stroke-width="2.1" />\n              <g transform="translate(31 49)">\n                <circle r="16" fill="#fff" />\n                <g fill="#2d7db8">\n                  <rect x="-1.8" y="-16.1" width="3.6" height="5.5" rx=".5" />\n                  <rect\n                    x="-1.8"\n                    y="-16.1"\n                    width="3.6"\n                    height="5.5"\n                    rx=".5"\n                    transform="rotate(30)"\n                  />\n                  <rect\n                    x="-1.8"\n                    y="-16.1"\n                    width="3.6"\n                    height="5.5"\n                    rx=".5"\n                    transform="rotate(60)"\n                  />\n                  <rect\n                    x="-1.8"\n                    y="-16.1"\n                    width="3.6"\n                    height="5.5"\n                    rx=".5"\n                    transform="rotate(90)"\n                  />\n                  <rect\n                    x="-1.8"\n                    y="-16.1"\n                    width="3.6"\n                    height="5.5"\n                    rx=".5"\n                    transform="rotate(120)"\n                  />\n                  <rect\n                    x="-1.8"\n                    y="-16.1"\n                    width="3.6"\n                    height="5.5"\n                    rx=".5"\n                    transform="rotate(150)"\n                  />\n                  <rect\n                    x="-1.8"\n                    y="-16.1"\n                    width="3.6"\n                    height="5.5"\n                    rx=".5"\n                    transform="rotate(180)"\n                  />\n                  <rect\n                    x="-1.8"\n                    y="-16.1"\n                    width="3.6"\n                    height="5.5"\n                    rx=".5"\n                    transform="rotate(210)"\n                  />\n                  <rect\n                    x="-1.8"\n                    y="-16.1"\n                    width="3.6"\n                    height="5.5"\n                    rx=".5"\n                    transform="rotate(240)"\n                  />\n                  <rect\n                    x="-1.8"\n                    y="-16.1"\n                    width="3.6"\n                    height="5.5"\n                    rx=".5"\n                    transform="rotate(270)"\n                  />\n                  <rect\n                    x="-1.8"\n                    y="-16.1"\n                    width="3.6"\n                    height="5.5"\n                    rx=".5"\n                    transform="rotate(300)"\n                  />\n                  <rect\n                    x="-1.8"\n                    y="-16.1"\n                    width="3.6"\n                    height="5.5"\n                    rx=".5"\n                    transform="rotate(330)"\n                  />\n                </g>\n                <circle r="12.2" fill="#fff" stroke="#2d7db8" stroke-width="2.1" />\n                <circle r="8.7" fill="#28bf74" />\n              </g>\n              <text\n                x="94"\n                y="85"\n                font-family="Arial,Helvetica,sans-serif"\n                font-size="38"\n                font-weight="700"\n                letter-spacing=".1"\n                fill="#2d7db8"\n              >\n                APS\n              </text>\n            </svg>';
  const COLOR = {
    ink: '#223b35',
    quiet: '#66796f',
    rule: '#d8e3dc',
    high: '#0f766e',
    low: '#c97725',
    excluded: '#8b9790',
  };
  const esc = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const fmt = (value, digits) =>
    Number(value).toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  function buildModel(input) {
    const r = input.result;
    if (!r?.intersection || !input.points?.length)
      throw new Error(
        'Fit both branches and find an intersection before creating the report.',
      );
    const model = {
      caseName: String(input.caseName || 'Untitled case'),
      phase: input.phase || 'unknown',
      pressureUnit: String(input.pressureUnit || 'psi'),
      pressureBasis: String(input.pressureBasis || 'Gauge'),
      volumeUnit: String(input.volumeUnit || 'cc'),
      temperature:
        input.temperature === '' || input.temperature == null
          ? null
          : String(input.temperature),
      temperatureUnit: String(input.temperatureUnit || '°C'),
      boundary: input.boundary || 'unknown',
      date:
        input.date ||
        new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Muscat',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).format(new Date()),
      syntheticDemo: !!input.syntheticDemo,
      warning: String(r.warning || ''),
      grid: ['paper', 'major', 'none'].includes(input.grid) ? input.grid : 'paper',
      origin: r.origin,
      scale: r.scale,
      intersection: { p: r.intersection.p, v: r.intersection.v },
      points: input.points.map((p, i) => ({ id: i, p: p.p, v: p.v, group: p.group })),
      high: {
        coefficients: [...r.high.coeff],
        rSquared: r.high.r2,
        min: r.high.min,
        max: r.high.max,
      },
      low: {
        coefficients: [...r.low.coeff],
        rSquared: r.low.r2,
        min: r.low.min,
        max: r.low.max,
      },
    };
    validate(model);
    return model;
  }
  function validate(m) {
    if (
      !m ||
      !Array.isArray(m.points) ||
      !m.points.length ||
      !Number.isFinite(m.origin) ||
      !Number.isFinite(m.scale) ||
      m.scale <= 0 ||
      !Number.isFinite(m.intersection?.p) ||
      !Number.isFinite(m.intersection?.v)
    )
      throw new Error('The report needs a valid fitted case.');
    for (const p of m.points)
      if (
        !Number.isFinite(p.p) ||
        !Number.isFinite(p.v) ||
        !['high', 'low', 'none'].includes(p.group)
      )
        throw new Error('Invalid report measurement.');
    for (const f of [m.high, m.low])
      if (
        !f ||
        !Array.isArray(f.coefficients) ||
        f.coefficients.length < 2 ||
        !f.coefficients.every(Number.isFinite) ||
        !Number.isFinite(f.min) ||
        !Number.isFinite(f.max)
      )
        throw new Error('Invalid fitted branch in report.');
  }
  function unit(m, compact = false) {
    const suffix = m.pressureBasis === 'Gauge' ? 'g' : 'a';
    return m.pressureUnit === 'psi' ? 'psi' + suffix : m.pressureUnit + ' ' + suffix;
  }
  function phaseName(m) {
    return m.phase === 'bubble'
      ? 'Bubble point'
      : m.phase === 'dew'
        ? 'Dew point' +
          (m.boundary === 'upper' ? ' - upper' : m.boundary === 'lower' ? ' - lower' : '')
        : 'Unconfirmed';
  }
  function label(m) {
    return (
      'Psat: ' +
      fmt(m.intersection.p, 2) +
      ' ' +
      unit(m, true) +
      ' @ ' +
      fmt(m.intersection.v, 3) +
      ' ' +
      m.volumeUnit
    );
  }
  function rSquared(f) {
    return f.rSquared == null || !Number.isFinite(f.rSquared)
      ? 'Undefined'
      : f.rSquared.toFixed(6);
  }
  function predict(m, f, v) {
    const z = (v - m.origin) / m.scale;
    return f.coefficients.reduce((sum, c, i) => sum + c * z ** i, 0);
  }
  function bounds(m) {
    const volumes = [...m.points.map((p) => p.v), m.intersection.v],
      pressures = [...m.points.map((p) => p.p), m.intersection.p];
    let vmin = Math.min(...volumes),
      vmax = Math.max(...volumes),
      pmin = Math.min(...pressures),
      pmax = Math.max(...pressures);
    const vs = vmax - vmin || 1,
      ps = pmax - pmin || 1;
    return {
      vmin: Math.max(0, vmin - vs * 0.045),
      vmax: vmax + vs * 0.045,
      pmin: Math.max(0, pmin - ps * 0.07),
      pmax: pmax + ps * 0.1,
    };
  }
  function tick(v, step) {
    const d = Math.max(0, Math.ceil(-Math.log10(step)) + 1);
    return d > 7 || Math.abs(v) >= 1e9
      ? v.toExponential(Math.min(12, Math.max(3, d)))
      : v.toLocaleString('en-US', { maximumFractionDigits: d });
  }
  function svg(m, width = 608) {
    validate(m);
    const w = Math.max(240, Math.round(width)),
      l = 57,
      r = 12,
      t = 16,
      b = 46,
      cols = w >= 480 ? 8 : 4,
      rows = w >= 480 ? 4 : 5;
    const cell = (w - l - r) / cols,
      ph = cell * rows,
      h = t + ph + b,
      B = bounds(m),
      C = m.intersection;
    const x = (v) => l + ((v - B.vmin) / (B.vmax - B.vmin)) * (w - l - r),
      y = (p) => t + ph - ((p - B.pmin) / (B.pmax - B.pmin)) * ph;
    let s = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Final pressure-volume report graph; all measurements shown, including points excluded from both fits"><defs><clipPath id="final-report-area"><rect x="${l}" y="${t}" width="${w - l - r}" height="${ph}"/></clipPath></defs>`;
    if (m.grid !== 'none') {
      for (let i = 0; i <= cols * 5; i++) {
        if (i % 5 && m.grid !== 'paper') continue;
        const xx = l + (i * cell) / 5;
        s += `<line x1="${xx}" y1="${t}" x2="${xx}" y2="${t + ph}" stroke="${i % 5 ? '#eef3ef' : '#cedbd3'}" stroke-width="${i % 5 ? 0.45 : 0.8}"/>`;
      }
      for (let i = 0; i <= rows * 5; i++) {
        if (i % 5 && m.grid !== 'paper') continue;
        const yy = t + (i * cell) / 5;
        s += `<line x1="${l}" y1="${yy}" x2="${w - r}" y2="${yy}" stroke="${i % 5 ? '#eef3ef' : '#cedbd3'}" stroke-width="${i % 5 ? 0.45 : 0.8}"/>`;
      }
    }
    s += `<rect x="${l}" y="${t}" width="${w - l - r}" height="${ph}" fill="none" stroke="#9db3a4" stroke-width=".8"/>`;
    for (let i = 0; i <= cols; i++) {
      const v = B.vmin + ((B.vmax - B.vmin) * i) / cols;
      s += `<text x="${x(v)}" y="${t + ph + 19}" text-anchor="middle" font-size="11" fill="#546e5c">${tick(v, (B.vmax - B.vmin) / cols)}</text>`;
    }
    for (let i = 0; i <= rows; i++) {
      const p = B.pmin + ((B.pmax - B.pmin) * i) / rows;
      s += `<text x="${l - 9}" y="${y(p) + 4}" text-anchor="end" font-size="11" fill="#546e5c">${tick(p, (B.pmax - B.pmin) / rows)}</text>`;
    }
    function curve(f, a, b, color, dash) {
      let d = '';
      for (let i = 0; i <= 100; i++) {
        const v = a + ((b - a) * i) / 100;
        d += (i ? 'L' : 'M') + x(v) + ',' + y(predict(m, f, v));
      }
      return `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.9"${dash ? ' stroke-dasharray="5 4"' : ''}/>`;
    }
    s +=
      `<g clip-path="url(#final-report-area)">` +
      curve(m.high, m.high.min, m.high.max, COLOR.high, false) +
      curve(m.high, m.high.max, C.v, COLOR.high, true) +
      curve(m.low, m.low.min, m.low.max, COLOR.low, false) +
      curve(m.low, C.v, m.low.min, COLOR.low, true);
    s += `<path d="M${l},${y(C.p)}H${x(C.v)}V${t + ph}" fill="none" stroke="#6b8272" stroke-width=".9" stroke-dasharray="3 4"/>`;
    m.points.forEach((p) => {
      const color =
        p.group === 'high' ? COLOR.high : p.group === 'low' ? COLOR.low : COLOR.excluded;
      s += `<circle data-report-point="${p.id}" data-group="${p.group}" cx="${x(p.v)}" cy="${y(p.p)}" r="3.2" fill="white" stroke="${color}" stroke-width="1.3"/>`;
    });
    s += `<circle cx="${x(C.v)}" cy="${y(C.p)}" r="4.7" fill="white" stroke="${COLOR.ink}" stroke-width="1.6"/></g>`;
    const ax = w - r - 7,
      ay = Math.max(t + 14, Math.min(t + ph - 22, y(C.p) - 20));
    s += `<text data-report-annotation="psat" x="${ax}" y="${ay}" text-anchor="end" font-size="11" fill="${COLOR.ink}" stroke="white" stroke-width="4" paint-order="stroke">${w >= 360 ? esc(label(m)) : `<tspan x="${ax}">Psat: ${fmt(C.p, 2)} ${esc(unit(m, true))}</tspan><tspan x="${ax}" dy="15">@ ${fmt(C.v, 3)} ${esc(m.volumeUnit)}</tspan>`}</text>`;
    return (
      s +
      `<text x="${l + (w - l - r) / 2}" y="${h - 6}" text-anchor="middle" font-size="12" fill="#344f3d">Volume (${esc(m.volumeUnit)})</text><text transform="translate(13 ${t + ph / 2}) rotate(-90)" text-anchor="middle" font-size="12" fill="#344f3d">Pressure (${esc(unit(m, true))})</text></svg>`
    );
  }
  function html(m, base = '') {
    validate(m);
    const excluded = m.points.filter((p) => p.group === 'none').length;
    const row = (a, b) =>
      `<div class="detail"><span class="label">${esc(a)}</span><span class="value">${esc(b)}</span></div>`;
    const payload = JSON.stringify(m)
      .replace(/</g, '\\u003c')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${esc(base)}"><title>${esc(m.caseName)} - saturation pressure report</title><style>${REPORT_CSS}</style></head><body><header class="preview-toolbar"><div><h1>A4 report</h1><p>${esc(m.caseName)}</p></div><div class="preview-actions"><button onclick="window.print()">Print</button><button id="downloadCasePdf" disabled>Save as PDF</button></div></header><div id="case-a4-report"><article class="paper"><div class="report-header"><div class="logo">${LOGO_SVG}</div><div class="heading"><h1>Saturation pressure report</h1><div class="subtitle">Final pressure–volume plot</div><div class="draft">${m.syntheticDemo ? 'EXAMPLE DATA' : 'GRAPHICAL ESTIMATE'}</div></div></div><div class="details">${row('Sample / case', m.caseName)}${row('Date', m.date)}${row('Test type', phaseName(m))}${row('Temperature', m.temperature === null ? 'Not recorded' : m.temperature + ' ' + m.temperatureUnit)}${row('Pressure unit', unit(m))}${row('Volume unit', m.volumeUnit)}</div><div class="results"><div><div class="result-label">Estimated saturation pressure · Psat</div><div class="result-number">${fmt(m.intersection.p, 2)}<span>${esc(unit(m))}</span></div></div><div><div class="result-label">Volume at saturation · Vsat</div><div class="result-number">${fmt(m.intersection.v, 4)}<span>${esc(m.volumeUnit)}</span></div></div></div>${m.warning ? `<div class="report-warning">Review: ${esc(m.warning)}</div>` : ''}<div><div class="plot-heading"><strong>Pressure–volume graph</strong><span>${m.points.length - excluded} points used · ${excluded} excluded</span></div><div class="plot" id="finalGraph">${svg(m)}</div><div class="legend"><span><i class="swatch"></i>High-pressure fit</span><span><i class="swatch low"></i>Low-pressure fit</span><span><i class="swatch extension"></i>Extended trend</span><span><i class="swatch excluded"></i>Excluded points</span></div></div><div class="fit-summary"><div><div class="fit-label"><i></i>High-pressure fit</div><div class="r2">R² = ${rSquared(m.high)}</div></div><div><div class="fit-label"><i class="low"></i>Low-pressure fit</div><div class="r2">R² = ${rSquared(m.low)}</div></div></div><div class="report-footer"><span>Excluded points shown; not used in either fit</span><span>A4 portrait · Page 1 of 1</span></div></article><div id="reportError" role="alert"></div></div><script src="vendor/jspdf.umd.min.js?v=4.2.1"><\/script><script src="report.js?v=1"><\/script><script>const caseReport=${payload};const plot=document.getElementById('finalGraph');function redraw(){plot.innerHTML=PVReport.svg(caseReport,plot.getBoundingClientRect().width||608);}redraw();if(window.ResizeObserver)new ResizeObserver(redraw).observe(plot);const pdfButton=document.getElementById('downloadCasePdf');pdfButton.disabled=false;pdfButton.onclick=()=>{try{PVReport.save(caseReport);}catch(e){document.getElementById('reportError').textContent=e.message;}};<\/script></body></html>`;
  }
  function open(m, options = {}) {
    const target = root.open('', '_blank');
    if (!target) return null;
    target.document.open();
    if (options.print)
      target.addEventListener('load', () => target.print(), { once: true });
    target.document.write(html(m, root.location?.href || ''));
    target.document.close();
    return target;
  }
  function filename(m) {
    return (
      (m.caseName
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 70) || 'psat-report') + '-report.pdf'
    );
  }
  function save(m) {
    const doc = createPdf(m);
    doc.save(filename(m));
    return doc;
  }
  // Native PDF drawing: curves, logo and text remain vector objects.
  function createPdf(m, Constructor = root.jspdf?.jsPDF) {
    validate(m);
    if (!Constructor)
      throw new Error('PDF tools have not loaded. Refresh the page and try again.');
    if (/[^\u0000-\u00ff]/.test(m.caseName))
      throw new Error(
        'For this case name, use Print and choose Save as PDF to preserve all characters.',
      );
    const doc = new Constructor({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
      compress: false,
    });
    doc.setProperties({
      title: m.caseName + ' - saturation pressure report',
      author: 'Psat Curve Lab',
    });
    const W = doc.internal.pageSize.getWidth(),
      H = doc.internal.pageSize.getHeight(),
      M = 36,
      mid = W / 2 + 10;
    function text(
      x,
      y,
      value,
      size = 10,
      color = COLOR.ink,
      align = 'left',
      bold = false,
    ) {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.setTextColor(color);
      doc.text(Array.isArray(value) ? value : String(value), x, y, { align });
    }
    function line(x1, y1, x2, y2, color = COLOR.rule, width = 0.6) {
      doc.setDrawColor(color);
      doc.setLineWidth(width);
      doc.line(x1, y1, x2, y2);
    }
    function polygon(points, color) {
      doc.setFillColor(color);
      doc
        .path(
          points
            .map((p, i) => ({ op: i ? 'l' : 'm', c: p }))
            .concat([{ op: 'h', c: [] }]),
        )
        .fill();
    }
    function logo(x, y, width) {
      const s = width / 200,
        P = (a, b) => [x + a * s, y + b * s];
      doc.setFillColor('#2d7db8');
      doc
        .path([
          { op: 'm', c: P(7, 8) },
          { op: 'c', c: [...P(33, 5), ...P(47, 12), ...P(54, 35)] },
          { op: 'l', c: P(69, 85) },
          { op: 'l', c: P(111, 30) },
          { op: 'l', c: P(61, 109) },
          { op: 'l', c: P(39, 50) },
          { op: 'c', c: [...P(31, 25), ...P(25, 12), ...P(7, 8)] },
          { op: 'h', c: [] },
        ])
        .fill();
      line(...P(62, 104), ...P(112, 28), '#2d7db8', 1.6 * s);
      line(...P(66, 108), ...P(116, 30), '#25ad68', 2.1 * s);
      doc.setFillColor('#ffffff');
      doc.circle(...P(31, 49), 16 * s, 'F');
      for (let angle = 0; angle < 360; angle += 30) {
        const a = (angle * Math.PI) / 180;
        polygon(
          [
            [-1.8, -16.1],
            [1.8, -16.1],
            [1.8, -10.6],
            [-1.8, -10.6],
          ].map(([u, v]) =>
            P(
              31 + u * Math.cos(a) - v * Math.sin(a),
              49 + u * Math.sin(a) + v * Math.cos(a),
            ),
          ),
          '#2d7db8',
        );
      }
      doc.setFillColor('#ffffff');
      doc.setDrawColor('#2d7db8');
      doc.setLineWidth(2.1 * s);
      doc.circle(...P(31, 49), 12.2 * s, 'FD');
      doc.setFillColor('#28bf74');
      doc.circle(...P(31, 49), 8.7 * s, 'F');
      text(...P(94, 85), 'APS', 38 * s, '#2d7db8', 'left', true);
    }
    logo(M, M, 105);
    text(W - M, 44, 'Saturation pressure report', 17, COLOR.ink, 'right');
    text(W - M, 62, 'Final pressure-volume plot', 10, COLOR.quiet, 'right');
    text(
      W - M,
      80,
      m.syntheticDemo ? 'EXAMPLE DATA' : 'GRAPHICAL ESTIMATE',
      9,
      '#927039',
      'right',
    );
    line(M, 108, W - M, 108, COLOR.high, 1.3);
    const rows = [
      ['Sample / case', m.caseName, 'Date', m.date],
      [
        'Test type',
        phaseName(m),
        'Temperature',
        m.temperature === null ? 'Not recorded' : m.temperature + ' ' + m.temperatureUnit,
      ],
      ['Pressure unit', unit(m), 'Volume unit', m.volumeUnit],
    ];
    let rowY = 134;
    for (const [a, b, d, e] of rows) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const left = doc.splitTextToSize(String(b), mid - M - 95),
        right = doc.splitTextToSize(String(e), W - M - mid - 85);
      const lines = Math.max(left.length, right.length);
      text(M, rowY, a, 9, COLOR.quiet);
      text(mid - 24, rowY, left, 9, COLOR.ink, 'right');
      text(mid, rowY, d, 9, COLOR.quiet);
      text(W - M, rowY, right, 9, COLOR.ink, 'right');
      const rowHeight = Math.max(21, lines * 11 + 7);
      line(M, rowY + rowHeight - 14, mid - 24, rowY + rowHeight - 14, '#edf1ed', 0.4);
      line(mid, rowY + rowHeight - 14, W - M, rowY + rowHeight - 14, '#edf1ed', 0.4);
      rowY += rowHeight;
    }
    const offset = Math.max(0, rowY - 197);
    line(M, 199 + offset, W - M, 199 + offset);
    text(M, 217 + offset, 'Estimated saturation pressure - Psat', 9, COLOR.quiet);
    text(mid, 217 + offset, 'Volume at saturation - Vsat', 9, COLOR.quiet);
    text(M, 247 + offset, fmt(m.intersection.p, 2), 25);
    text(M + 125, 247 + offset, unit(m), 10, COLOR.quiet);
    text(mid, 247 + offset, fmt(m.intersection.v, 4), 25);
    text(mid + 120, 247 + offset, m.volumeUnit, 10, COLOR.quiet);
    line(M, 263 + offset, W - M, 263 + offset);
    let warningHeight = 0;
    if (m.warning) {
      doc.setFontSize(9);
      const lines = doc.splitTextToSize('Review: ' + m.warning, W - 2 * M);
      doc.setTextColor('#94602e');
      doc.text(lines, M, 279 + offset);
      warningHeight = lines.length * 11 + 10;
    }
    const top = 309 + offset + warningHeight,
      cell = Math.min((W - 2 * M - 48) / 8, (H - 170 - top) / 4),
      left = M + 45,
      right = left + cell * 8,
      bottom = top + cell * 4,
      B = bounds(m),
      C = m.intersection;
    if (cell < 30)
      throw new Error(
        'The case details are too long for a one-page report. Shorten the case name.',
      );
    const x = (v) => left + ((v - B.vmin) / (B.vmax - B.vmin)) * (right - left),
      y = (p) => bottom - ((p - B.pmin) / (B.pmax - B.pmin)) * (bottom - top);
    const excluded = m.points.filter((p) => p.group === 'none').length;
    text(M, 285 + offset + warningHeight, 'Pressure-volume graph', 11);
    text(
      W - M,
      285 + offset + warningHeight,
      `${m.points.length - excluded} points used - ${excluded} excluded`,
      9,
      COLOR.quiet,
      'right',
    );
    if (m.grid !== 'none') {
      for (let i = 0; i <= 40; i++) {
        if (i % 5 && m.grid !== 'paper') continue;
        line(
          left + (i * cell) / 5,
          top,
          left + (i * cell) / 5,
          bottom,
          i % 5 ? '#eef3ef' : '#cedbd3',
          i % 5 ? 0.3 : 0.55,
        );
      }
      for (let i = 0; i <= 20; i++) {
        if (i % 5 && m.grid !== 'paper') continue;
        line(
          left,
          top + (i * cell) / 5,
          right,
          top + (i * cell) / 5,
          i % 5 ? '#eef3ef' : '#cedbd3',
          i % 5 ? 0.3 : 0.55,
        );
      }
    }
    doc.setDrawColor('#9db3a4');
    doc.setLineWidth(0.6);
    doc.rect(left, top, right - left, bottom - top);
    for (let i = 0; i <= 8; i++)
      text(
        left + i * cell,
        bottom + 15,
        tick(B.vmin + ((B.vmax - B.vmin) * i) / 8, (B.vmax - B.vmin) / 8),
        8,
        '#546e5c',
        'center',
      );
    for (let i = 0; i <= 4; i++)
      text(
        left - 8,
        bottom - i * cell + 3,
        tick(B.pmin + ((B.pmax - B.pmin) * i) / 4, (B.pmax - B.pmin) / 4),
        8,
        '#546e5c',
        'right',
      );
    text(
      (left + right) / 2,
      bottom + 32,
      'Volume (' + m.volumeUnit + ')',
      9,
      '#344f3d',
      'center',
    );
    doc.setFontSize(9);
    doc.setTextColor('#344f3d');
    doc.text('Pressure (' + unit(m, true) + ')', M + 4, (top + bottom) / 2, {
      angle: 90,
      align: 'center',
    });
    doc.saveGraphicsState();
    doc.rect(left, top, right - left, bottom - top);
    doc.clip();
    doc.discardPath();
    function curve(f, a, b, color, dashed) {
      doc.setDrawColor(color);
      doc.setLineWidth(1.35);
      doc.setLineDashPattern(dashed ? [4, 3] : [], 0);
      const path = [];
      for (let i = 0; i <= 100; i++) {
        const v = a + ((b - a) * i) / 100;
        path.push({ op: i ? 'l' : 'm', c: [x(v), y(predict(m, f, v))] });
      }
      doc.path(path).stroke();
      doc.setLineDashPattern([], 0);
    }
    curve(m.high, m.high.min, m.high.max, COLOR.high, false);
    curve(m.high, m.high.max, C.v, COLOR.high, true);
    curve(m.low, m.low.min, m.low.max, COLOR.low, false);
    curve(m.low, C.v, m.low.min, COLOR.low, true);
    doc.setLineDashPattern([2, 3], 0);
    line(left, y(C.p), x(C.v), y(C.p), '#6b8272', 0.65);
    line(x(C.v), y(C.p), x(C.v), bottom, '#6b8272', 0.65);
    doc.setLineDashPattern([], 0);
    m.points.forEach((p) => {
      doc.setDrawColor(
        p.group === 'high' ? COLOR.high : p.group === 'low' ? COLOR.low : COLOR.excluded,
      );
      doc.setFillColor('#ffffff');
      doc.setLineWidth(0.9);
      doc.circle(x(p.v), y(p.p), 2.5, 'FD');
    });
    doc.setDrawColor(COLOR.ink);
    doc.setLineWidth(1.2);
    doc.circle(x(C.v), y(C.p), 3.5, 'FD');
    doc.restoreGraphicsState();
    text(right - 4, Math.max(top + 14, y(C.p) - 16), label(m), 9, COLOR.ink, 'right');
    const ly = bottom + 51;
    for (const [xx, name, color, dashed] of [
      [M + 18, 'High-pressure fit', COLOR.high, false],
      [M + 146, 'Low-pressure fit', COLOR.low, false],
      [M + 271, 'Extended trend', '#7e8d84', true],
    ]) {
      doc.setLineDashPattern(dashed ? [3, 2] : [], 0);
      line(xx, ly - 2, xx + 15, ly - 2, color, 1.2);
      doc.setLineDashPattern([], 0);
      text(xx + 20, ly + 1, name, 8, COLOR.quiet);
    }
    doc.setDrawColor(COLOR.excluded);
    doc.setFillColor('#ffffff');
    doc.circle(W - M - 92, ly - 2, 2.5, 'FD');
    text(W - M - 84, ly + 1, 'Excluded points', 8, COLOR.quiet);
    line(M, bottom + 70, W - M, bottom + 70);
    text(M, bottom + 91, 'High-pressure fit', 10);
    text(mid, bottom + 91, 'Low-pressure fit', 10);
    text(M, bottom + 116, 'R² = ' + rSquared(m.high), 17);
    text(mid, bottom + 116, 'R² = ' + rSquared(m.low), 17);
    line(M, H - 63, W - M, H - 63);
    text(M, H - 48, 'Excluded points shown; not used in either fit', 8, COLOR.quiet);
    text(W - M, H - 48, 'A4 portrait - Page 1 of 1', 8, COLOR.quiet, 'right');
    return doc;
  }
  root.PVReport = { buildModel, svg, html, open, createPdf, save, label, filename };
  if (typeof module !== 'undefined') module.exports = root.PVReport;
})(typeof window !== 'undefined' ? window : globalThis);
