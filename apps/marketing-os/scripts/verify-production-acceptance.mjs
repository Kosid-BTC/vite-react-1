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
assert.deepEqual(contract.sources.map((source) => source.filename), lockedNames, 'Locked reference filenames changed');
assert.equal(contract.sources[0].sha256, 'db7bbd69b7646d4a81156c6c6b01d83a4f107302fd94fb3601ff02994f8fa2c6');
assert.equal(contract.sources[1].sha256, '609493e33900606862e9e73c413ddf2b9d10b32600a957b20d58351a9d56d738');

const mse = (a, b) => {
  assert.equal(a.length, b.length, 'Visual fingerprint dimensions differ');
  let sum = 0;
  for (let index = 0; index < a.length; index += 1) {
    const delta = (Number(a[index]) - Number(b[index])) / 255;
    sum += delta * delta;
  }
  return sum / a.length;
};

const correlation = (a, b) => {
  assert.equal(a.length, b.length, 'Visual fingerprint dimensions differ');
  const meanA = a.reduce((sum, value) => sum + Number(value), 0) / a.length;
  const meanB = b.reduce((sum, value) => sum + Number(value), 0) / b.length;
  let numerator = 0, denomA = 0, denomB = 0;
  for (let index = 0; index < a.length; index += 1) {
    const da = Number(a[index]) - meanA;
    const db = Number(b[index]) - meanB;
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
await mkdir(outputDir, { recursive: true });
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
      errors.push('HTTP_' + response.status() + ' ' + new URL(response.url()).pathname);
    }
  });

  const loginUrl = new URL('/login', baseUrl);
  loginUrl.searchParams.set('next', '/' + workspaceSlug + '/home');
  const loginResponse = await page.goto(loginUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 60000 });
  assert.ok(loginResponse && loginResponse.status() === 200, 'Login page did not return HTTP 200');
  await page.locator('form.approved-login-form input[name="email"]').fill(email);
  await page.locator('form.approved-login-form input[name="password"]').fill(password);
  await page.locator('form.approved-login-form button[type="submit"]').click();
  await page.waitForURL((url) => url.pathname === '/' + workspaceSlug + '/home', { timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 60000 });

  const assertOverview = async (mobile) => {
    await page.locator('main.marketing-app-shell').waitFor({ state: 'visible', timeout: 30000 });
    for (const selector of [
      '.topbar', '.global-search', '.topbar-actions', '.dashboard-title-row',
      '.metric-grid', '.performance-panel', '.traffic-source',
      '.genome-panel', '.mit-panel', '.platform-panel',
    ]) {
      assert.ok(await page.locator(selector).first().isVisible(), 'Overview missing ' + selector);
    }
    if (mobile) {
      for (const selector of ['.ai-panel.mobile-dashboard-panel', '.recent-panel.mobile-dashboard-panel']) {
        assert.ok(await page.locator(selector + ':visible').first().isVisible(), 'Overview mobile missing ' + selector);
      }
    } else {
      for (const selector of ['.dashboard-side-column .ai-panel', '.dashboard-side-column .recent-panel']) {
        assert.ok(await page.locator(selector + ':visible').first().isVisible(), 'Overview desktop missing ' + selector);
      }
      const desktopOrder = await page.locator('.dashboard-body-grid').evaluate((grid) => {
        const performance = grid.querySelector('.performance-panel');
        const ai = grid.querySelector('.dashboard-side-column .ai-panel');
        return Boolean(performance && ai && (performance.compareDocumentPosition(ai) & Node.DOCUMENT_POSITION_FOLLOWING));
      });
      assert.ok(desktopOrder, 'Overview desktop must place Performance before visible AI Recommendations');
    }
    assert.equal(await page.locator('.metric-card').count(), 6, 'Overview must render exactly six KPI cards');
    const metricStates = await page.locator('.metric-card').evaluateAll((cards) => cards.map((card) => ({
      value: card.querySelector('.metric-value')?.textContent?.trim() ?? '',
      state: card.querySelector('.truth-chip')?.textContent?.trim() ?? '',
      hasEvidence: Boolean(card.querySelector('[data-evidence-source]')),
    })));
    for (const metric of metricStates) {
      if (metric.value !== '—' && metric.state === 'UNAVAILABLE') throw new Error('A metric is numeric while marked UNAVAILABLE');
      if (/\d/.test(metric.value) && !metric.hasEvidence) throw new Error('A numeric KPI is missing a machine-readable evidence source');
    }
    if (mobile) {
      const performance = await page.locator('.performance-panel:visible').boundingBox();
      const ai = await page.locator('.ai-panel.mobile-dashboard-panel:visible').boundingBox();
      assert.ok(performance && ai && performance.y < ai.y, 'Overview mobile must place Performance before AI recommendations');
      const visibleCards = await page.locator('.metric-card').evaluateAll((cards) => cards.map((card) => {
        const rect = card.getBoundingClientRect();
        const style = getComputedStyle(card);
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      }));
      assert.equal(visibleCards.length, 6);
      assert.ok(visibleCards.every(Boolean), 'All six overview KPI cards must remain rendered on mobile');
    } else {
      const order = await page.locator('.dashboard-main-column').evaluate((column) => {
        const selectors = ['.performance-panel', '.ai-panel.mobile-dashboard-panel', '.genome-panel', '.mit-panel', '.recent-panel.mobile-dashboard-panel', '.platform-panel'];
        const nodes = selectors.map((selector) => column.querySelector(selector));
        if (nodes.some((node) => !node)) return false;
        return nodes.every((node, index) => index === 0 || Boolean(nodes[index - 1].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING));
      });
      assert.ok(order, 'Overview desktop order must keep analytics before AI, then Genome, MIT, Activity and Platform');
    }
    return metricStates;
  };

  const assertDetail = async (mobile) => {
    await page.locator('main.detail-dashboard-shell').waitFor({ state: 'visible', timeout: 30000 });
    for (const selector of [
      '.topbar', '.global-search', '.topbar-actions', '.detail-title-row',
      '.detail-workspace-strip', '.detail-campaign-performance', '.detail-top-content',
      '.detail-channels', '.detail-content-calendar', '.detail-audience-insights',
      '.detail-ai-insight', '.detail-next-actions', '.detail-business-genome',
      '.detail-mit-steps', '.detail-activity', '.detail-platform-status',
    ]) {
      assert.ok(await page.locator(selector + ':visible').first().isVisible(), 'Detailed Dashboard missing ' + selector);
    }
    assert.equal(await page.locator('.metric-card').count(), 6, 'Detailed Dashboard must render exactly six KPI cards');
    const metricValues = await page.locator('.metric-card .metric-value').allTextContents();
    assert.ok(metricValues.every((value) => value.trim() === '—'), 'Detailed Dashboard must not fabricate KPI values');
    const order = await page.locator('.detail-main-grid').evaluate((grid) =>
      Array.from(grid.querySelectorAll('.detail-panel')).map((node) => Number(node.getAttribute('data-order'))),
    );
    assert.deepEqual(order, [1,2,3,4,5,6,7,8,9,10,11], 'Detailed Dashboard desktop structural order changed');
    if (mobile) {
      const positions = await page.locator('.detail-panel').evaluateAll((nodes) => nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return { top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY, visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 };
      }));
      assert.ok(positions.length === 11 && positions.every((position, index) => position.visible && (index === 0 || positions[index - 1].bottom <= position.top + 1)), 'Detailed Dashboard mobile order/visibility failed');
    }
  };

  const homeUrl = new URL('/' + workspaceSlug + '/home', baseUrl);
  const homeResponse = await page.goto(homeUrl.toString(), { waitUntil: 'networkidle', timeout: 60000 });
  assert.ok(homeResponse && homeResponse.status() === 200, 'Authenticated overview did not return HTTP 200');
  const overviewMetricStates = await assertOverview(false);
  const overviewDesktop = await page.screenshot({ path: join(outputDir, 'overview-desktop-1536x1024.png'), fullPage: false });
  const overviewFingerprint = await fingerprint(overviewDesktop);
  const overviewMse = mse(overviewFingerprint, contract.sources[0].fingerprint);
  const overviewCorrelation = correlation(overviewFingerprint, contract.sources[0].fingerprint);
  assert.ok(overviewMse <= contract.thresholds.main.mseMax, 'Overview desktop differs from primary locked reference: MSE=' + overviewMse);
  assert.ok(overviewCorrelation >= contract.thresholds.main.correlationMin, 'Overview desktop correlation below locked threshold: ' + overviewCorrelation);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await assertOverview(true);
  const overviewMobile = await page.screenshot({ path: join(outputDir, 'overview-mobile-390x844.png'), fullPage: false });

  await page.setViewportSize({ width: 1536, height: 1024 });
  const detailUrl = new URL('/' + workspaceSlug + '/dashboard', baseUrl);
  const detailResponse = await page.goto(detailUrl.toString(), { waitUntil: 'networkidle', timeout: 60000 });
  assert.ok(detailResponse && detailResponse.status() === 200, 'Authenticated detailed Dashboard did not return HTTP 200');
  await assertDetail(false);
  const detailDesktop = await page.screenshot({ path: join(outputDir, 'detail-desktop-1536x1024.png'), fullPage: false });
  const detailFingerprint = await fingerprint(detailDesktop);
  const detailMse = mse(detailFingerprint, contract.sources[1].fingerprint);
  assert.ok(detailMse <= contract.thresholds.variant.mseMax, 'Detailed Dashboard differs from second locked reference: MSE=' + detailMse);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await assertDetail(true);
  const detailMobile = await page.screenshot({ path: join(outputDir, 'detail-mobile-390x844.png'), fullPage: false });

  assert.deepEqual(errors, [], 'Authenticated live smoke recorded browser errors or HTTP 5xx responses');
  const manifest = {
    acceptance: 'AUTHENTICATED_TWO_REFERENCE_UX_UI_V4',
    status: 'PASS',
    target,
    sourceSha: expectedSha,
    hostname: baseUrl.hostname,
    workspaceSlug,
    viewports: {
      desktop: { width: 1536, height: 1024, fullPage: false },
      mobile: { width: 390, height: 844, fullPage: false },
    },
    lockedReferences: lockedNames.map((filename, index) => ({ filename, sha256: contract.sources[index].sha256 })),
    visual: { overviewDesktopMse: overviewMse, overviewDesktopCorrelation: overviewCorrelation, detailDesktopMse: detailMse },
    structuralOrder: { overview: 'PASS', detail: 'PASS' },
    metricStates: overviewMetricStates,
    screenshots: {
      overviewDesktop: sha256(overviewDesktop),
      overviewMobile: sha256(overviewMobile),
      detailDesktop: sha256(detailDesktop),
      detailMobile: sha256(detailMobile),
    },
    capturedAt: new Date().toISOString(),
  };
  await writeFile(join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log('AUTHENTICATED_OVERVIEW_DESKTOP_1536x1024=PASS');
  console.log('AUTHENTICATED_OVERVIEW_MOBILE_390x844=PASS');
  console.log('AUTHENTICATED_DETAIL_DESKTOP_1536x1024=PASS');
  console.log('AUTHENTICATED_DETAIL_MOBILE_390x844=PASS');
  console.log('TWO_LOCKED_REFERENCE_VISUAL_PARITY=PASS');
  console.log('STRUCTURAL_AND_ORDER_ASSERTIONS=PASS');
} finally {
  await browser.close();
}
