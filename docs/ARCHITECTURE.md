# Architecture and maintenance

## Runtime

The application is buildless and serves static runtime files:

| File                   | Responsibility                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `public/index.html`    | Phase-first setup, import controls, graph containers, help text and report layout                        |
| `public/style.css`     | Responsive page styling, square-grid context, pinned results, point tools, presentation and print styles |
| `public/engine.js`     | Input parsing, least-squares regression, root calculation and automatic branch suggestion                |
| `public/fit-worker.js` | Dedicated deep-search worker and progress/result protocol                                                |
| `public/report.js`     | A4 HTML and vector PDF case reports using locally vendored jsPDF                                         |
| `public/vaps-logo.svg` | Vector header logo                                                                                       |
| `public/app.js`        | Browser state, DOM rendering, SVG generation, metadata interpretation, undo and exports                  |

`engine.js` supports browser `window.PV` and CommonJS `require`. HTML loads the engine before the app. The query suffixes in asset URLs are cache-busting labels inherited from the working app, not a build system.

No framework, remote fonts, external graph libraries, analytics, API keys or database are used. The pinned jsPDF runtime is vendored locally for report export. The local development server uses only Node built-ins.

## Main browser state

- `points`: pressure/volume records and their `high`, `low` or `none` groups.
- `result`: the current fitted branches and possible crossing, or null.
- `tool`: the current point-assignment tool.
- `history`: up to 25 previous point-group snapshots.
- `demo`: whether the analysis uses the bundled synthetic demonstration.
- `presentation`: whether editing controls are hidden and graph reassignment is blocked.
- `viewBounds`: user-selected display limits, or null for the automatic view.
- `autoBounds`: the latest bounds covering measurements and the fitted crossing.
- `fitWorker` / `fitSequence`: cancellable background search and stale-result protection.
- `searchInfo`: search scope and winning score metadata, cleared by edits/context changes.
- `loadedText`: input text retained from the last parse; no persistence mechanism is attached.

The browser state is in memory. No persistence or analysis-file import exists.

## Data flow

1. `setupPhase` updates the input gate and expected phase labels.
2. `load` calls `PV.parse`, then `runDeepFit`, which starts `public/fit-worker.js` using a point snapshot. The worker calls `PV.deepFit`; the main thread applies only the current request, then calls `PV.analyze`.
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

The original `.openai/hosting.json`, Site ID, source credentials, repository metadata and deployment scripts are intentionally excluded. `.github/workflows/publish.yml` deploys the site: on each push to `main` it runs `npm run verify` and, only if that passes, `scripts/publish-pages.sh` copies `public/` (plus `.nojekyll`) to the `gh-pages` branch that GitHub Pages serves. Nothing is published when the files are unchanged. No workflow creates a release.

The existing privately hosted Site continues using its own checkout. This GitHub repository is a review snapshot, not an automatic synchronization bridge to that Site.

## Making changes

Keep numerical changes separate from presentation changes. For engine changes, include cases where a fit should fail or warn, alongside successful crossings. For UI changes, rerun the smoke tests and complete browser checks where a real browser is available. Update the method documentation whenever numerical thresholds or assumptions change.

The stylesheet uses a consolidated teal/orange palette, responsive layout, pinned result strip, and separate presentation/print rules. Real-browser visual review is still required for visual sign-off.

## Standalone A4 layout preview

`public/report-preview.html` and `public/report-preview.pdf` show the A4 report for a fixed, illustrative example (labelled EXAMPLE DATA; not a laboratory test). Both are generated by `scripts/generate-report-preview.cjs` from the live report code: the engine fits the example, the Y-function check runs on it, and `public/report.js` produces the HTML page (`PVReport.html`) and the vector PDF (`PVReport.createPdf`, with fixed metadata so the file is reproducible). The preview therefore always shows the current report layout, including the overview, the intersection detail panel and, for bubble points, the Y-function section.

Regenerate both files after any change to the report code or the example:

```sh
npm run preview
```

`test/report-preview.test.cjs` rebuilds both files in memory and fails if the committed copies are stale. The generated HTML is excluded from Prettier so it stays byte-identical.

The main application uses `public/report.js` to snapshot the current measurements, assignments, coefficients and metadata. Print opens an A4 HTML document; Save as PDF generates a vector A4 document using the locally vendored jsPDF 4.2.1 bundle. Reports evaluate the existing fits without refitting and show all measurements, independently of viewport zoom.

The worker imports the same versioned engine used for manual analysis. It communicates only plain point assignments, progress, search metadata and error messages. Measurements remain in the browser. Without Worker support the synchronous compatibility path uses the same engine.
