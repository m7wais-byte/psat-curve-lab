# Changelog

## Unreleased — Report preview from live code

- The A4 report preview (HTML and PDF) is now generated from the live report code with `npm run preview`, so it includes the intersection detail panel and can no longer drift from real reports. A test fails if the committed preview is stale.
- Replaced the separate Python/ReportLab preview generator; ReportLab is no longer needed.
- Fixed the narrow report graph label, which still read "Psat" with two decimals instead of Pb/Pd with unit-appropriate digits.

## Unreleased — Review fixes, per-branch shapes and Y-function check

Numerical method:

- A crossing exactly at a selected end point is no longer misreported as extrapolated (gap tolerance `1e−9 × S`).
- Extrapolated and nearly parallel warnings are reported together instead of one replacing the other.
- Each branch can use its own trend shape (straight or quadratic); minimum counts and Deep fit limits follow each branch.
- Added a bubble-point Y-function cross-check: the Pb that makes Y most linear, its Vb, and the same measure at the graphical Pb. It never changes the graphical result.
- Data input: parse error line numbers match the pasted text; common headers such as `P (psig), V (cc)` are accepted; only plain decimal numbers are accepted (hexadecimal and `Infinity` are rejected).

Interface and reports:

- Fixed the black filled area under the intersection leader lines on the graph.
- Unit and temperature changes no longer cancel a running Deep fit or drop its record.
- Points left out by Deep fit are listed and marked (⊗) on the graph, legend and table, and exported.
- Graph and report axes use round tick steps on square grids; zoom and focus keep round values.
- Reports show Pb or Pd, trend shape, points used, unit-appropriate pressure digits and (bubble points) the Y-function check. The PDF pressure axis title is no longer clipped, and the printed report no longer spills onto a second page.
- Small fixes: status colour reset, custom zoom kept when presentation ends, tidy axis-limit inputs, readable Y-function chart on phones.
- Documentation notes that dew points are normally confirmed visually and that a graphical Pd is supporting evidence.
- The A4 report preview files match the live reports.

The method remains exploratory and is not validated against laboratory reference data.

## Clearer fitted curves

- Strengthened curve strokes and orange contrast, reduced grid emphasis, and used filled fitted-point markers in reports.
- Added a separate intersection/low-pressure detail panel with labelled zoomed axes on screen, SVG export and A4 HTML/PDF reports.
- Kept every measurement in the overview and numerical fitting unchanged.

## Deep fit

- Replaced the local adjusted-R² heuristic with exhaustive permitted-selection search for up to 20 nonzero readings.
- Added bounded multi-start beam search for larger cases, with clear search-scope disclosure.
- Prioritized the weaker branch R², then mean R² and retained count.
- Added a dedicated worker, progress, Stop and stale-result protection.
- Included search metadata in JSON exports and preserved manual editing/Undo.

## Automatic fit selection

- Added individual point exclusion/restoration search within automatic branch selection.
- Balanced adjusted R² for both branches with point and volume coverage.
- Retained visible excluded readings, manual editing, Undo and intersection safeguards.
- Automatic suggestions require 10 points for curved or 8 for straight trends.

## Header and pressure units

- Added the vector VAPS logo to the main header.
- Combined pressure unit and basis into one selector, including psig and psia.
- Kept unit/reference metadata in reports and JSON exports.

## A4 case reports

- Integrated the approved vector VAPS A4 layout with current edited measurements and fits.
- Added separate Print and direct Save as PDF actions.
- Preserved excluded points, both R² values, separate summary fields and the combined graph annotation.
- Kept numerical fitting unchanged.

## Simpler interface

- Changed to a softer teal, orange and neutral palette.
- Removed header export and processing notices; moved JSON download into the fit-details panel.
- Added pressure/volume column labels that follow selected input units.
- Shortened routine guidance while retaining fit warnings and detailed help.
- Consolidated the stylesheet without changing numerical fitting.

## Graph scale controls

- Added zoom in/out, focus on intersection, manual volume/pressure limits and automatic reset.
- Added adaptive tick labels, plot-boundary clipping and visible-point/out-of-view notes.
- Recorded display bounds in JSON exports.
- Kept display scaling independent of the numerical fitting method.

## 0.1.0 — Private review snapshot, 2026-11-17

Prepared from the current working Psat Curve Lab application (internal UI/export version v6).

- Independent linear/quadratic pressure-versus-volume fitting and graphical crossing.
- Phase-first setup for bubble/dew context, optional temperature and pressure path.
- Point-group selection, branch ranges, automatic suggestions and selection Undo.
- Pinned results, square-grid graph, optional range shading and point inspection.
- Case summary, presentation mode, print view, SVG and JSON exports.
- Friendly method background and visible equations/fit measures.
- Clean static source layout, local server, tests, CI checks and review documentation.

This snapshot does not add new physics or change the existing numerical method. Public release and laboratory validation remain pending.
