import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { promisify } from 'node:util';
import { chromium } from 'playwright';
import sharp from 'sharp';

const execFileAsync = promisify(execFile);
const deployment = process.env.DEPLOYMENT_URL || '';
const sha = process.env.GITHUB_SHA || '';
const team = process.env.VERCEL_TEAM_SLUG || '';
const token = process.env.VERCEL_TOKEN || '';
const outputDir = 'deployed-visual-qa-artifacts';

assert.ok(deployment.startsWith('https://'), 'DEPLOYMENT_URL must be an HTTPS deployment URL');
assert.match(sha, /^[0-9a-f]{40}$/, 'GITHUB_SHA must be an exact commit SHA');
assert.ok(team && token, 'Authoritative Vercel team and token are required');

const origin = new URL(deployment).origin;
const contract = JSON.parse(await readFile('config/approved-ui-v4-visual-fingerprints.json', 'utf8'));
const lockedNames = [
  '0D291464-3F4B-4AD2-B7BE-C5409EC56B4F(6).jpeg',
  '4C6D6E63-535F-4E43-BD88-FD10F31624DC(4).jpeg',
];
assert.equal(contract.sources.length, 2, 'Exactly two locked references are required');
assert.deepEqual(contract.sources.map((source) => source.filename), lockedNames, 'Locked reference names changed');
assert.equal(contract.sources[0].sha256, 'db7bbd69b7646d4a81156c6c6b01d83a4f107302fd94fb3601ff02994f8fa2c6');
assert.equal(contract.sources[1].sha256, '609493e33900606862e9e73c413ddf2b9d10b32600a957b20d58351a9d56d738');

const mime = (url, resourceType) => {
  const extension = extname(new URL(url).pathname).toLowerCase();
  if (resourceType === 'document' || extension === '.html') return 'text/html; charset=utf-8';
  if (extension === '.js' || extension === '.mjs' || resourceType === 'script') return 'application/javascript; charset=utf-8';
  if (extension === '.css' || resourceType === 'stylesheet') return 'text/css; charset=utf-8';
  if (extension === '.svg') return 'image/svg+xml';
  if (extension === '.png') return 'image/png';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.woff2') return 'font/woff2';
  if (extension === '.woff') return 'font/woff';
  return 'application/octet-stream';
};

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

async function createPage(viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 500 && new URL(response.url()).origin === origin) {
      errors.push('HTTP_' + response.status() + ' ' + new URL(response.url()).pathname);
    }
  });
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = request.url();
    if (new URL(url).origin !== origin) return route.continue();
    try {
      const { stdout } = await execFileAsync(
        './node_modules/.bin/vercel',
        ['--scope=' + team, 'curl', url],
        { encoding: 'buffer', maxBuffer: 32 * 1024 * 1024, env: process.env },
      );
      await route.fulfill({ status: 200, body: stdout, contentType: mime(url, request.resourceType()) });
    } catch (error) {
      console.error('VERCEL_CURL_PROXY_FAILURE=' + url);
      console.error(error?.stderr?.toString?.().slice(0, 2000) ?? error);
      await route.abort();
    }
  });
  return page;
}

async function assertOverview(page, mobile = false) {
  await page.locator('main.marketing-app-shell[data-visual-qa="preview-fixture"]').waitFor({ state: 'visible', timeout: 30000 });
  assert.equal(await page.locator('.metric-card').count(), 6, 'Overview must render all six KPI cards');
  for (const selector of ['.performance-panel', '.traffic-source', '.genome-panel', '.mit-panel', '.platform-panel']) {
    assert.ok(await page.locator(selector + ':visible').first().isVisible(), 'Overview is missing visible ' + selector);
  }
  if (mobile) {
    const performance = await page.locator('.performance-panel:visible').boundingBox();
    const ai = await page.locator('.ai-panel.mobile-dashboard-panel:visible').boundingBox();
    assert.ok(await page.locator('.recent-panel.mobile-dashboard-panel:visible').first().isVisible(), 'Overview mobile is missing Recent Activity');
    assert.ok(performance && ai && performance.y < ai.y, 'Overview mobile must place Performance before AI recommendations');
    const cards = await page.locator('.metric-card').evaluateAll((nodes) => nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }));
    assert.equal(cards.length, 6);
    assert.ok(cards.every(Boolean), 'All six overview KPI cards must remain rendered on mobile');
  } else {
    for (const selector of ['.dashboard-side-column .ai-panel', '.dashboard-side-column .recent-panel']) {
      assert.ok(await page.locator(selector + ':visible').first().isVisible(), 'Overview desktop is missing visible ' + selector);
    }
    const order = await page.locator('.dashboard-body-grid').evaluate((grid) => {
      const performance = grid.querySelector('.performance-panel');
      const ai = grid.querySelector('.dashboard-side-column .ai-panel');
      return Boolean(performance && ai && (performance.compareDocumentPosition(ai) & Node.DOCUMENT_POSITION_FOLLOWING));
    });
    assert.ok(order, 'Overview desktop must place Performance before visible AI Recommendations');
  }
}

