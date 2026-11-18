const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const PV = require('../public/engine.js');
const { harness } = require('./harness.cjs');
function synthetic(n = 12) {
  return Array.from({ length: n }, (_, id) => {
    const v = 1 + (2 * id) / (n - 1),
      d = v - 2;
    let p = d < 0 ? 1000 - 500 * d + 25 * d * d : 1000 - 80 * d + 4 * d * d;
    p += Math.sin(id * 1.7) * 2;
    if (id === 2) p += 60;
    return { id, v, p, group: 'none' };
  });
}
test('exhaustive deep search matches an independent enumeration of permitted selections', () => {
  const points = synthetic(),
    original = JSON.stringify(points),
    d = PV.deepFit(points);
  let best = -Infinity,
    examined = 0;
  for (let mask = 0; mask < 2 ** points.length; mask++) {
    const kept = points.filter((_, i) => !((mask >> i) & 1));
    if (points.length - kept.length > 3) continue;
    for (let split = 5; split <= kept.length - 5; split++) {
      examined++;
      const assigned = points.map((p, i) => ({
        ...p,
        group: (mask >> i) & 1 ? 'none' : p.v <= kept[split - 1].v ? 'high' : 'low',
      }));
      try {
        const r = PV.analyze(assigned);
        if (r.intersection) best = Math.max(best, Math.min(r.high.r2, r.low.r2));
      } catch {}
    }
  }
  assert.equal(d.search.complete, true);
  assert.equal(d.search.mode, 'exhaustive');
  assert.equal(d.search.examined, examined);
  assert.equal(examined, 93);
  assert(Math.abs(d.search.minimumR2 - best) < 1e-12);
  assert.equal(JSON.stringify(points), original);
  assert(PV.analyze(d.points).intersection);
  assert(d.points.filter((p) => p.group !== 'none').length >= 9);
  assert.deepEqual(PV.deepFit([...points].reverse()).points.reverse(), d.points);
  assert.deepEqual(
    PV.deepFit(points.map((p) => ({ ...p, p: p.p * 0.01 }))).points.map((p) => p.group),
    d.points.map((p) => p.group),
  );
});
test('larger deep searches disclose bounds, report progress and retain evidence', () => {
  const events = [],
    points = synthetic(24),
    d = PV.deepFit(points, 2, (p) => events.push(p));
  assert.equal(d.search.mode, 'bounded');
  assert.equal(d.search.complete, false);
  assert(d.search.examined <= 30000);
  assert(events.length > 0);
  assert(d.points.filter((p) => p.group !== 'none').length >= 18);
  assert(PV.analyze(d.points).intersection);
});
test('deep search rejects missing IDs, undefined R² and unsupported fits without forcing a result', () => {
  assert.throws(() => PV.deepFit(synthetic().map((p) => ({ ...p, id: 1 }))), /unique/);
  assert.throws(
    () => PV.deepFit(synthetic().map((p) => ({ ...p, p: 1000 }))),
    /No supported/,
  );
  assert.throws(() => PV.deepFit(synthetic(), 3), /Choose/);
});
function mockWorkers() {
  const workers = [];
  class Worker {
    constructor(url) {
      this.url = url;
      workers.push(this);
    }
    postMessage(message) {
      this.message = message;
    }
    terminate() {
      this.terminated = true;
    }
    emit(data) {
      this.onmessage({ data: { requestId: this.message.requestId, ...data } });
    }
    complete() {
      this.emit({
        type: 'result',
        ...PV.deepFit(this.message.points, this.message.degree),
      });
    }
  }
  return { workers, Worker };
}
test('worker completion applies current results, shows search scope and records search metadata', async () => {
  const { Worker, workers } = mockWorkers(),
    h = harness({ Worker });
  h.demo();
  const w = workers[0];
  assert.match(w.url, /fit-worker/);
  assert(h.get('suggest').disabled);
  assert(!h.get('cancelFit').hidden);
  assert(h.get('print').disabled);
  w.emit({ type: 'progress', progress: { examined: 256 } });
  assert.match(h.get('fitSearchStatus').textContent, /256/);
  w.complete();
  assert(w.terminated);
  assert(!h.get('suggest').disabled);
  assert(h.get('cancelFit').hidden);
  assert(!h.get('print').disabled);
  assert.match(h.get('fitSearchStatus').textContent, /Bounded search/);
  h.get('export').onclick();
  const data = JSON.parse(await h.blobs.at(-1).text());
  assert.equal(data.automaticSelection.mode, 'bounded');
  assert(data.automaticSelection.examined > 0);
});
test('Stop, manual edits and new input invalidate stale worker results without overwriting choices', () => {
  const { Worker, workers } = mockWorkers(),
    h = harness({ Worker });
  h.demo();
  workers[0].complete();
  h.get('suggest').onclick();
  const cancelled = workers.at(-1);
  const original = h.run('JSON.stringify(points)');
  h.get('cancelFit').onclick();
  cancelled.complete();
  assert(cancelled.terminated);
  assert.equal(h.run('JSON.stringify(points)'), original);
  h.get('suggest').onclick();
  const edited = workers.at(-1);
  h.run('setGroup(0,"none")');
  const manual = h.run('JSON.stringify(points)');
  edited.complete();
  assert(edited.terminated);
  assert.equal(h.run('JSON.stringify(points)'), manual);
  h.get('suggest').onclick();
  const replaced = workers.at(-1);
  h.get('data').oninput();
  replaced.complete();
  assert.equal(h.run('points.length'), 0);
  assert(replaced.terminated);
});
test('worker errors preserve the previous selection and restore controls', () => {
  const { Worker, workers } = mockWorkers(),
    h = harness({ Worker });
  h.demo();
  workers[0].complete();
  const before = h.run('JSON.stringify(points)');
  h.get('suggest').onclick();
  workers.at(-1).onerror();
  assert.equal(h.run('JSON.stringify(points)'), before);
  assert(!h.get('suggest').disabled);
  assert(h.get('cancelFit').hidden);
  assert.match(h.get('errors').textContent, /could not run/);
});
test('the shipped worker loads the same engine and returns plain results and errors', () => {
  const messages = [],
    context = { postMessage: (m) => messages.push(m) };
  context.self = context;
  vm.createContext(context);
  context.importScripts = (url) =>
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, '../public', url.split('?')[0]), 'utf8'),
      context,
    );
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, '../public/fit-worker.js'), 'utf8'),
    context,
  );
  context.onmessage({ data: { requestId: 7, points: synthetic(), degree: 2 } });
  assert.equal(messages.at(-1).type, 'result');
  assert.equal(messages.at(-1).requestId, 7);
  assert.deepEqual(
    JSON.parse(JSON.stringify(messages.at(-1).points)),
    PV.deepFit(synthetic()).points,
  );
  context.onmessage({ data: { requestId: 8, points: [], degree: 2 } });
  assert.equal(messages.at(-1).type, 'error');
  assert.equal(messages.at(-1).requestId, 8);
});
