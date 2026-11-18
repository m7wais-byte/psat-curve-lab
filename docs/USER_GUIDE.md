# User guide

## Set up the case

Select Bubble point or Dew point first. Data entry is disabled until that choice is made. Enter the sample/case name and confirm pressure units, gauge/absolute basis and volume units.

Temperature and pressure path are under Additional test conditions. Temperature may be blank. For dew points, select upper/retrograde, lower, or boundary not confirmed. The interface displays the expected regions for that context; it does not confirm phases from the curve.

Units are descriptive. Changing psi to bar, or gauge to absolute, **does not convert the supplied numbers**. Convert externally before entering the data. cc, mL and cm³ represent the same volume unit; relative volume requires a consistent normalization that you understand.

## Enter measurements

Paste or upload exactly two columns, in this order:

1. Pressure.
2. Volume.

Use a decimal point without thousands separators. CSV, TXT and TSV imports are accepted. An optional header line with words and no numbers, such as `Pressure,Volume` or `P (psig), V (cc)`, is skipped. Columns are always pressure first, volume second. Imports are limited to 1 MB and analyses to 500 points. Pressure must be nonnegative and volume positive.

Use Plot graph to read the current input, draw the points and propose fitting branches. Changing the text clears the previous result until it is replotted. A replot resets point assignments to the automatic proposal.

The Example button uses synthetic values and labels the analysis as a synthetic example. It preserves your selected bubble/dew context, but the example is a curve-fitting demonstration, not a simulation of the selected fluid. It sets its own case name, psi/gauge and cc units and clears temperature.

## Review and adjust branches

The graph always has volume on X and pressure on Y. Input order does not reverse these axes. The fitting engine uses volume ordering for its suggestion.

| Point tool                | Meaning                                                       |
| ------------------------- | ------------------------------------------------------------- |
| Teal / High-pressure fit  | Include a point in the teal branch regression                 |
| Orange / Low-pressure fit | Include a point in the orange branch regression               |
| Gray / No fit             | Keep a point visible while excluding it from both regressions |

Choose a tool, then click a measurement. Tool counts show how many points belong to each group. Hover or keyboard-focus a point to inspect its pressure, volume and group. Clickable points also respond to Enter or Space. Selection changes update the fit immediately.

Undo restores the previous point-group assignment. Up to 25 assignment snapshots are retained. Undo covers per-point changes, range changes, clearing selections and automatic reassignment. It does not undo metadata, raw data edits or model changes. Importing or replotting data resets selection history.

The range controls assign teal points at/below the high-range volume limit and orange points at/above the low-range volume limit. Intermediate points belong to neither fit. Zero-pressure readings are kept unassigned by automatic and range selection; they can be reviewed and assigned individually.

The current model requires separate ranges: all teal volumes must be smaller than all orange volumes. Each branch has its own trend shape (High fit · trend shape and Low fit · trend shape). A curved (quadratic) branch needs at least four points; a straight branch needs three. Both start as curved. For a bubble point, a straight high-pressure (single-phase liquid) trend with a curved low-pressure trend can be a useful check: the liquid trend then cannot bend near the break. Compare the two results; neither shape is validated as more accurate.

## Read the graph and result

- The result strip stays pinned within the analysis as you scroll.
- Solid curves cover the selected fitting ranges. Dashed portions extend the curves toward the crossing.
- The marked crossing provides estimated pressure and volume. Bubble/dew selection determines the Pb/Pd label, not different regression mathematics.
- Shading marks selected fitting ranges and the interval between them. It is **not** a measured or thermodynamically confirmed phase map.
- Graph paper, major-square and no-grid backgrounds are available. Grid and shading changes do not affect the numerical fit.
- No fit points do not disappear and do not influence either curve.

A missing, multiple, reversing or distant crossing needs selection/model review. An intersection may be shown with a warning for extrapolation or nearly parallel trends. Do not treat the presence of a number as acceptance of the test.

Exact coefficients and branch quality measures are in the collapsible equations panel. The adjacent method panel explains the equations. R² and RMSE describe the selected fits; neither establishes saturation-pressure accuracy.

### Bubble points: Y-function check

For bubble-point cases, **Y-function check** under Adjust fit gives an independent cross-check of Pb. It computes `Y = (Pb − P) / (P_abs · (V/Vb − 1))` for the low-pressure (two-phase) points, with Vb read from the high-pressure trend. It then finds the Pb, between the selected branches, that makes Y closest to a straight line in pressure. The panel shows that Pb, its difference from the graphical Pb, and a Y–P chart: filled points at the most-linear Pb, hollow points at the graphical Pb. A curved hollow set means the graphical Pb is probably off.

- Y needs absolute pressure. For gauge units the app adds one standard atmosphere (14.696 psi, 1.01325 bar, 101.325 kPa or 0.101325 MPa). If your laboratory's barometric pressure differs much, enter absolute pressure instead.
- Points just below Pb are the most sensitive to volume error. If the most-linear Pb sits at the edge of the allowed range, it is not resolved; review the selections.
- The check never changes the graphical result. A large difference is a reason to review the data and selections, not proof that either value is correct. It is not shown for dew points.

