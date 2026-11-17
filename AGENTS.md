# Repository notes

- Runtime files are the four static files in public/. There is no application build step.
- Use Node.js >=22. Run npm ci, then npm run verify for changes.
- Keep engine changes separate from presentation changes; METHOD.md describes the implemented thresholds exactly.
- The browser UI uses the global PV object exported by engine.js. Engine tests use its CommonJS export.
- Preserve the selected-point semantics: high, low and none. Neither-fit points remain visible and must not affect regression.
- Pressure is vertical; volume is horizontal. Bubble/dew selection changes interpretation labels, not the regression equations.
- The numerical method is exploratory and not validated against real laboratory references. Do not claim universal accuracy or interpret R² as confidence.
- The fake-DOM UI tests are not browser visual tests. State the limit accurately.
- Do not add laboratory records, credentials, .openai hosting identity, old archives or deployment scratch files.
- Keep the repository private/review-stage; do not publish or deploy without user instruction.
