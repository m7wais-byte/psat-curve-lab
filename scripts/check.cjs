const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
for (const directory of ['public', 'scripts', 'test']) {
  for (const name of fs.readdirSync(path.join(root, directory))) {
    if (/\.(cjs|js)$/.test(name)) {
      execFileSync(process.execPath, ['--check', path.join(root, directory, name)]);
    }
  }
}
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
assert.equal(ids.length, new Set(ids).size, 'HTML IDs must be unique');
for (const [, id] of app.matchAll(/\$\('([^']+)'\)/g)) {
  assert(ids.includes(id), `Missing HTML control: ${id}`);
}
for (const [, asset] of html.matchAll(
  /(?:src|href)="([^"#]+\.(?:css|js)(?:\?[^" ]*)?)"/g,
)) {
  assert(
    fs.existsSync(path.join(root, 'public', asset.split('?')[0])),
    `Missing asset: ${asset}`,
  );
}
assert(
  html.indexOf('id="phase"') < html.indexOf('id="data"'),
  'Phase selection must precede data',
);
assert(html.includes('id="shade"'), 'Range-shading control is required');
assert(
  !fs.existsSync(path.join(root, '.openai')),
  'Deployment identity must not be bundled',
);
console.log('JavaScript syntax, HTML control wiring and static assets passed.');
