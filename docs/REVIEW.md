# Joint review before public release

This repository is being prepared for review. Unchecked items are outstanding, not implied to be completed.

## Application

- [ ] Compare the interface with the current working Site.
- [ ] Exercise bubble, upper-dew and lower-dew context labels.
- [ ] Review wording with the laboratory team, including units that relabel rather than convert.
- [ ] Test scrolling, smaller screens, keyboard interaction and presentation mode in a real browser.
- [ ] Review JSON, SVG and printed/PDF exports.

## Numerical method

- [ ] Review the equations, normal-equations solver, root screening and heuristic thresholds in METHOD.md.
- [ ] Select permitted reference datasets and independent acceptance criteria.
- [ ] Reserve unseen cases for final evaluation.
- [ ] Measure errors and failure/warning rates by fluid/test type.
- [ ] Decide how unresolved, extrapolated and nearly parallel cases should be handled operationally.

## Repository and release

- [ ] Review source, tests and documentation together.
- [ ] Confirm authorship/ownership and choose a license before public distribution.
- [ ] Confirm no laboratory records, private metadata or credentials will be exposed.
- [ ] Review the GitHub Actions results.
- [ ] Decide whether to consolidate the inherited CSS after browser comparisons.
- [ ] Approve a release description that accurately states validation limits.
- [ ] Explicitly decide whether to change GitHub visibility or enable deployment.

Merges into `main` are published automatically to GitHub Pages by `.github/workflows/publish.yml` after the checks pass. There is no release workflow.
