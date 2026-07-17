const { chromium } = require('playwright-core');
const os = require('os');
const path = require('path');

const EXEC = process.env.CHROMIUM_PATH;
if (!EXEC) {throw new Error('Set CHROMIUM_PATH to a Chrome for Testing binary (see scripts/screenshots/README.md)');}
const OUT = process.env.OUT_DIR || '.';

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC, headless: true });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1512, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const log = (m) => console.log(`[probe] ${m}`);

    const token = require('fs').readFileSync(path.join(os.homedir(), '.vscode/cli/serve-web-token'), 'utf8').trim();
    await page.goto(`http://127.0.0.1:8000/?tkn=${encodeURIComponent(token)}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.monaco-workbench', { timeout: 30000 });
    log('workbench loaded');

    const nvIcon = page.locator('.activitybar [aria-label^="NightVision"]').first();
    await nvIcon.waitFor({ timeout: 30000 });
    await nvIcon.click();
    log('clicked NightVision activity icon');

    const outer = page.frameLocator('iframe.webview.ready');
    const inner = outer.frameLocator('#active-frame');
    const sidebar = page.locator('.part.sidebar');

    await inner.locator('text=OVERVIEW').waitFor({ timeout: 30000 });
    log('overview visible');
    await sidebar.screenshot({ path: path.join(OUT, 'probe_1_overview.png') });

    await inner.getByRole('link', { name: 'API and Web Security Testing' }).click();
    await inner.getByRole('link', { name: 'Projects', exact: true }).waitFor({ timeout: 10000 });
    log('submenu expanded');
    await sidebar.screenshot({ path: path.join(OUT, 'probe_2_submenu.png') });

    await inner.getByRole('link', { name: 'Projects', exact: true }).click();
    await page.waitForTimeout(4000);
    const bodyText = await inner.locator('body').innerText();
    const navigated = /CREATE PROJECT|CURRENT PROJECT/i.test(bodyText);
    log(`clicked Projects; navigated=${navigated}`);
    await sidebar.screenshot({ path: path.join(OUT, 'probe_3_projects.png') });
    if (!navigated) {log('BODY TEXT WAS: ' + bodyText.slice(0, 400).replace(/\n/g, ' | '));}

    log('done');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('[probe] FAILED:', e.message); process.exit(1); });
