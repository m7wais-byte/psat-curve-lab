# Changelog

## Unreleased — Automatic fit selection

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
