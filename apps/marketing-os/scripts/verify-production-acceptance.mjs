import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const baseUrl = new URL(process.env.BASE_URL || '');
const expectedSha = process.env.EXPECTED_SOURCE_SHA || '';
const workspaceSlug = process.env.MARKETING_OS_E2E_WORKSPACE_SLUG || '';
const email = process.env.MARKETING_OS_E2E_EMAIL || '';
const password = process.env.MARKETING_OS_E2E_PASSWORD || '';
const target = process.env.ACCEPTANCE_TARGET || 'candidate';
const outputDir = process.env.ARTIFACT_DIR || 'production-acceptance-artifacts';
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '';

assert.equal(baseUrl.protocol, 'https:', 'Acceptance URL must use HTTPS');
assert.match(expectedSha, /^[0-9a-f]{40}$/, 'EXPECTED_SOURCE_SHA must be an exact 40-character commit SHA');
assert.match(workspaceSlug, /^[a-z0-9][a-z0-9-]{1,62}$/, 'MARKETING_OS_E2E_WORKSPACE_SLUG is invalid');
assert.ok(email.includes('@'), 'MARKETING_OS_E2E_EMAIL is required');
assert.ok(password.length >= 12, 'MARKETING_OS_E2E_PASSWORD is required');
assert.ok(['candidate', 'production'].includes(target), 'ACCEPTANCE_TARGET must be candidate or production');
if (target === 'candidate') assert.ok(bypassSecret, 'VERCEL_AUTOMATION_BYPASS_SECRET is required for protected candidate deployments');

const contract = JSON.parse(await readFile('config/approved-ui-v4-visual-fingerprints.json', 'utf8'));
const lockedNames = [
  '0D291464-3F4B-4AD2-B7BE-C5409EC56B4F(6).jpeg',
  '4C6D6E63-535F-4E43-BD88-FD10F31624DC(4).jpeg',
];
assert.equal(contract.sources.length, 2, 'Approved V4 requires exactly two locked reference images');
assert.deepEqual(contract.sources.map((x) => x.filename), lockedNames, 'Locked reference filenames changed');
assert.equal(contract.sources[0].sha256, 'db7bbd69b7646d4a81156c6c6b01d83a4f107302fd94fb3601ff02994f8fa2c6');
assert.equal(contract.sources[1].sha256, '609493e33900606862e9e73c413ddf2b9d10b32600a957b20d58351a9d56d738');

const mse = (a, b) => {
  assert.equal(a.length, b.length, 'Visual fingerprint dimensions differ');
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const delta = (Number(a[i]) - Number(b[i])) / 255;
    sum += delta * delta;
  }
  return sum / a.length;
};

const correlation = (a, b) => {
  assert.equal(a.length, b.length, 'Visual fingerprint dimensions differ');
  const meanA = a.reduce((sum, value) => sum + Number(value), 0) / a.length;
  const meanB = b.reduce((sum, value) => sum + Number(value), 0) / b.length;
  let numerator = 0;
  let denomA = 0;
  let denomB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const da = Number(a[i]) - meanA;
    const db = Number(b[i]) - meanB;
    numerator += da * db;
    denomA += da * da;
    denomB += db * db;
  }
  if (!denomA || !denomB) return 0;
  return numerator / Math.sqrt(denomA * denomB);
};

