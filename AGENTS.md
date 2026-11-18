# Repository notes

- The buildless runtime is in public/: engine.js, app.js, fit-worker.js, report.js, HTML/CSS, and the pinned jsPDF vendor bundle.
- Use Node.js >=22. Run npm ci, then npm run verify for changes.
- Keep engine changes separate from presentation changes; METHOD.md describes the implemented thresholds exactly.
- The browser UI uses the global PV object exported by engine.js. Engine tests use its CommonJS export.
- Preserve the selected-point semantics: high, low and none. Neither-fit points remain visible and must not affect regression.
- Pressure is vertical; volume is horizontal. Bubble/dew selection changes interpretation labels, not the regression equations.
- The numerical method is exploratory and not validated against real laboratory references. Do not claim universal accuracy or interpret R² as confidence.
- The fake-DOM UI tests are not browser visual tests. State the limit accurately.
- Do not add laboratory records, credentials, .openai hosting identity, old archives or deployment scratch files.
- Keep the repository private/review-stage; do not publish or deploy without user instruction.
- Merging into main deploys: .github/workflows/publish.yml runs npm run verify, then publishes public/ to the gh-pages branch that GitHub Pages serves. Treat a merge to main as a release of the site.
