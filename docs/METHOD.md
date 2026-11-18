# Fitting method and equations

This document describes the current implementation, not a proposed universal thermodynamic method. The numerical source is `public/engine.js` and exports `parse`, `fit`, `analyze`, `autoAssign` and `deepFit` through `PV` in the browser or CommonJS in Node.

## Physical context

The intended input is an equilibrated, constant-temperature P–V expansion/compression segment with unchanged overall composition. A bubble boundary separates a liquid from a liquid–gas region; a dew boundary separates a gas from a gas–liquid region. An upper retrograde dew point can be reached by reducing pressure. A lower dew boundary has a different phase arrangement.

The user supplies the intended phase interpretation. The tool does not solve phase equilibrium, calculate a phase envelope, infer composition, confirm fluid phases, or correct measurements for temperature. Recording an increasing pressure path does not reverse the axes or change the fitted equations.

References for physical interpretation:

- [Penn State: Phase Behavior of Natural Gas and Condensate Fluids](https://courses.ems.psu.edu/png520/m12_p2.html)
- [SLB: Dewpoint](https://glossary.slb.com/en/terms/d/dewpoint)

## Point groups and coordinate normalization

Each measurement has `{id, p, v, group}`. `group` is `high`, `low` or `none`. Only selected points determine either fit. Points assigned to neither branch remain visible.

Across all selected points:

```text
V₀ = minimum selected volume
S  = maximum selected volume − V₀
z  = (V − V₀) / S
```

A zero volume span is rejected. High-pressure selected volumes must all precede low-pressure selected volumes: `max(V_high) < min(V_low)`. This is a constraint of the current model, not a general definition of a phase boundary.

## Independent least-squares regression

The default degree is 2:

```text
P_high(z) = a_h + b_h z + c_h z²
P_low(z)  = a_l + b_l z + c_l z²
```

Degree 1 omits the quadratic coefficient. For each branch, the objective is:

```text
RSS = Σ [P_i − P_fit(V_i)]²
```

With row vector `X_i = [1, z_i, z_i²]`, the implementation builds `XᵀX` and `XᵀP`, then solves the normal equations with Gauss–Jordan elimination and partial pivoting. A pivot magnitude below `1e−12` is treated as singular.

This is ordinary, unweighted least squares. It minimizes vertical **pressure** residuals, treats volume as the independent coordinate, and does not model error in both coordinates. Normalization helps conditioning but does not eliminate numerical sensitivity. A QR/SVD or errors-in-variables implementation would be a future numerical change requiring separate validation.

Minimum selection requirements:

| Shape               | Points per branch | Distinct volumes per branch |
| ------------------- | ----------------- | --------------------------- |
| Straight / degree 1 | At least 3        | At least 2                  |
| Curved / degree 2   | At least 4        | At least 3                  |

The curves are independent and are not constrained to join at a selected data point.

## Intersection

Subtract the branch polynomials:

```text
A = c_h − c_l
B = b_h − b_l
C = a_h − a_l
A z² + B z + C = 0
```

Near-zero leading coefficients are handled as a linear equation using a coefficient-relative tolerance of `1e−10 × max(1, |A|, |B|, |C|)`. The quadratic uses a cancellation-resistant form:

```text
q = −0.5 [B + sign(B) sqrt(B² − 4AC)]
z₁ = q / A
z₂ = C / q
```

The implementation handles the `q = 0` case separately. Roots are converted back to volume:

```text
V_sat = V₀ + S z
P_sat = P_high(V_sat)
```

Here `P_high` is evaluated at the corresponding normalized volume internally.

### Root screening

Let `gap = [max(V_high), min(V_low)]`. Analysis considers nonnegative-pressure crossings in the gap or within **8% of S** outside either gap end. If any roots lie within the gap, those roots are preferred. "Within the gap" includes a tolerance of `1e−9 × S` at both ends, so a crossing exactly at a selected end point is not misreported as extrapolated because of floating-point rounding. There must be exactly one remaining root.

The pressure derivative and predicted pressure are checked at the ends of each fitted-plus-extended interval. The derivative is linear for quadratic models, so endpoint checks establish its sign throughout that interval. A branch that reverses direction or predicts negative pressure over that interval does not produce an accepted crossing.

A crossing outside the gap is reported with an extrapolation warning. Nearly parallel trends are flagged when:

```text
|slope_high − slope_low| < 0.05 × max(|slope_high|, |slope_low|, 1e−10)
```

These thresholds are implementation choices; they have not been calibrated as laboratory acceptance criteria. A flagged intersection can still appear in the results. No confidence probability is assigned.

## Deep automatic selection

`deepFit(points, degree, progress)` returns assignments and an auditable search summary. `autoAssign` is a compatibility wrapper returning only those assignments. Selection runs on Plot graph and **Deep fit**. It changes membership, not the regression equations above.

### Permitted selections and objective

- Exactly zero-pressure readings remain unassigned for review; zero gauge pressure can be real. Sort nonzero readings by volume and then numeric point ID.
- Keep at least `degree + 3` points in each branch: five for quadratic or four for linear. At most `floor(0.25 × n)` nonzero readings may be excluded overall. The minimum input is therefore 10 curved or 8 straight readings. The previous heuristic's per-region 80% count/span rules no longer apply.
- Every retained high-region volume precedes every retained low-region volume. Exclusions may be anywhere, including region interiors and endpoints.
- Use the same `analyze` safeguards as the displayed fit: distinct-volume requirements, supported unique crossing (preferring roots in the gap), nonnegative/decreasing fitted branches and the 8% selected-span root allowance. Candidates rejected by the displayed analysis cannot win the search. A warning, such as extrapolation or nearly parallel trends, remains visible if present.
- Both branch R² values must be defined. A constant-pressure branch has undefined R² and cannot win an R² optimization; it remains available for manual analysis.
- Maximize `min(R²_high, R²_low)` first, then `(R²_high + R²_low)/2`, then retained count. Differences no larger than `1e−12` are numerical ties. A final lexicographic group-key comparison makes tied results deterministic. This prioritizes the weaker branch rather than letting a strong high-pressure trend mask a poor low-pressure trend. There is no adjusted-R² or exclusion penalty; the count limits are hard constraints.

### Exhaustive mode: up to 20 nonzero readings

Enumerate every exclusion subset within the allowed count, then every ordered split of its retained readings meeting the branch minimums. This compares every permitted assignment. `complete: true` means the numerical optimum within these model, count, ordering and crossing constraints, to the stated tie tolerance. It does not mean a universal physical optimum or that every conceivable curve was considered.

### Bounded mode: 21–500 nonzero readings

Use deterministic multiple starts and beam refinement; a global maximum is not guaranteed:

1. Seed every split with gap sizes in `{0,1,2,4,8,16,32,64,floor(0.25 × n)}` that fit the count constraints.
2. Keep a beam of the best 16 numerically fitted candidates, including unresolved crossings so intermediate steps can reach a supported one. Only candidates accepted by `analyze` can become the returned result.
3. Explore single-point exclusions, restorations and changes of branch. For at most 80 readings, try each point. Above 80, inspect each branch's 12 largest absolute residuals, first/last two points, and 12 excluded readings closest to that branch's curve. Reject invalid count/order assignments.
4. Retain the best 16 beam states for up to 24 rounds. Stop if the beam is unchanged, 30,000 unique count-valid candidates have been examined, or the best lower-branch R² reaches `1 − 1e−12`.
5. Attempt compatible point restorations from the best result while the evaluation budget remains, up to the exclusion limit in passes. This recovers good readings omitted by wide bend-gap seeds.

The summary records mode, exhaustive completion, candidates examined/accepted, budget, minimum branch count, exclusion cap, zero/nonzero counts and winning scores. Progress is emitted every 256 examined candidates. A dedicated Web Worker runs the search in supported browsers; Stop terminates it. Manual edits, trend-shape or test-context (phase, boundary, pressure path) changes and new data invalidate in-flight results. Unit and temperature changes only relabel values, so they keep a running search and its metadata. Browsers without workers use a synchronous compatibility path. No candidate results in a manual-review message without replacing an existing selection. Successful manual requests are undoable. JSON exports include search metadata until the selection, trend shape or test context is edited.

R² is evaluated on selected points: excluding measurements can increase it without improving true Psat accuracy. Exclusions are fitting choices, not proof of instrument errors or phase identity. Laboratory validation and independent phase observations remain necessary.

## Fit measures

For each branch:

```text
RMSE = sqrt(RSS / n_branch)
R²   = 1 − RSS / Σ(P_i − mean(P))²
```

RMSE is in pressure units and uses `n_branch`, not residual degrees of freedom. R² is reported as undefined when the total sum of squares is at most `1e−20`. It is not a confidence percentage, and a high value can coexist with a sensitive or biased intersection.

## What is not implemented

- Calibrated confidence intervals, uncertainty propagation or intersection sensitivity analysis.
- Automatic model selection between line, quadratic and spline models.
- Peng–Robinson, extended-Y, compressibility-based phase detection or other thermodynamic analysis.
- Instrument calibration, pressure-basis conversion, unit conversion or temperature correction.
- General curve shapes with increasing equilibrium P(V), overlapping fitting regions, or multiple resolved intersections.

See [VALIDATION.md](VALIDATION.md) for the validation plan and [REVIEW.md](REVIEW.md) for the release review.
