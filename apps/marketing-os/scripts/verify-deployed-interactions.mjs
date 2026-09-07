import { chromium } from 'playwright';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { extname } from 'node:path';

const execFileAsync = promisify(execFile);
const deployment = process.env.DEPLOYMENT_URL;
const sha = process.env.GITHUB_SHA;
const team = process.env.VERCEL_TEAM_SLUG;

if (!deployment || !sha || !team || !process.env.VERCEL_TOKEN) {
  throw new Error('Missing deployed interaction E2E inputs');
}

const mime = (url, resourceType) => {
  const ext = extname(new URL(url).pathname).toLowerCase();
  if (resourceType === 'document' || ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js' || ext === '.mjs' || resourceType === 'script') return 'application/javascript; charset=utf-8';
  if (ext === '.css' || resourceType === 'stylesheet') return 'text/css; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.woff2') return 'font/woff2';
  if (ext === '.woff') return 'font/woff';
  return 'application/octet-stream';
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const browserErrors = [];
const responseCache = new Map();
page.on('pageerror', (error) => browserErrors.push(error.message));

await page.route('**/*', async (route) => {
  const request = route.request();
  const url = request.url();
  if (!url.startsWith(`${deployment}/`)) return route.continue();
  try {
    if (!responseCache.has(url)) {
      responseCache.set(url, execFileAsync(
        './node_modules/.bin/vercel',
        [`--scope=${team}`, 'curl', url],
        { encoding: 'buffer', maxBuffer: 32 * 1024 * 1024, env: process.env },
      ).then(({ stdout }) => stdout));
    }
    const body = await responseCache.get(url);
    await route.fulfill({ status: 200, body, contentType: mime(url, request.resourceType()) });
  } catch (error) {
    console.error(`VERCEL_CURL_PROXY_FAILURE=${url}`);
    console.error(error?.stderr?.toString?.().slice(0, 2000) ?? error);
    await route.abort();
  }
});

const qaUrl = (path) => `${deployment}${path}${path.includes('?') ? '&' : '?'}visualQa=${encodeURIComponent(sha)}`;
const goHome = async () => {
  await page.goto(qaUrl('/visual-qa/home'), { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('[data-visual-qa="preview-fixture"]').waitFor({ state: 'visible', timeout: 20000 });
};
const expectFeature = async (path, heading) => {
  await page.waitForURL((url) => url.pathname === `/visual-qa/feature/${path}` && url.searchParams.get('visualQa') === sha);
  await page.getByRole('heading', { name: heading }).waitFor();
};

try {
  await goHome();
  if (await page.locator('.metric-card').count() !== 6) throw new Error('Approved V4 must render all six KPI cards');

  await page.setViewportSize({ width: 390, height: 844 });
  await goHome();
  const mobileOrder = await page.evaluate(() =>
    ['.performance-panel', '.ai-panel', '.genome-panel', '.mit-panel', '.recent-panel', '.platform-panel']
      .map((selector) => ({ selector, top: document.querySelector(selector)?.getBoundingClientRect().top ?? -1 })),
  );
  if (mobileOrder.some((item) => item.top < 0) || mobileOrder.some((item, index) => index > 0 && item.top <= mobileOrder[index - 1].top)) {
    throw new Error(`Approved V4 mobile hierarchy changed: ${JSON.stringify(mobileOrder)}`);
  }
  if (await page.locator('.metric-card').count() !== 6) throw new Error('Approved V4 mobile KPI rail lost cards');
  console.log('APPROVED_UI_V4_HIERARCHY=PASS');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await goHome();

  await page.getByText('Dashboard', { exact: true }).click();
  await page.waitForURL((url) => url.pathname === '/visual-qa/home' && url.searchParams.get('visualQa') === sha);

  for (const [label, path] of [
    ['Audience', 'audience'],
    ['Content Calendar', 'content-calendar'],
    ['Business Genome', 'business-genome'],
    ['RLS / Security', 'rls-security'],
  ]) {
    await goHome();
    await page.getByText(label, { exact: true }).first().click();
    await expectFeature(path, label);
  }

  await goHome();
  await page.getByText('Campaigns', { exact: true }).click();
  await page.waitForURL((url) => url.pathname === '/visual-qa/campaigns' && url.searchParams.get('visualQa') === sha);
  await page.getByRole('heading', { name: 'Campaigns' }).waitFor();

  await goHome();
  await page.getByRole('link', { name: /สร้างแคมเปญใหม่/ }).click();
  await page.waitForURL((url) => url.pathname === '/visual-qa/campaigns/new' && url.searchParams.get('visualQa') === sha);
  await page.locator('[data-visual-qa="campaign-form"]').waitFor();

  await goHome();
  await page.locator('.global-search').click();
  await expectFeature('search', 'Global Search');

  await goHome();
  await page.locator('.date-filter').click();
  await page.waitForURL((url) => url.pathname === '/visual-qa/home' && url.searchParams.get('range') === '30d' && url.searchParams.get('visualQa') === sha);

  await goHome();
  await page.locator('.profile-copy').click();
  await page.waitForURL((url) => url.pathname === '/account');

  // `vercel curl` returns a redirect body without exposing its status/Location
  // through Playwright's fulfillment API, so verify the public login document
  // separately after proving that the profile control navigated to /account.
  await page.goto(`${deployment}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.getByRole('heading', { name: 'เข้าสู่ระบบ' }).waitFor();

  if (browserErrors.length > 0) throw new Error(`Browser errors: ${browserErrors.join(' | ')}`);
  console.log(`INTERACTION_E2E_SHA=${sha}`);
  console.log('INTERACTION_NAVIGATION_E2E=PASS');
  console.log('INTERACTION_KEY_FEATURES=Dashboard|Audience|Content Calendar|Business Genome|RLS Security|Campaigns|Create Campaign|Global Search|Profile|Date Filter');
} finally {
  await browser.close();
}
