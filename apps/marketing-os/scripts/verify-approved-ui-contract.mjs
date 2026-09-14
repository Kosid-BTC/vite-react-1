import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const home = read('src/app/[workspaceSlug]/home/page.tsx');
const login = read('src/app/login/page.tsx');
const layout = read('src/app/layout.tsx');
const css = read('src/app/approved-ui-v4.css');
const loginCss = read('src/app/approved-login-v6.css');
const contract = read('APPROVED_UI_V4_SOURCE.md');

const failures = [];
const requireText = (source, token, label) => {
  if (!source.includes(token)) failures.push(`${label}: missing ${token}`);
};
const requireOrder = (source, tokens, label) => {
  let cursor = -1;
  for (const token of tokens) {
    const index = source.indexOf(token, cursor + 1);
    if (index < 0) {
      failures.push(`${label}: missing ${token}`);
      return;
    }
    if (index < cursor) {
      failures.push(`${label}: wrong order near ${token}`);
      return;
    }
    cursor = index;
  }
};

for (const token of [
  'Light left sidebar',
  '6 KPI cards',
  'Performance Overview',
  'Business Genome',
  'MIT 24 Steps',
  'No Production promotion',
]) requireText(contract, token, 'contract');

for (const token of [
  'marketing-app-shell',
  'app-sidebar',
  'metric-grid',
  'Performance Overview',
  'Traffic Sources',
  'AI แนะนำสำหรับคุณ',
  'Business Genome',
  'MIT 24 Steps',
]) requireText(home, token, 'dashboard');

requireOrder(home, [
  'metric-grid',
  'Performance Overview',
  'AI แนะนำสำหรับคุณ',
  'Business Genome',
  'MIT 24 Steps',
], 'dashboard hierarchy');

const metricDefinitions = home.match(/label: '/g)?.length ?? 0;
if (metricDefinitions !== 6) failures.push(`dashboard: expected 6 KPI definitions, found ${metricDefinitions}`);

for (const token of [
  'approved-login-shell',
  'ceo-ai-reference-logo.svg',
  'Marketing OS',
  'login-preview-kpis',
  'Performance Overview',
  'AI Recommendations',
  'Business Genome',
  'MIT 24 Steps',
]) requireText(login, token, 'login continuity');

requireText(layout, "import './approved-ui-v4.css';", 'layout');
requireText(layout, "import './approved-login-v6.css';", 'layout');
requireText(css, 'Keep all six KPIs', 'mobile contract');
requireText(css, 'Performance first, AI second', 'mobile contract');
requireText(loginCss, '.approved-login-shell', 'login css');
requireText(loginCss, '.login-preview-kpis', 'login css');

if (failures.length) {
  console.error('APPROVED_UI_CONTRACT_FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('APPROVED_UI_CONTRACT_PASS');
console.log(JSON.stringify({
  kpiCards: 6,
  dashboardOrder: ['KPI', 'Performance', 'AI', 'Business Genome', 'MIT 24 Steps'],
  loginContinuity: true,
  productionMetricsPolicy: 'evidence-only',
}, null, 2));
