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
  function deepFit(points, degree = 2, progress = () => {}) {
    if (![1, 2].includes(degree)) throw Error('Choose straight or quadratic trends.');
    if (
      !Array.isArray(points) ||
      points.length > 500 ||
      points.some(
        (p) => !Number.isFinite(p.p) || p.p < 0 || !Number.isFinite(p.v) || p.v <= 0,
      ) ||
      new Set(points.map((p) => p.id)).size !== points.length
    )
      throw Error('Use at most 500 finite measurements with unique point IDs.');
    const sorted = points
        .filter((p) => p.p !== 0)
        .sort((a, b) => a.v - b.v || a.id - b.id),
      n = sorted.length,
      minimum = degree + 3,
      maxExcluded = Math.floor(0.25 * n);
    if (n < 2 * minimum)
      throw Error(
        `Need at least ${2 * minimum} nonzero-pressure points for deep fitting. Zero readings remain unassigned for review.`,
      );
    const exhaustive = n <= 20,
      budget = 30000,
      beamWidth = 16;
    let examined = 0,
      valid = 0,
      best = null;
    const seen = new Set();
    function better(a, b) {
      if (!b) return true;
      if (Math.abs(a.minimumR2 - b.minimumR2) > 1e-12) return a.minimumR2 > b.minimumR2;
      if (Math.abs(a.meanR2 - b.meanR2) > 1e-12) return a.meanR2 > b.meanR2;
      if (a.used !== b.used) return a.used > b.used;
      return a.key < b.key;
    }
    function assignment(groups) {
      const byId = new Map(
        sorted.map((p, i) => [
          p.id,
          groups[i] === 1 ? 'high' : groups[i] === 2 ? 'low' : 'none',
        ]),
      );
      return points.map((p) => ({ ...p, group: byId.get(p.id) || 'none' }));
    }
    function evaluate(groups) {
      if (!exhaustive && examined >= budget) return null;
      const key = groups.join('');
      if (!exhaustive && seen.has(key)) return null;
      if (!exhaustive) seen.add(key);
      const high = groups.filter((g) => g === 1).length,
        low = groups.filter((g) => g === 2).length;
      if (high < minimum || low < minimum || n - high - low > maxExcluded) return null;
      examined++;
      if (examined % 256 === 0)
        progress({ examined, valid, mode: exhaustive ? 'exhaustive' : 'bounded' });
      try {
        const r = analyze(assignment(groups), degree);
        if (!Number.isFinite(r.high.r2) || !Number.isFinite(r.low.r2)) return null;
        const c = {
          groups,
          key,
          minimumR2: Math.min(r.high.r2, r.low.r2),
          meanR2: (r.high.r2 + r.low.r2) / 2,
          used: high + low,
          result: r,
        };
        if (r.intersection) {
          valid++;
          if (better(c, best)) best = c;
        }
        return c;
      } catch {
        return null;
      }
    }
    if (exhaustive) {
      // Every exclusion subset and every split of its retained points, once.
      const excluded = new Set();
      function visit(start) {
        const kept = sorted.map((_, i) => i).filter((i) => !excluded.has(i));
        for (let k = minimum; k <= kept.length - minimum; k++) {
          const groups = Array(n).fill(0);
          kept.forEach((i, j) => (groups[i] = j < k ? 1 : 2));
          evaluate(groups);
        }
        if (excluded.size === maxExcluded) return;
        for (let i = start; i < n; i++) {
          excluded.add(i);
          visit(i + 1);
          excluded.delete(i);
        }
      }
      visit(0);
    } else {
      let beam = [];
      function keep(c, pool) {
        if (!c) return;
        pool.push(c);
        pool.sort((a, b) => (better(a, b) ? -1 : better(b, a) ? 1 : 0));
        if (pool.length > beamWidth) pool.length = beamWidth;
      }
      const gaps = [
        ...new Set(
          [0, 1, 2, 4, 8, 16, 32, 64, maxExcluded].filter((g) => g <= maxExcluded),
        ),
      ].sort((a, b) => a - b);
      for (let split = minimum; split <= n - minimum; split++)
        for (const gap of gaps) {
          if (split + gap > n - minimum) continue;
          keep(
            evaluate(sorted.map((_, i) => (i < split ? 1 : i < split + gap ? 0 : 2))),
            beam,
          );
        }
      for (let pass = 0; pass < 24 && beam.length && examined < budget; pass++) {
        if (best && best.minimumR2 >= 1 - 1e-12) break;
        const next = [...beam];
        for (const state of beam) {
          const { groups, result: r } = state;
          let edits = [];
          if (n <= 80) edits = sorted.map((_, i) => i);
          else {
            // Explore residual outliers, boundary points and promising restorations.
            for (const [g, f] of [
              [1, r.high],
              [2, r.low],
            ]) {
              const indices = groups
                .map((value, i) => (value === g ? i : -1))
                .filter((i) => i >= 0);
              edits.push(
                ...[...indices]
                  .sort(
                    (a, b) =>
                      Math.abs(f.predict(sorted[b].v) - sorted[b].p) -
                        Math.abs(f.predict(sorted[a].v) - sorted[a].p) || a - b,
                  )
                  .slice(0, 12),
                ...indices.slice(0, 2),
                ...indices.slice(-2),
              );
              edits.push(
                ...groups
                  .map((value, i) => (value === 0 ? i : -1))
                  .filter((i) => i >= 0)
                  .sort(
                    (a, b) =>
                      Math.abs(f.predict(sorted[a].v) - sorted[a].p) -
                        Math.abs(f.predict(sorted[b].v) - sorted[b].p) || a - b,
                  )
                  .slice(0, 12),
              );
            }
          }
          for (const i of new Set(edits))
            for (const g of [0, 1, 2]) {
              if (groups[i] === g) continue;
              const trial = [...groups];
              trial[i] = g;
              keep(evaluate(trial), next);
            }
          if (examined >= budget) break;
        }
        next.sort((a, b) => (better(a, b) ? -1 : better(b, a) ? 1 : 0));
        if (next.map((c) => c.key).join('|') === beam.map((c) => c.key).join('|')) break;
        beam = next;
      }
    }
    // Recover compatible points from wide bend-gap seeds before returning.
    if (!exhaustive && best) {
      for (let pass = 0; pass < maxExcluded && examined < budget; pass++) {
        const previous = best.key,
          groups = [...best.groups];
        for (let i = 0; i < n; i++)
          if (groups[i] === 0)
            for (const g of [1, 2]) {
              const trial = [...best.groups];
              trial[i] = g;
              evaluate(trial);
            }
        if (best.key === previous) break;
      }
    }
    if (!best)
      throw Error(
        'No supported deep fit found within the search limits. Review the two regions manually.',
      );
    return {
      points: assignment(best.groups),
      search: {
        mode: exhaustive ? 'exhaustive' : 'bounded',
        complete: exhaustive,
        examined,
        valid,
        budget: exhaustive ? null : budget,
        minimumPerBranch: minimum,
        maxExcluded,
        nonzeroPoints: n,
        zeroReadings: points.length - n,
        minimumR2: best.minimumR2,
        meanR2: best.meanR2,
        objective: 'Maximize the lower branch R²; then mean R²; then retained count',
        description: exhaustive
          ? 'All permitted selections compared'
          : 'Bounded multi-start beam search; global optimum not guaranteed',
      },
    };
  }
  function autoAssign(points, degree = 2) {
    return deepFit(points, degree).points;
  }
  root.PV = { parse, fit, analyze, autoAssign, deepFit };
  if (typeof module !== 'undefined') module.exports = root.PV;
})(typeof window !== 'undefined' ? window : globalThis);
