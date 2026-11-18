# Psat Curve Lab

A focused, browser-local tool for drawing pressure–volume measurements, fitting two independent trends, and estimating their intersection as saturation pressure.

**Status: review-stage tool.** This repository contains the current working application, with readable source, documentation and repeatable checks. It is not a laboratory-validated universal Psat method.

## What you can do

- Select bubble point or dew point before entering measurements.
- Record the case name, pressure units and basis, volume units, optional temperature, pressure path and dew boundary.
- Paste two columns from Excel or import CSV / TXT / TSV data.
- Plot **volume on X** and **pressure on Y**, with square major/minor gridlines.
- Run Deep fit: exhaustive point selection for up to 20 nonzero readings, bounded background search for larger cases. Review and adjust both regions.
- Assign points to the high-pressure fit, low-pressure fit, or neither fit.
- Fit gently curved quadratic trends; straight trends remain an explicit option.
- Review the graphical intersection, equations, RMSE, R² and warnings.
- Zoom in/out, focus on the intersection, or set exact pressure/volume axis limits without changing the fitted result.
- Keep the result strip visible while scrolling through the analysis.
- Undo point-selection changes, shade fitting ranges, inspect point values, and switch to presentation view.
- Download an SVG graph, print an A4 current-case report, save a vector PDF, or export the analysis as JSON.

## Run locally

Use Node.js **22 or newer**. No backend account, database, API key or runtime package installation is required.

```sh
npm start
```

Open **http://127.0.0.1:3000**. Stop the server with Ctrl+C. For another port:

```sh
PORT=3001 npm start
```

The port example uses a POSIX shell. In PowerShell, use `$env:PORT = '3001'; npm start`.

For development and all checks, install the pinned formatting tool:

```sh
npm ci
npm run verify
```

The only package dependency is **Prettier**, used during development; the application itself uses browser APIs and plain HTML/CSS/JavaScript.

## First analysis

1. Choose **Bubble point** or **Dew point**, then confirm your units and pressure basis.
2. Enter a case name. Add temperature and pressure-path information if known. For dew analysis, select the relevant upper/lower boundary or leave it unconfirmed.
3. Paste pressure first, volume second, or import a file. `examples/curved-demo.csv` contains synthetic demonstration data.
4. Select **Plot & fit curves**. Review the suggested point groups.
5. Use the blue, orange and No fit tools, or the range controls, to refine selections. No fit points stay visible and do not influence either curve.
6. Review the crossing, extrapolation, warnings and fit measures. Use **Presentation view** only after reviewing the result.

## Data format

```csv
Pressure,Volume
4669,33.400
3192,33.800
1852,34.200
```

These three rows illustrate the format only; a quadratic analysis needs at least four selected points per branch. Comma, semicolon, tab or whitespace separators are accepted. Use a decimal point, no thousands separators, and exactly two columns. The optional header must identify pressure and volume in that order. The UI allows up to 500 points and imported files no larger than 1 MB.

**Units label the supplied numbers; changing a unit does not convert them.** 1 cc = 1 mL = 1 cm³. Temperature is metadata in this graphical fitting version, not an input to an equation-of-state calculation.

## Method in brief

Each branch is fitted independently as pressure against normalized volume:

```text
z = (V − V₀) / S
P_high(z) = a_high + b_high·z + c_high·z²
P_low(z)  = a_low  + b_low·z  + c_low·z²
```

The coefficients minimize the sum of squared pressure residuals for that branch. The crossing solves `P_high(z) = P_low(z)`. The program checks the location and direction of the fitted trends and flags ambiguous or sensitive crossings.

**A high R² does not establish an accurate saturation pressure.** Deep fit is optimal only within its documented constraints in exhaustive mode; larger searches are bounded, and selecting bubble/dew behavior changes the expected phase interpretation, not the numerical fit. Validate against representative laboratory cases before relying on estimates.

## Repository guide

| Path                           | Purpose                                                                  |
| ------------------------------ | ------------------------------------------------------------------------ |
| `public/`                      | The four files used by the current application; ready for static hosting |
| `scripts/`                     | Local development server and source checks                               |
| `test/`                        | Numerical, UI smoke and development-server tests                         |
| `examples/`                    | Synthetic data only; no laboratory case records                          |
| `docs/USER_GUIDE.md`           | Controls, workflow, units, exports and troubleshooting                   |
| `docs/METHOD.md`               | Equations, exact algorithm thresholds and assumptions                    |
| `docs/ARCHITECTURE.md`         | Source layout, state, data flow and hosting                              |
| `docs/VALIDATION.md`           | What tests establish and what still needs validation                     |
| `docs/REVIEW.md`               | Checklist for the joint review before public release                     |
| `docs/PROVENANCE.md`           | Which working version was copied and what was excluded                   |
| `.github/workflows/checks.yml` | Formatting, source checks and tests; no deployment                       |

Also see [CONTRIBUTING.md](CONTRIBUTING.md) and [CHANGELOG.md](CHANGELOG.md).

## Privacy, hosting and release

Measurements are processed in the browser. This version has no analytics, application server, database or automatic cloud storage. Exports remain the user's responsibility. External reference links open external websites only when followed.

The repository is intended to remain private until review. `package.json` is marked `private: true` to prevent accidental npm publication; **GitHub visibility is a separate setting**. No GitHub Pages deployment, release automation, hosting credentials or existing Site identity is included.

No open-source license has been granted. The package is marked `UNLICENSED`; an appropriate license and ownership statement must be chosen before public distribution.

A4 reports use the pinned, locally vendored jsPDF bundle in `public/vendor/`; no PDF service or external script request is required.