async function assertDetail(page, mobile = false) {
  await page.locator('main.detail-dashboard-shell[data-visual-qa="preview-fixture"]').waitFor({ state: 'visible', timeout: 30000 });
  assert.equal(await page.locator('.metric-card').count(), 6, 'Detailed Dashboard must render all six KPI cards');
  const selectors = [
    '.detail-campaign-performance',
    '.detail-top-content',
    '.detail-channels',
    '.detail-content-calendar',
    '.detail-audience-insights',
    '.detail-ai-insight',
    '.detail-next-actions',
    '.detail-business-genome',
    '.detail-mit-steps',
    '.detail-activity',
    '.detail-platform-status',
  ];
  for (const selector of selectors) {
    assert.equal(await page.locator(selector).count(), 1, 'Detailed Dashboard must render exactly one ' + selector);
    assert.ok(await page.locator(selector + ':visible').isVisible(), 'Detailed Dashboard is missing visible ' + selector);
  }
  const order = await page.locator('.detail-main-grid').evaluate((grid) =>
    Array.from(grid.querySelectorAll('.detail-panel')).map((node) => Number(node.getAttribute('data-order'))),
  );
  assert.deepEqual(order, [1,2,3,4,5,6,7,8,9,10,11], 'Detailed Dashboard structural order changed');
  if (mobile) {
    const positions = await page.locator('.detail-panel').evaluateAll((nodes) => nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return { top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY, visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 };
    }));
    assert.ok(positions.length === 11 && positions.every((position, index) => position.visible && (index === 0 || positions[index - 1].bottom <= position.top + 1)), 'Detailed Dashboard mobile section order/visibility failed');
    const cards = await page.locator('.metric-card').evaluateAll((nodes) => nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }));
    assert.equal(cards.length, 6);
    assert.ok(cards.every(Boolean), 'All six detailed KPI cards must remain rendered on mobile');
  }
}

async function captureTarget({ routePath, key, source, desktopFile, mobileFile, assertPage }) {
  const page = await createPage({ width: 1536, height: 1024 });
  try {
    const url = origin + routePath + '?visualQa=' + encodeURIComponent(sha);
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    assert.ok(response && response.status() === 200, key + ' route did not return HTTP 200');
    await assertPage(page, false);
    const desktop = await page.screenshot({ path: join(outputDir, desktopFile), fullPage: false });
    const actual = await fingerprint(desktop);
    const mseValue = mse(actual, source.fingerprint);
    const correlationValue = correlation(actual, source.fingerprint);
    const mseMax = source.key === 'main' ? contract.thresholds.main.mseMax : contract.thresholds.variant.mseMax;
    assert.ok(mseValue <= mseMax, key + ' desktop visual MSE exceeds locked threshold: ' + mseValue);
    if (source.key === 'main') {
      assert.ok(correlationValue >= contract.thresholds.main.correlationMin, key + ' desktop correlation is below locked threshold: ' + correlationValue);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await assertPage(page, true);
    const mobile = await page.screenshot({ path: join(outputDir, mobileFile), fullPage: false });

    return {
      key,
      route: routePath,
      desktopMse: mseValue,
      desktopCorrelation: correlationValue,
      desktopSha256: sha256(desktop),
      mobileSha256: sha256(mobile),
    };
  } finally {
    await page.close();
  }
}

try {
  const overview = await captureTarget({
    routePath: '/visual-qa/home',
    key: 'overview',
    source: contract.sources[0],
    desktopFile: 'overview-desktop-1536x1024.png',
    mobileFile: 'overview-mobile-390x844.png',
    assertPage: assertOverview,
  });
  const detail = await captureTarget({
    routePath: '/visual-qa/dashboard',
    key: 'detail',
    source: contract.sources[1],
    desktopFile: 'detail-desktop-1536x1024.png',
    mobileFile: 'detail-mobile-390x844.png',
    assertPage: assertDetail,
  });
  assert.deepEqual(errors, [], 'Deployed visual QA recorded browser errors or HTTP 5xx responses');

  const manifest = {
    acceptance: 'TWO_LOCKED_REFERENCE_VISUAL_QA',
    status: 'PASS',
    sourceSha: sha,
    deployment: origin,
    viewportEvidence: {
      desktop: { width: 1536, height: 1024 },
      mobile: { width: 390, height: 844 },
    },
    references: lockedNames.map((filename, index) => ({ filename, sha256: contract.sources[index].sha256 })),
    targets: [overview, detail],
    capturedAt: new Date().toISOString(),
  };
  await writeFile(join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log('OVERVIEW_DESKTOP_1536x1024=PASS');
  console.log('OVERVIEW_MOBILE_390x844=PASS');
  console.log('DETAIL_DESKTOP_1536x1024=PASS');
  console.log('DETAIL_MOBILE_390x844=PASS');
  console.log('TWO_LOCKED_REFERENCE_PARITY=PASS');
  console.log('STRUCTURAL_AND_ORDER_ASSERTIONS=PASS');
  console.log('PRODUCTION_ACCEPTANCE_EVIDENCE=NOT_CLAIMED_PREVIEW_ONLY');
} finally {
  await browser.close();
}
