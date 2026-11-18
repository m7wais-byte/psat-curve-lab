(function (root) {
  function solve(A, b) {
    A = A.map((r, i) => [...r, b[i]]);
    const n = b.length;
    for (let k = 0; k < n; k++) {
      let p = k;
      for (let i = k + 1; i < n; i++) if (Math.abs(A[i][k]) > Math.abs(A[p][k])) p = i;
      if (Math.abs(A[p][k]) < 1e-12) return null;
      [A[p], A[k]] = [A[k], A[p]];
      let d = A[k][k];
      for (let j = k; j <= n; j++) A[k][j] /= d;
      for (let i = 0; i < n; i++)
        if (i !== k) {
          d = A[i][k];
          for (let j = k; j <= n; j++) A[i][j] -= d * A[k][j];
        }
    }
    return A.map((r) => r[n]);
  }
  function parse(text) {
    const points = [],
      errors = [];
    text
      .trim()
      .split(/\r?\n/)
      .forEach((line, i) => {
        if (!line.trim()) return;
        if (points.length === 0 && /pressure/i.test(line) && /volume/i.test(line)) return;
        const cells = line.trim().split(/[,;\t ]+/);
        if (cells.length !== 2 || cells.some((s) => !Number.isFinite(Number(s)))) {
          errors.push(`Line ${i + 1}: use two numbers, pressure then volume.`);
          return;
        }
        const [p, v] = cells.map(Number);
        if (v <= 0 || p < 0) {
          errors.push(`Line ${i + 1}: volume must be positive and pressure nonnegative.`);
          return;
        }
        points.push({ p, v, id: points.length, group: 'none' });
      });
    if (points.length > 500) errors.push('Use at most 500 points per case.');
    return { points, errors };
  }
  function fit(points, degree, origin, scale) {
    if (points.length < degree + 2 || new Set(points.map((p) => p.v)).size < degree + 1)
      throw Error(
        `Each ${degree === 2 ? 'curved' : 'straight'} branch needs at least ${degree + 2} points with distinct volumes.`,
      );
    let k = degree + 1,
      A = Array.from({ length: k }, () => Array(k).fill(0)),
      b = Array(k).fill(0);
    points.forEach((p) => {
      let x = (p.v - origin) / scale,
        r = Array.from({ length: k }, (_, j) => x ** j);
      r.forEach((a, i) => {
        b[i] += a * p.p;
        r.forEach((c, j) => (A[i][j] += a * c));
      });
    });
    let coeff = solve(A, b);
    if (!coeff)
      throw Error(
        'The selected branch cannot be fitted: select a wider range of distinct volumes.',
      );
    let predict = (v) =>
        coeff.reduce((s, c, j) => s + c * ((v - origin) / scale) ** j, 0),
      slope = (v) =>
        coeff
          .slice(1)
          .reduce((s, c, j) => s + (j + 1) * c * ((v - origin) / scale) ** j, 0) / scale;
    let rss = points.reduce((s, p) => s + (predict(p.v) - p.p) ** 2, 0);
    let mean = points.reduce((s, p) => s + p.p, 0) / points.length,
      sst = points.reduce((s, p) => s + (p.p - mean) ** 2, 0),
      r2 = sst > 1e-20 ? 1 - rss / sst : null;
    return {
      coeff,
      degree,
      predict,
      slope,
      rss,
      r2,
      rmse: Math.sqrt(rss / points.length),
      min: Math.min(...points.map((p) => p.v)),
      max: Math.max(...points.map((p) => p.v)),
      count: points.length,
    };
  }
  function roots(a, b, origin, scale) {
    let c = Array.from({ length: 3 }, (_, i) => (a.coeff[i] || 0) - (b.coeff[i] || 0)),
      [C, B, A] = c,
      eps = 1e-10 * Math.max(1, ...c.map(Math.abs)),
      rs = [];
    if (Math.abs(A) < eps) {
      if (Math.abs(B) > eps) rs = [-C / B];
    } else {
      let d = B * B - 4 * A * C;
      if (d >= 0) {
        let q = -0.5 * (B + (B >= 0 ? 1 : -1) * Math.sqrt(d));
        rs = q === 0 ? [-B / (2 * A)] : [q / A, C / q];
      }
    }
    return [...new Set(rs.filter(Number.isFinite).map((x) => origin + scale * x))].sort(
      (a, b) => a - b,
    );
  }
  function analyze(points, degree = 2) {
    let used = points.filter((p) => p.group !== 'none'),
      high = used.filter((p) => p.group === 'high'),
      low = used.filter((p) => p.group === 'low');
    if (!used.length)
      throw Error('Assign points to the high-pressure and low-pressure branches first.');
    let min = Math.min(...used.map((p) => p.v)),
      max = Math.max(...used.map((p) => p.v)),
      scale = max - min;
    if (!scale) throw Error('Volumes must span a range.');
    let a = fit(high, degree, min, scale),
      b = fit(low, degree, min, scale);
    if (a.max >= b.min)
      throw Error(
        'Keep the two branch ranges separate: high-pressure points should have smaller volumes than low-pressure points.',
      );
    let gap = [a.max, b.min],
      allRoots = roots(a, b, min, scale),
      candidates = allRoots.filter(
        (v) =>
          v >= gap[0] - scale * 0.08 && v <= gap[1] + scale * 0.08 && a.predict(v) >= 0,
      ),
      within = candidates.filter((v) => v >= gap[0] && v <= gap[1]),
      valid = within.length ? within : candidates;
    let intersection = null,
      warning = '';
    if (valid.length === 1) {
      let v = valid[0],
        p = a.predict(v);
      let decreasing = [a, b].every((f) => {
        let start = Math.min(f.min, v),
          end = Math.max(f.max, v);
        return (
          f.slope(start) <= 0 &&
          f.slope(end) <= 0 &&
          f.predict(start) >= 0 &&
          f.predict(end) >= 0
        );
      });
      if (decreasing) intersection = { v, p };
      else
        warning =
          'A fitted trend reverses direction before the intersection. Adjust branch selections or use straight trends.';
    } else
      warning =
        valid.length > 1
          ? 'Multiple nearby intersections: adjust the selected regions to resolve the result.'
          : 'The two trends do not intersect near the selected branch ends. Adjust the branch selections.';
    if (intersection && !(intersection.v >= gap[0] && intersection.v <= gap[1]))
      warning =
        'Intersection is outside the gap between the selected regions; check the extrapolation.';
    if (
      intersection &&
      Math.abs(a.slope(intersection.v) - b.slope(intersection.v)) <
        0.05 *
          Math.max(
            Math.abs(a.slope(intersection.v)),
            Math.abs(b.slope(intersection.v)),
            1e-10,
          )
    )
      warning =
        'Nearly parallel trends: the intersection is sensitive to small measurement changes.';
    return {
      high: a,
      low: b,
      intersection,
      warning,
      gap,
      origin: min,
      scale,
      allRoots,
      used: used.length,
      omitted: points.length - used.length,
      degree,
    };
  }
  function autoAssign(points, degree = 2) {
    let sorted = points.filter((p) => p.p !== 0).sort((a, b) => a.v - b.v || a.id - b.id),
      n = sorted.length,
      m = degree + 3;
    if (n < 2 * m)
      throw Error(
        `Need at least ${2 * m} nonzero-pressure points for automatic branch suggestions. Zero readings remain unassigned for review.`,
      );
    let min = sorted[0].v,
      scale = sorted[n - 1].v - min;
    if (!scale) throw Error('Volumes must span a range.');
    let pspan = Math.max(...sorted.map((p) => p.p)) - Math.min(...sorted.map((p) => p.p));
    if (!pspan) throw Error('Pressures must span a range.');
    // Penalized adjusted R² balances branch quality with retained evidence.
    const loss = (f) =>
      f.r2 === null
        ? 0
        : (Math.max(0, 1 - f.r2) * (f.count - 1)) / (f.count - degree - 1);
    function refine(pool) {
      const span = pool.at(-1).v - pool[0].v;
      let selected = pool,
        fitted = fit(selected, degree, min, scale);
      const objective = (f) => loss(f) + (0.01 * (pool.length - f.count)) / pool.length;
      let value = objective(fitted);
      // Bounded deterministic search: try the three largest residuals, then re-add.
      for (let pass = 0; pass < 8; pass++) {
        let best = null;
        const included = new Set(selected.map((p) => p.id));
        const removals =
          selected.length > Math.max(m, Math.ceil(0.8 * pool.length))
            ? [...selected]
                .sort(
                  (a, b) =>
                    Math.abs(fitted.predict(b.v) - b.p) -
                      Math.abs(fitted.predict(a.v) - a.p) ||
                    a.v - b.v ||
                    a.id - b.id,
                )
                .slice(0, 3)
            : [];
        const trials = [
          ...removals.map((p) => selected.filter((q) => q.id !== p.id)),
          ...pool
            .filter((p) => !included.has(p.id))
            .map((p) => [...selected, p].sort((a, b) => a.v - b.v || a.id - b.id)),
        ];
        for (const trial of trials) {
          if (trial.at(-1).v - trial[0].v < 0.8 * span) continue;
          try {
            const f = fit(trial, degree, min, scale),
              score = objective(f);
            if (score < value - 1e-12 && (!best || score < best.score))
              best = { selected: trial, fitted: f, score };
          } catch {}
        }
        if (!best) break;
        selected = best.selected;
        fitted = best.fitted;
        value = best.score;
      }
      return { selected, fitted };
    }
    const leftCache = new Map(),
      rightCache = new Map();
    function branch(cache, key, pool) {
      if (!cache.has(key)) cache.set(key, refine(pool));
      return cache.get(key);
    }
    let best = null,
      maxGap = Math.min(8, Math.floor(n * 0.25));
    for (let i = m; i <= n - m; i++) {
      for (let skip = 0; skip <= maxGap && i + skip <= n - m; skip++) {
        let left = sorted.slice(0, i),
          right = sorted.slice(i + skip);
        try {
          const A = branch(leftCache, i, left),
            B = branch(rightCache, i + skip, right);
          left = A.selected;
          right = B.selected;
          let a = A.fitted,
            b = B.fitted;
          const excluded = n - left.length - right.length;
          if (excluded > Math.floor(0.25 * n)) continue;
          if (a.max >= b.min) continue;
          let rs = roots(a, b, min, scale).filter(
            (v) =>
              v >= Math.max(a.max - scale * 0.04, a.max - (b.max - a.min) * 0.08) &&
              v <= Math.min(b.min + scale * 0.04, b.min + (b.max - a.min) * 0.08) &&
              a.predict(v) >= 0 &&
              a.slope(v) < 0 &&
              b.slope(v) <= 0,
          );
          if (rs.length !== 1) continue;
          if (
            a.slope(a.min) > 0 ||
            a.slope(a.max) > 0 ||
            b.slope(b.min) > 0 ||
            b.slope(b.max) > 0 ||
            a.predict(a.min) < 0 ||
            a.predict(a.max) < 0 ||
            b.predict(b.min) < 0 ||
            b.predict(b.max) < 0
          )
            continue;
          // Both regions matter equally, including the shallower low-pressure trend.
          let score =
            (loss(a) + loss(b)) / 2 +
            0.5 * Math.max(loss(a), loss(b)) +
            (0.01 * excluded) / n;
          if (!best || score < best.score) best = { score, left, right };
        } catch {}
      }
    }
    if (!best)
      throw Error(
        'No reliable automatic branch suggestion. Assign the two regions manually in the table.',
      );
    // Apply the same intersection safeguards used for the displayed result.
    let h = new Set(best.left.map((p) => p.id)),
      l = new Set(best.right.map((p) => p.id));
    const assigned = points.map((p) => ({
      ...p,
      group: h.has(p.id) ? 'high' : l.has(p.id) ? 'low' : 'none',
    }));
    if (!analyze(assigned, degree).intersection)
      throw Error(
        'Automatic fit has no supported intersection. Review the regions manually.',
      );
    return assigned;
  }
  root.PV = { parse, fit, analyze, autoAssign };
  if (typeof module !== 'undefined') module.exports = root.PV;
})(typeof window !== 'undefined' ? window : globalThis);
