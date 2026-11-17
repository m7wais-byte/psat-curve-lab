# Source provenance and exclusions

Snapshot date: **2026-11-17**. Source checkout commit: `16130b7e8bdc0fd563ac53664b901f326c60c4cc`.

The source is the current working privately hosted [Psat Curve Lab](https://psat-curve-lab.m7wais.chatgpt.site), including the pinned result strip, independent branches, fit shading and management presentation view. A live Site may change after this snapshot.

Only the four runtime files were copied from the deployed checkout. They were moved from `dist/` to `public/` and formatted for readability. No intentional runtime or numerical behavior change is part of the repository preparation. New local scripts, examples, tests and documentation were added for review and maintenance.

## Original-file fingerprints

These hashes describe the original bytes before formatting, not the formatted files in this repository.

| Source → repository                     | SHA-256 of source bytes                                            |
| --------------------------------------- | ------------------------------------------------------------------ |
| `dist/index.html` → `public/index.html` | `410c06082e73c73dfb0ea42b460954842a33ad55f3741dd52a66a3c8f1e2d9bb` |
| `dist/app.js` → `public/app.js`         | `a408bbaba7bf52c052708a37de6441a52117b3ec9870205e3826ebbca88727ed` |
| `dist/engine.js` → `public/engine.js`   | `383c716ab5972fc4dfea275d19b30a53151d97975a988c8702079ed623780fcd` |
| `dist/style.css` → `public/style.css`   | `59968da48d7bcaeb1bd0bc55de4452999379889c6dfbdfc6f96c76fd5f09ba49` |

## Excluded material

- Old source history, previous application variants and obsolete smoke-test scripts.
- All `work/` patch generators, temporary analysis scripts and packaging scripts.
- Deployment tar archives and build/deployment scratch output.
- The original `.git/` metadata, remote configuration and credential handling.
- `.openai/hosting.json`, Site identity and hosting credentials.
- Real laboratory case data, personal information and external-account credentials.
- Installed development dependencies (`node_modules/`).

The current CSS override structure was preserved rather than redesigned again during packaging. The review can consider consolidation after visual comparison. The numerical method, UI state and export version remain those of the working application; repository version 0.1.0 describes the review snapshot.
