# Architecture and maintenance

## Runtime

The application is buildless and consists of four static files:

| File                | Responsibility                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| `public/index.html` | Phase-first setup, import controls, graph containers, help text and report layout                        |
| `public/style.css`  | Responsive page styling, square-grid context, pinned results, point tools, presentation and print styles |
| `public/engine.js`  | Input parsing, least-squares regression, root calculation and automatic branch suggestion                |
| `public/app.js`     | Browser state, DOM rendering, SVG generation, metadata interpretation, undo and exports                  |

`engine.js` supports browser `window.PV` and CommonJS `require`. HTML loads the engine before the app. The query suffixes in asset URLs are cache-busting labels inherited from the working app, not a build system.

No framework, runtime dependencies, remote fonts, external graph libraries, analytics, API keys or database are used. The local development server uses only Node built-ins.

## Main browser state

- `points`: pressure/volume records and their `high`, `low` or `none` groups.
- `result`: the current fitted branches and possible crossing, or null.
- `tool`: the current point-assignment tool.
- `history`: up to 25 previous point-group snapshots.
- `demo`: whether the analysis uses the bundled synthetic demonstration.
- `presentation`: whether editing controls are hidden and graph reassignment is blocked.
- `viewBounds`: user-selected display limits, or null for the automatic view.
- `autoBounds`: the latest bounds covering measurements and the fitted crossing.
- `loadedText`: input text retained from the last parse; no persistence mechanism is attached.

The browser state is in memory. No persistence or analysis-file import exists.

## Data flow

1. `setupPhase` updates the input gate and expected phase labels.
2. `load` calls `PV.parse`, then `PV.autoAssign` and `PV.analyze` where possible.
3. Manual point/range changes preserve an undo snapshot and call `fitNow`.
4. `render` updates result cards, point table, graph, equations and the case summary.
5. `chart` renders an inline SVG. Gridlines, shading, axis bounds and point readouts are display operations only. Scaling calls the graph renderer without refitting or changing point groups.
6. `equations` renders coefficients in normalized-volume form.
7. JSON export serializes data and diagnostics; SVG export serializes the chart; print uses browser layout.

Case text is rendered through `textContent` in the summary. Numeric values, engine results and fixed select options populate the SVG. Imported file content must not be inserted as executable markup.

## Local development

`npm start` runs `scripts/serve.cjs` on loopback port 3000. It serves `public/`, permits GET/HEAD, checks path boundaries, and does not create an application backend. `PORT` selects another loopback port.

`npm run verify` checks formatting, source wiring, numerical tests, smoke tests and server behavior. Prettier is development-only and pinned through `package-lock.json`.

The UI smoke harness executes the actual app in a small fake DOM. It establishes state and string-rendering behavior; it cannot establish browser layout, CSS stickiness, touch interaction, rendering quality or printed-page appearance.

## Hosting

Serve the contents of `public/` with any suitable static host. No compilation is required. The folder names differ from the original hosted checkout: its tracked `dist/` became `public/` here to make the static source root explicit.

The original `.openai/hosting.json`, Site ID, source credentials, repository metadata and deployment scripts are intentionally excluded. No workflow deploys this repository or creates a release. Publishing a public version is a separate decision after review.

The existing privately hosted Site continues using its own checkout. This GitHub repository is a review snapshot, not an automatic synchronization bridge to that Site.

## Making changes

Keep numerical changes separate from presentation changes. For engine changes, include cases where a fit should fail or warn, alongside successful crossings. For UI changes, rerun the smoke tests and complete browser checks where a real browser is available. Update the method documentation whenever numerical thresholds or assumptions change.

The stylesheet uses a consolidated teal/orange palette, responsive layout, pinned result strip, and separate presentation/print rules. Real-browser visual review is still required for visual sign-off.

## Standalone A4 layout preview

`public/report-preview.html` demonstrates the proposed report with fixed example data. Its two summary values are separate; the compact `Psat: ... psig @ ... cc` annotation is in the graph. All measurements, including gray excluded points, remain visible.

Print opens the browser dialog. Save as PDF directly downloads `public/report-preview.pdf`, a pre-generated single-page A4 PDF with vector logo, vector graph and text. These static preview actions use fixed example data. The main application uses `public/report.js` to snapshot the current measurements, assignments, coefficients and metadata. Print opens an A4 HTML document; Save as PDF generates a vector A4 document using the locally vendored jsPDF 4.2.1 bundle. Reports evaluate the existing fits without refitting and show all measurements, independently of viewport zoom.

To regenerate the sample PDF after editing the preview data or layout:

```sh
python -m pip install -r requirements-report.txt
python scripts/generate-report-preview.py
```

ReportLab is an optional development tool for regenerating this fixed sample, not a browser/runtime dependency. Commit the regenerated PDF along with changes to the sample. The HTML and PDF layouts are generated separately, so both need review when the layout changes.
