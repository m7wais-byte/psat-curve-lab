// Builds public/report-preview.html and public/report-preview.pdf from the live report code
// (public/report.js), so the preview always matches what the app produces. The example data is
// fixed and illustrative, not a laboratory test. Run: npm run preview
const fs = require('node:fs');
const path = require('node:path');
const { jsPDF } = require('jspdf');
const PV = require('../public/engine.js');
const PVReport = require('../public/report.js');

// [volume (cc), pressure (psig), fit assignment] — three points near the break are left out.
const EXAMPLE = [
  [33, 4400, 'high'],
  [33.2, 4009.9666592418043, 'high'],
  [33.4, 3622.977835591895, 'high'],
  [33.6, 3250.2967412706867, 'high'],
  [33.8, 2897.9764534045594, 'high'],
  [34, 2553.1939484504937, 'high'],
  [34.2, 2213.200501249621, 'high'],
  [34.4, 1891.5274515510541, 'high'],
  [34.6, 1587.4366472594238, 'high'],
  [34.8, 1287.5869622925268, 'none'],
  [35, 996.1544100324818, 'none'],
  [35.2, 962.0040038967427, 'none'],
  [35.4, 930.3991716005709, 'low'],
  [35.6, 890.9654536183034, 'low'],
  [35.8, 853.712806217025, 'low'],
  [36, 826.4362334160887, 'low'],
  [36.2, 797.1170922466025, 'low'],
  [36.4, 761.0574506401031, 'low'],
  [36.6, 731.4865569286735, 'low'],
  [36.8, 709.6933115582652, 'low'],
  [37, 682.1163307444801, 'low'],
];
const ATMOSPHERE_PSI = 14.696;

function model() {
  const points = EXAMPLE.map(([v, p, group], id) => ({ id, v, p, group }));
  const result = PV.analyze(points, 2);
  const y = PV.yFunction(points, result, ATMOSPHERE_PSI);
  return PVReport.buildModel({
    points,
    result,
    caseName: 'Example sample 01',
    phase: 'bubble',
    pressureUnit: 'psi',
    pressureBasis: 'Gauge',
    volumeUnit: 'cc',
    temperature: '',
    boundary: 'upper',
    syntheticDemo: true,
    grid: 'paper',
    date: '18 Nov 2026',
    yCheck: {
      pb: y.best.pb,
      vb: y.best.vb,
      relativeRmse: y.best.relativeRmse,
      graphicalRelativeRmse: y.graphical?.relativeRmse ?? null,
      atEdge: y.atEdge,
      atmosphere: y.atmosphere,
    },
  });
}

function build() {
  const m = model();
  const doc = PVReport.createPdf(m, jsPDF);
  // Fixed metadata keeps the committed PDF byte-for-byte reproducible.
  doc.setCreationDate("D:20261118000000+00'00'");
  doc.setFileId('00000000000000000000000000000000');
  return {
    model: m,
    html: PVReport.html(m, '') + '\n',
    pdf: Buffer.from(doc.output('arraybuffer')),
  };
}

if (require.main === module) {
  const out = build(),
    dir = path.join(__dirname, '../public');
  fs.writeFileSync(path.join(dir, 'report-preview.html'), out.html);
  fs.writeFileSync(path.join(dir, 'report-preview.pdf'), out.pdf);
  console.log(
    `Wrote report-preview.html and report-preview.pdf (${out.model.points.length} points).`,
  );
}
module.exports = { build, EXAMPLE };
