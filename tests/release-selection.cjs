/** Scope release checks without letting an empty/unknown diff run the full suite. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { selectChecks, changedFiles } = require('../.github/scripts/select-checks.cjs');
const unknown = selectChecks(null);
assert.equal(unknown.full, false);
assert.equal(unknown.tests.length, 9);
assert.deepEqual(selectChecks(['site/unrecognized-module.js']), unknown);
assert.equal(changedFiles('untrusted;command'), null);
assert.equal(changedFiles('0'.repeat(40)), null);
const docs = selectChecks(['README.md', 'docs/architecture/PRODUCT.md']);
assert.deepEqual(docs, { full: false, browser: false, tests: [] });
assert.deepEqual(selectChecks(['site/diagram-reference-store.js']).tests,
  ['diagram-reference-store.cjs', 'experiment-save.cjs', 'lab-inline-comparisons.cjs']);
const combined = selectChecks(['site/diagram-reference-store.js', 'site/diagram-tools.js', 'site/lab.html']);
assert(combined.tests.includes('bilingual-pages.cjs'));
assert(combined.tests.includes('diagram-tools.cjs'));
assert.equal(new Set(combined.tests).size, combined.tests.length);
assert.equal(selectChecks(['tests/session-validation.cjs']).browser, false);
assert.equal(selectChecks(['tests/diagram-test-helpers.cjs']).browser, true);
assert.deepEqual(selectChecks([], true), { full: true, browser: true, tests: [] });
for (const file of ['site/custom-layout.js', 'site/design-system.css', 'docs/document-content.json', '.github/scripts/select-checks.cjs'])
  for (const name of selectChecks([file]).tests) assert(fs.existsSync('tests/' + name), name);
console.log('PASS bounded release scopes, deduplication, Node-only changes, unknown/base fallback and explicit full opt-in');
