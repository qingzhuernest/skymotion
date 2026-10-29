/** Explicit release scopes; unknown changes retain the previous short gate. */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const fallback = [
  'settings-center.cjs', 'shared-ui-lifecycle.cjs', 'settings-updates.cjs',
  'settings-expressive.cjs', 'shared-choice-fields.cjs', 'reported-layout.cjs',
  'document-action-links.cjs', 'confirmed-review-fixes.cjs', 'deployment-paths.cjs',
];
const groups = [
  [/^site\/language\.css$/,
    ['mobile-appbar.cjs', 'shared-ui-lifecycle.cjs', 'material-components.cjs']],
  [/^scripts\/material-web\/|^site\/material-web(?:\.|\/)/,
    ['settings-center.cjs', 'settings-expressive.cjs', 'shared-choice-fields.cjs', 'narrow-workspace-controls.cjs']],
  [/^(docs\/document-content\.json|scripts\/(build-documents\.py|document_model\.py|document-page\.html))$/,
    ['document-generation.cjs', 'document-action-links.cjs', 'bilingual-pages.cjs']],
  [/^site\/diagram-reference-store\.js$/,
    ['diagram-reference-store.cjs', 'lab-inline-comparisons.cjs', 'experiment-save.cjs']],
  [/^site\/diagram-(tools|tool-definitions|reference-renderer)\.(js|css)$/,
    ['diagram-tools.cjs', 'diagram-editing.cjs', 'reported-layout.cjs']],
  [/^site\/(custom-layout|sky-perspectives|customization-mode)\.(js|css)$/,
    ['custom-layout.cjs', 'experiment-save.cjs', 'reported-layout.cjs', 'narrow-workspace-controls.cjs']],
  [/^site\/(style|pages|design-system|controls|interface-motion)\.css$/,
    ['material-components.cjs', 'shared-choice-fields.cjs', 'reported-layout.cjs']],
  [/^site\/(preferences|material-controls|ui-palette|theme-colors)\.(js|css)$/,
    ['settings-center.cjs', 'settings-updates.cjs', 'settings-expressive.cjs', 'shared-choice-fields.cjs', 'narrow-workspace-controls.cjs', 'ui-palette.cjs']],
  [/^site\/(page-navigation|interface-motion|workbench-menu)\.(js|css)$/,
    ['unified-workbench.cjs', 'shared-ui-lifecycle.cjs', 'reported-layout.cjs']],
  [/^site\/(language|page-boot)\.js$|^site\/i18n-(lab|space)\.json$/,
    ['bilingual-pages.cjs', 'shared-ui-lifecycle.cjs']],
  [/^site\/site-catalog\.json$|^scripts\/site_sources\.py$/,
    ['bilingual-pages.cjs', 'unified-workbench.cjs']],
  [/^site\/space\//, ['space-model.cjs', 'space-exploration.cjs', 'diagram-tools.cjs']],
  [/^site\/lunar\//, ['lunar-orbit.cjs', 'diagram-tools.cjs']],
  [/^\.github\/scripts\/(prepare_site\.py|select-checks\.cjs|verify-site\.cjs)$/,
    ['release-selection.cjs', 'deployment-paths.cjs']],
];
const nodeOnly = new Set(['document-generation.cjs', 'diagram-reference-store.cjs', 'session-validation.cjs', 'release-selection.cjs']);
const generated = file => /^site\/.*\.(html|md)$/.test(file) || /^site\/(page-cache-manifest|i18n-docs)\.json$|^site\/language-data\.js$/.test(file);
const documentation = file => /^README(?:\.en)?\.md$|^(LICENSE|NOTICE|THIRD-PARTY-NOTICES\.md)$|^docs\//.test(file);
function selectChecks(files, full = false) {
  if (full) return { full: true, browser: true, tests: [] };
  if (!files) return { full: false, browser: true, tests: [...fallback].sort() };
  const tests = new Set();
  for (const file of files) {
    if (generated(file)) { tests.add('bilingual-pages.cjs'); continue; }
    if (documentation(file) && file !== 'docs/document-content.json') continue;
    const test = /^tests\/([^/]+\.cjs)$/.exec(file);
    if (test && !file.endsWith('-helpers.cjs')) { tests.add(test[1]); continue; }
    const group = groups.find(([pattern]) => pattern.test(file));
    for (const name of group ? group[1] : fallback) tests.add(name);
  }
  return { full: false, browser: [...tests].some(test => !nodeOnly.has(test)), tests: [...tests].sort() };
}
function changedFiles(base) {
  if (!/^[a-f0-9]{40}$/.test(base || '') || /^0+$/.test(base)) return null;
  try {
    return execFileSync('git', ['diff', '--name-only', '-z', `${base}..HEAD`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\0').filter(Boolean);
  } catch { return null; }
}
if (require.main === module) {
  process.chdir(path.resolve(__dirname, '../..'));
  const file = process.env.SKY_CHECK_PLAN;
  if (!file) throw new Error('SKY_CHECK_PLAN is required');
  if (process.argv[2] === '--plan') {
    const plan = selectChecks(changedFiles(process.env.SKY_BASE_SHA), process.env.FULL_REGRESSION === 'true');
    fs.writeFileSync(file, JSON.stringify(plan));
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `browser=${plan.browser}\n`);
    console.log(plan.full ? 'Full regression explicitly requested' : `Selected ${plan.tests.length} checks: ${plan.tests.join(', ') || 'repository/source checks only'}`);
  } else if (process.argv[2] === '--run') {
    const plan = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (plan.full || plan.tests.length) {
      const result = spawnSync(process.execPath, ['.github/scripts/verify-site.cjs', ...plan.tests], { stdio: 'inherit' });
      if (result.error) throw result.error;
      process.exitCode = result.status ?? 1;
    }
  } else throw new Error('Use --plan or --run');
}
module.exports = { selectChecks, changedFiles };
