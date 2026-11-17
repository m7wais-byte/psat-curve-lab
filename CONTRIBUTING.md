# Working on Psat Curve Lab

This is a private review-stage application. Discuss changes against a concrete case or user workflow.

## Setup and checks

```sh
npm ci
npm start
npm run verify
```

The development server serves `public/`. Use `npm run format` before committing. No build step is required.

## Change scope

- Preserve pressure on Y, volume on X, and independent point-group assignments.
- Keep fitting/phase interpretation changes separate from visual refinements.
- Update METHOD.md when formulas, tolerances, thresholds or assumptions change.
- Add numerical tests for meaningful engine changes, including unsuccessful or ambiguous cases.
- Treat UI smoke tests as nonbrowser checks; complete the relevant real-browser review for visual changes.
- Keep warnings and synthetic-data labels visible in presentation/print flows.
- Do not represent R² as a confidence percentage or claim real-fluid accuracy from synthetic tests.

## Data and reports

Use synthetic or permitted anonymized fixtures. Do not commit instrument exports or client/laboratory data without appropriate authorization. A useful bug report includes units, pressure basis, selected model, point groups, expected result and a permitted minimal dataset.

## Review and publishing

Open a pull request with the problem, final behavior and verification results. No workflow deploys the application. Public release and licensing are separate review decisions.
