# Fitting method and equations

This document describes the current implementation, not a proposed universal thermodynamic method. The numerical source is `public/engine.js` and exports `parse`, `fit`, `analyze` and `autoAssign` through `PV` in the browser or CommonJS in Node.

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

Let `gap = [max(V_high), min(V_low)]`. Analysis considers nonnegative-pressure crossings in the gap or within **8% of S** outside either gap end. If any roots lie strictly within the gap, those roots are preferred. There must be exactly one remaining root.

The pressure derivative and predicted pressure are checked at the ends of each fitted-plus-extended interval. The derivative is linear for quadratic models, so endpoint checks establish its sign throughout that interval. A branch that reverses direction or predicts negative pressure over that interval does not produce an accepted crossing.

A crossing outside the gap is reported with an extrapolation warning. Nearly parallel trends are flagged when:

```text
|slope_high − slope_low| < 0.05 × max(|slope_high|, |slope_low|, 1e−10)
```

These thresholds are implementation choices; they have not been calibrated as laboratory acceptance criteria. A flagged intersection can still appear in the results. No confidence probability is assigned.

## Automatic branch suggestion

The algorithm:

1. Leaves all exactly zero-pressure readings unassigned for review. Zero gauge pressure can be a real reading; zero is not declared physically invalid.
2. Sorts the remaining measurements by increasing volume.
3. Tries candidate outer high/low ranges, each meeting the minimum point count.
4. May skip a consecutive interval around the bend, up to `min(8, floor(0.25 × n))` points.
5. Requires a single nearby root, nonnegative pressure at that root, decreasing branch behavior and separate volume ranges. The automatic root proximity allowance is **4% of the full nonzero-data volume span**, rather than the analysis allowance of 8% of the selected span.
6. Minimizes the heuristic score:

```text
score = sqrt((RSS_high + RSS_low) / (n − skipped)) / pressure_span
        + 0.0025 × skipped
```

`pressure_span` is the range of the nonzero-pressure data. The first term favors close fits; the second discourages excessive exclusion. This is **not** BIC, a robust outlier detector, a phase-equilibrium model, or a calibrated confidence score.

No usable suggestion results in a message inviting manual selection. Manual per-point assignments can leave points out anywhere, beyond the contiguous bend interval supported by the suggestion algorithm.

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