const fingerprint = async (png) => Array.from(await sharp(png)
  .greyscale()
  .blur(contract.method.blurRadius)
  .resize(contract.method.width, contract.method.height, { fit: 'fill' })
  .raw()
  .toBuffer());

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const errors = [];
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({
    viewport: { width: 1536, height: 1024 },
    deviceScaleFactor: 1,
    extraHTTPHeaders: bypassSecret ? { 'x-vercel-protection-bypass': bypassSecret } : {},
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 500 && new URL(response.url()).origin === baseUrl.origin) {
      errors.push(`HTTP_${response.status()} ${new URL(response.url()).pathname}`);
    }
  });

  const loginUrl = new URL('/login', baseUrl);
  loginUrl.searchParams.set('next', `/${workspaceSlug}/home`);
  const loginResponse = await page.goto(loginUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 60000 });
  assert.ok(loginResponse && loginResponse.status() === 200, 'Login page did not return HTTP 200');
  await page.locator('form.approved-login-form input[name="email"]').fill(email);
  await page.locator('form.approved-login-form input[name="password"]').fill(password);
  await page.locator('form.approved-login-form button[type="submit"]').click();
  await page.waitForURL((url) => url.pathname === `/${workspaceSlug}/home`, { timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 60000 });

  const dashboardUrl = new URL(`/${workspaceSlug}/home`, baseUrl);
  const dashboardResponse = await page.goto(dashboardUrl.toString(), { waitUntil: 'networkidle', timeout: 60000 });
  assert.ok(dashboardResponse && dashboardResponse.status() === 200, 'Authenticated dashboard did not return HTTP 200');
  await page.locator('main.marketing-app-shell').waitFor({ state: 'visible', timeout: 30000 });

  assert.equal(await page.locator('.ai-panel.mobile-dashboard-panel').count(), 1, 'Mobile AI panel must remain in the dashboard DOM');
  assert.equal(await page.locator('.recent-panel.mobile-dashboard-panel').count(), 1, 'Mobile Recent Activity panel must remain in the dashboard DOM');

  for (const selector of [
    '.app-sidebar',
    '.topbar',
    '.global-search',
    '.topbar-actions',
    '.profile-copy',
    '.metric-grid',
    '.performance-panel',
    '.traffic-source',
    '.dashboard-side-column .ai-panel',
    '.genome-panel',
    '.mit-panel',
    '.dashboard-side-column .recent-panel',
    '.platform-panel',
  ]) {
    assert.ok(await page.locator(selector).first().isVisible(), `Required Approved V4 component missing: ${selector}`);
  }

  assert.equal(await page.locator('.metric-card').count(), 6, 'Primary dashboard must render exactly six KPI cards');
  const metricStates = await page.locator('.metric-card').evaluateAll((cards) => cards.map((card) => ({
    value: card.querySelector('.metric-value')?.textContent?.trim() ?? '',
    state: card.querySelector('.truth-chip')?.textContent?.trim() ?? '',
    hasEvidence: Boolean(card.querySelector('[data-evidence-source]')),
  })));
  for (const metric of metricStates) {
    if (metric.value !== '—' && metric.state === 'UNAVAILABLE') {
      throw new Error('A metric is numeric while marked UNAVAILABLE');
    }
    if (/\d/.test(metric.value) && !metric.hasEvidence) {
      throw new Error('A numeric KPI is missing a machine-readable evidence source');
    }
  }

  const desktopOrder = await page.locator('.dashboard-main-column').evaluate((column) => {
    const selectors = [
      '.performance-panel',
      '.ai-panel.mobile-dashboard-panel',
      '.genome-panel',
      '.mit-panel',
      '.recent-panel.mobile-dashboard-panel',
      '.platform-panel',
    ];
    const elements = selectors.map((selector) => column.querySelector(selector));
    if (elements.some((element) => !element)) return null;
    const ordered = elements.every((element, index) =>
      index === 0 || Boolean(elements[index - 1].compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING),
    );
    return { selectors, ordered };
  });
  assert.ok(desktopOrder?.ordered, 'Dashboard order must be Performance → AI → Business Genome → MIT 24 Steps → Recent Activity → Platform status');

  await mkdir(outputDir, { recursive: true });
  const desktopPng = await page.screenshot({
    path: join(outputDir, 'desktop-1536x1024.png'),
    fullPage: false,
  });
  const desktopFingerprint = await fingerprint(desktopPng);
  const mainMse = mse(desktopFingerprint, contract.sources[0].fingerprint);
  const variantMse = mse(desktopFingerprint, contract.sources[1].fingerprint);
  const mainCorrelation = correlation(desktopFingerprint, contract.sources[0].fingerprint);
  assert.ok(mainMse <= contract.thresholds.main.mseMax, `Desktop differs from primary locked reference: MSE=${mainMse}`);
  assert.ok(variantMse <= contract.thresholds.variant.mseMax, `Desktop differs from detailed locked reference: MSE=${variantMse}`);
  assert.ok(mainCorrelation >= contract.thresholds.main.correlationMin, `Desktop correlation below locked threshold: ${mainCorrelation}`);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  assert.equal(await page.locator('.metric-card').count(), 6, 'Mobile must preserve all six KPI cards');
  const performanceBox = await page.locator('.performance-panel:visible').boundingBox();
  const mobileAiBox = await page.locator('.ai-panel.mobile-dashboard-panel:visible').boundingBox();
  assert.ok(performanceBox && mobileAiBox && performanceBox.y < mobileAiBox.y, 'Mobile hierarchy must place Performance before AI recommendations');
  const mobileTitle = page.locator('.dashboard-title-row h1:visible');
  assert.equal((await mobileTitle.textContent())?.trim(), 'CEO AI Thailand', 'CEO AI Thailand branding missing on mobile');

  for (const selector of [
    '.topbar',
    '.global-search',
    '.topbar-actions',
    '.dashboard-title-row',
    '.connection-strip',
    '.metric-grid',
    '.performance-panel',
    '.traffic-source',
    '.ai-panel.mobile-dashboard-panel',
    '.genome-panel',
    '.mit-panel',
    '.recent-panel.mobile-dashboard-panel',
    '.platform-panel',
  ]) {
    assert.ok(await page.locator(selector).first().isVisible(), `Required mobile Approved V4 component missing: ${selector}`);
  }

  const mobileMetricStates = await page.locator('.metric-card').evaluateAll((cards) => cards.map((card) => {
    const rect = card.getBoundingClientRect();
    const style = getComputedStyle(card);
    return {
      display: style.display,
      visibility: style.visibility,
      width: rect.width,
      height: rect.height,
    };
  }));
  assert.equal(mobileMetricStates.length, 6, 'Mobile must preserve all six KPI cards');
  assert.ok(
    mobileMetricStates.every((card) => card.display !== 'none' && card.visibility !== 'hidden' && card.width > 0 && card.height > 0),
    'All six mobile KPI cards must remain rendered',
  );

  const mobileOrder = await page.locator('.dashboard-body-grid').evaluate((grid) => {
    const selectors = [
      '.performance-panel',
      '.ai-panel.mobile-dashboard-panel',
      '.genome-panel',
      '.mit-panel',
      '.recent-panel.mobile-dashboard-panel',
      '.platform-panel',
    ];
    const elements = selectors.map((selector) => grid.querySelector(selector));
    if (elements.some((element) => !element)) return null;
    const positions = elements.map((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        top: rect.top + window.scrollY,
        bottom: rect.bottom + window.scrollY,
        visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0,
      };
    });
    const ordered = positions.every((position, index) =>
      position.visible && (index === 0 || positions[index - 1].bottom <= position.top + 1),
    );
    return { selectors, ordered, positions };
  });
  assert.ok(
    mobileOrder?.ordered,
    'Mobile order must be Performance → AI → Business Genome → MIT 24 Steps → Recent Activity → Platform status',
  );

  const mobilePng = await page.screenshot({
    path: join(outputDir, 'mobile-390x844.png'),
    fullPage: false,
  });

  assert.deepEqual(errors, [], 'Authenticated live smoke recorded browser errors or HTTP 5xx responses');
  const manifest = {
    acceptance: 'AUTHENTICATED_PRODUCTION_UX_UI_V4',
    status: 'PASS',
    target,
    sourceSha: expectedSha,
    hostname: baseUrl.hostname,
    workspaceSlug,
    viewports: {
      desktop: { width: 1536, height: 1024, fullPage: false },
      mobile: { width: 390, height: 844, fullPage: false },
    },
    lockedReferences: lockedNames.map((filename, index) => ({
      filename,
      sha256: contract.sources[index].sha256,
    })),
    visual: {
      desktopMainMse: mainMse,
      desktopVariantMse: variantMse,
      desktopMainCorrelation: mainCorrelation,
    },
    structuralOrder: desktopOrder,
    mobileStructuralOrder: mobileOrder,
    metricStates,
    mobileMetricStates,
    screenshots: {
      desktop: sha256(desktopPng),
      mobile: sha256(mobilePng),
    },
    capturedAt: new Date().toISOString(),
  };
  await writeFile(join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log('AUTHENTICATED_DASHBOARD=PASS');
  console.log('PRODUCTION_DESKTOP_1536x1024=PASS');
  console.log('PRODUCTION_MOBILE_390x844=PASS');
  console.log('PRODUCTION_MOBILE_STRUCTURAL_ORDER=PASS');
  console.log('LOCKED_REFERENCE_VISUAL_PARITY=PASS');
  console.log('STRUCTURAL_AND_ORDER_ASSERTIONS=PASS');
  console.log(`PRODUCTION_EVIDENCE_DESKTOP_SHA256=${manifest.screenshots.desktop}`);
  console.log(`PRODUCTION_EVIDENCE_MOBILE_SHA256=${manifest.screenshots.mobile}`);
} finally {
  await browser.close();
}