## Adjust the graph scale

Open **Graph scale** after plotting data:

- **Zoom in / Zoom out** narrows or widens both axes around the current view center.
- **Focus on intersection** centers a closer view on the current graphical crossing.
- **Minimum / Maximum** lets you set exact volume (X) and pressure (Y) limits. Select Apply axis limits to use them.
- **Auto scale** restores the complete point range, including the fitted intersection when present.

All limits must be finite and nonnegative, with each maximum greater than its minimum. An excessively narrow range is rejected to avoid unreliable labels. Tick-label precision adjusts as you zoom. The graph-paper squares remain square; the values represented by each square change with the axis limits.

Scaling changes the viewport only. Points outside it remain in their fitting groups and contribute to the regression. The graph reports how many measurements are visible and warns if the intersection is outside the view. Curves and range shading are clipped at the graph boundaries; out-of-view measurements are not shown on the cropped graph but remain in the point table and JSON export.

The current scale is retained when adjusting points or the background. Editing/importing/replotting data resets it to automatic. Presentation view uses the chosen scale and retains its visibility note, but hides the editing controls. SVG export uses the current view. The A4 print/PDF report always includes the full measurement range. Analysis JSON records the mode and axis bounds under `graphView`.

## Present and export

Presentation view becomes available once there is an intersection. It emphasizes the case context, result strip and graph; editing controls are hidden and graph reassignment is disabled. Use Edit or Escape to return. Any review warning and the synthetic-example label remain visible.

- **Save graph:** downloads the current SVG plot, including axes, fitted curves, points and optional shading. The surrounding page's case metadata, HTML legend and warnings are not embedded in the SVG. Pair it with the analysis export when preserving context.
- **Print:** opens the current case as an A4 report and starts the browser print dialog. Allow pop-ups for this site if prompted.
- **Save as PDF:** downloads a vector A4 report directly. Both actions include case details, separate Psat/Vsat values, the combined pressure/volume annotation inside the graph, both R² values and all excluded points. The report shows the full measurement range regardless of graph zoom. A fitted intersection is required. For case names with non-Latin characters, use Print and choose Save as PDF in the browser.
- **Download analysis (JSON)**, under the collapsed Equations & fit quality panel: downloads JSON with measurements, point assignments, coefficients, errors and metadata. It is a record, not a supported reimport format in this version.

The interface itself does not save cases to disk, localStorage, a database or the cloud. Reloading or closing the page loses the current state unless it was exported.

## Common problems

| Message or behavior                   | Action                                                              |
| ------------------------------------- | ------------------------------------------------------------------- |
| Data entry is disabled                | Choose bubble or dew point first                                    |
| Expected two numbers                  | Remove extra columns, units, thousands separators or malformed rows |
| Not enough points                     | Include the required number in each branch                          |
| Automatic suggestion unavailable      | Assign the two branches manually                                    |
| Ranges overlap                        | Move the branch limits apart or reassign conflicting points         |
| No nearby intersection                | Review the point groups and curvature; do not force a result        |
| Reversing fitted trend                | Adjust the selected range or make that branch straight              |
| Nearly parallel trends                | Treat the crossing as sensitive; review additional measurements     |
| Unexpected zeros                      | Check whether these are true readings or missing-value placeholders |
| Labels look wrong after a unit change | Remember that unit changes relabel rather than convert values       |

For test-data-dependent issues, use an anonymized case with instrument units and the accepted reference result, where sharing is permitted.

Pressure unit is one selector: choose psig for gauge pressure or psia for absolute pressure. Bar, MPa and kPa each also offer gauge and absolute choices. Enter measurements already in the selected unit/reference; changing the selector relabels values and does not convert them.

Deep fit runs when you plot new measurements. For up to 20 nonzero readings, it compares every allowed selection and maximizes the weaker branch R², then average R², then retained points. It retains at least 75% overall and five points per quadratic branch (four for straight trends). Larger inputs use a bounded multi-start search. The status states which mode was used and how many selections were compared. The result is only optimal within the stated rules when the status says all permitted selections were compared.

The status also lists the point numbers Deep fit left out. On the graph these points are hollow with a cross (⊗), and in the measurements table they are marked "left out by Deep fit". Check each one before accepting the result: an excluded point may be a bad reading, or it may be a valid reading near the break. Click a point with a fit tool to restore it. After any manual edit the selection is yours, so the Deep fit markers are removed. Zero-pressure readings are never assigned automatically and are not listed as left out. JSON export records the left-out point IDs (`excludedPointIds`, 0-based like the measurement IDs).

Press Deep fit to recalculate after manual edits. Progress appears while it runs; Stop search retains the current selection. Editing points, changing the context or entering new data cancels any pending search, so old results cannot overwrite your work. Successful requests can be undone. All excluded points stay visible. Search scope is also recorded in JSON export. R² is not a measure of physical saturation-pressure accuracy.
