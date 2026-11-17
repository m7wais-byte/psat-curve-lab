// This intentionally small fake DOM is not a browser or a visual-layout test.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function element(id = '') {
  const classes = new Set();
  return {
    id,
    value: '',
    textContent: '',
    innerHTML: '',
    style: {},
    dataset: {},
    files: [],
    disabled: false,
    checked: false,
    hidden: false,
    children: [],
    attributes: {},
    classList: {
      toggle(name, force) {
        const add = force === undefined ? !classes.has(name) : force;
        if (add) classes.add(name);
        else classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      },
    },
    append(child) {
      this.children.push(child);
    },
    replaceChildren() {
      this.children = [];
    },
    setAttribute(key, value) {
      this.attributes[key] = value;
    },
    querySelectorAll(selector) {
      if (selector !== '[data-id]') return [];
      this.pointElements = [...this.innerHTML.matchAll(/data-id="(\d+)"/g)].map((m) => {
        const point = element();
        point.dataset.id = m[1];
        return point;
      });
      return this.pointElements;
    },
    querySelector(selector) {
      return selector === 'svg' ? { outerHTML: this.innerHTML } : null;
    },
    click() {
      this.onclick?.();
    },
    scrollIntoView() {
      this.scrolled = true;
    },
  };
}
function harness() {
  const els = {};
  const get = (id) => (els[id] ??= element(id));
  const tools = ['high', 'low', 'none'].map((group) => {
    const el = element();
    el.dataset.tool = group;
    return el;
  });
  const help = element();
  const document = {
    body: element('body'),
    getElementById: get,
    createElement: () => element(),
    querySelectorAll(selector) {
      if (selector === '[data-tool]') return tools;
      if (selector === 'a[href="#aboutTool"]') return [help];
      return [];
    },
  };
  const defaults = {
    phase: '',
    punit: 'psi',
    basis: 'Gauge',
    vunit: 'cc',
    tunit: '°C',
    model: '2',
    grid: 'paper',
    boundary: 'upper',
    direction: 'unknown',
  };
  for (const [id, value] of Object.entries(defaults)) get(id).value = value;
  get('shade').checked = true;
  const events = {},
    blobs = [];
  const window = {
    addEventListener: (name, fn) => (events[name] = fn),
    scrollTo() {},
    print() {},
  };
  const context = {
    document,
    window,
    console,
    Blob,
    setTimeout: (fn) => fn(),
    URL: {
      createObjectURL: (blob) => {
        blobs.push(blob);
        return 'blob:test';
      },
      revokeObjectURL() {},
    },
  };
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, '../public/engine.js'), 'utf8'),
    context,
  );
  context.PV = window.PV;
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8'),
    context,
  );
  return {
    els,
    get,
    tools,
    help,
    document,
    context,
    events,
    blobs,
    run: (code) => vm.runInContext(code, context),
    demo() {
      get('phase').value = 'bubble';
      get('phase').onchange();
      get('demo').onclick();
    },
  };
}
module.exports = { harness };
