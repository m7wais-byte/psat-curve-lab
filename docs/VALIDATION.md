# Validation status and plan

## What the included checks cover

- Exact synthetic curved and straight branch intersections.
- Independence of points assigned to neither fit.
- Automatic branch suggestions on a synthetic curve; isolated outliers in both branches; noisy-data R² improvements with retained coverage; order and pressure-scale invariance; insufficient/parallel-data rejection; Auto fit restoration and Undo.
- Minimum point counts, zero-pressure handling, separate branch ranges and malformed inputs.
- Missing/parallel crossings and input-order independence.
- Basic UI state: phase gate, expected phase labels, branch counts, range changes, undo, presentation mode, synthetic-data labeling, grid/shading display and unchanged numerical results.
- Axis scaling, out-of-view reporting, finite/ordered limit validation and unchanged fits/point groups/history when zooming.
- Current-case report snapshots, excluded-point visibility, safe HTML payloads, separate actions and one-page vector A4 PDF generation.
- Source syntax, HTML control wiring, static assets and local development-server routes.

These checks establish implementation behavior on the tested inputs. They do not measure real-fluid Psat accuracy or instrument uncertainty.

## Verification limits

The UI smoke tests run in a fake DOM rather than a browser. They cannot verify pinned scrolling, responsive layout, pointer/keyboard focus behavior, print pagination, SVG appearance or real file-download behavior.

No browser visual sign-off is recorded. No real laboratory reference dataset or independent phase-observation benchmark is included. Synthetic data should not be used as evidence of general fluid performance.

## Laboratory validation

1. Assemble permitted, anonymized datasets with raw pressure/volume pairs, test temperature when known, units, pressure basis, sample/test history and accepted reference results.
2. Separate bubble, upper dew, lower dew and near-critical cases. Record how the reference value was established and its uncertainty where known.
3. Preserve the original order, excluded points and analyst decisions. Do not assume an old manual intersection is exact reference truth.
4. Reserve unseen cases before tuning selection heuristics or model parameters.
5. Measure pressure error, bias, repeatability and the rate of unresolved/flagged cases, by fluid/test type.
6. Investigate disagreements using residuals, instrument information, point spacing and independent observations.
7. Set acceptance criteria in meaningful pressure units or relative error before declaring a validated workflow.

Future sensitivity analyses or confidence intervals require their own method and coverage assessment; none is currently implemented.

## Browser review

Use real Chrome/Edge/Firefox or the intended laboratory browser. Check at desktop, laptop and narrow/mobile widths:

- Phase choice unlocks entry and dew boundary controls behave as described.
- All units, case names and temperature metadata remain legible.
- Imported and pasted data render correctly.
- The result strip stays visible while scrolling through the graph and fitting controls without covering essential controls.
- Point selection, hover, keyboard activation, Undo and range controls work.
- Grid squares remain square and shading remains distinguishable.
- Zoom, manual axis limits, focus/reset and adaptive tick labels are clear; clipped marks do not spill into labels.
- Hidden points remain in the calculation and the out-of-view intersection note remains visible.
- Presentation mode preserves warnings and synthetic-data labels.
- SVG download, JSON export and printed/PDF output retain the expected information.
- Cases with no intersection or warnings remain understandable.

Record browser/version, viewport, dataset, expected behavior and observed result. Keep this review separate from the automated check results.

The generated current-case PDF was rendered and visually inspected offline. Actual browser print pagination, popup handling and download interaction still require browser review.
