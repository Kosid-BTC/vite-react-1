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
  'Traffic Sources',
  'AI แนะนำสำหรับคุณ',
  'Business Genome',
  'MIT 24 Steps',
  'Recent Activity',
  'การเชื่อมต่อกับแพลตฟอร์ม',
], 'dashboard hierarchy');

const metricsBlock = home.match(/const metrics = \[(.*?)\]\s+as const;/s)?.[1] ?? '';
const metricDefinitions = metricsBlock.match(/\blabel:\s*'/g)?.length ?? 0;
if (metricDefinitions !== 6) failures.push(`dashboard: expected 6 KPI definitions, found ${metricDefinitions}`);

for (const token of [
  'approved-login-shell',
  'ceo-ai-reference-logo.svg',
  'Marketing OS',
  'approved-login-form',
]) requireText(login, token, 'login continuity');

requireText(layout, "import './approved-ui-v4.css';", 'layout');
requireText(layout, "import './approved-login-v6.css';", 'layout');
requireText(css, 'Keep all six KPIs', 'mobile contract');
requireText(css, 'Performance first, AI second', 'mobile contract');
requireText(loginCss, '.approved-login-shell', 'login css');
if (login.includes('login-preview-kpis')) failures.push('login continuity: dashboard preview must not substitute for authenticated dashboard parity');

for (const token of [
  '0D291464-3F4B-4AD2-B7BE-C5409EC56B4F(6).jpeg',
  '4C6D6E63-535F-4E43-BD88-FD10F31624DC(4).jpeg',
  'supersedes earlier reference filenames recorded in older drafts',
  '1536x1024',
  '390x844',
  'READY FOR USE means Approved UX/UI V4 is actually running on Production',
]) requireText(contract, token, 'locked V4 acceptance');

if (failures.length) {
  console.error('APPROVED_UI_CONTRACT_FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('APPROVED_UI_CONTRACT_PASS');
console.log(JSON.stringify({
  lockedReferenceImages: ['0D291464-3F4B-4AD2-B7BE-C5409EC56B4F(6).jpeg', '4C6D6E63-535F-4E43-BD88-FD10F31624DC(4).jpeg'],
  kpiCards: 6,
  dashboardOrder: ['KPI', 'Performance', 'Traffic Sources', 'AI', 'Business Genome', 'MIT 24 Steps', 'Recent Activity', 'Platform Connections'],
  loginContinuity: true,
  productionMetricsPolicy: 'evidence-only',
}, null, 2));
