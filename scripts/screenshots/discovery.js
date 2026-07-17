const { chromium } = require('playwright-core');
const fs = require('fs');
const os = require('os');
const path = require('path');

const EXEC = process.env.CHROMIUM_PATH;
if (!EXEC) {throw new Error('Set CHROMIUM_PATH to a Chrome for Testing binary (see scripts/screenshots/README.md)');}
const OUT = process.env.OUT_DIR || '.';

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC, headless: true });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const log = (m) => console.log(`[discovery] ${m}`);

    const token = fs.readFileSync(path.join(os.homedir(), '.vscode/cli/serve-web-token'), 'utf8').trim();
    await page.goto(`http://127.0.0.1:8000/?tkn=${encodeURIComponent(token)}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.monaco-workbench', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const isDark = async () => page.evaluate(() => !!document.querySelector('.monaco-workbench.vs-dark'));
    for (let attempt = 0; attempt < 3 && !(await isDark()); attempt++) {
      await page.locator('.monaco-workbench').click({ position: { x: 700, y: 10 } });
      await page.keyboard.press('Meta+KeyK');
      await page.waitForTimeout(300);
      await page.keyboard.press('Meta+KeyT');
      await page.waitForTimeout(800);
      await page.keyboard.type('Dark Modern');
      await page.waitForTimeout(600);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1200);
    }
    log('theme dark=' + (await isDark()));

    // Hide the secondary sidebar (Chat) for a clean editor area.
    const hideAux = page.locator('[aria-label^="Hide Secondary Side Bar"]');
    if (await hideAux.isVisible().catch(() => false)) { await hideAux.click(); await page.waitForTimeout(600); }

    await page.locator('.activitybar [aria-label^="NightVision"]').first().click();
    const inner = page.frameLocator('iframe.webview.ready').frameLocator('#active-frame');
    await inner.locator('text=OVERVIEW').waitFor({ timeout: 30000 });
    await inner.locator('body').evaluate((b) => {
      const s = b.ownerDocument.createElement('style');
      s.textContent = '.tooltiptext { display: none !important; }';
      b.ownerDocument.head.appendChild(s);
    });

    // Match capture.js: ~500 px sidebar. Park the mouse on the status bar,
    // which is outside this script's clip (the clip here includes the editor).
    const widenBy = async (dx) => {
      const sb = await page.locator('.part.sidebar').boundingBox();
      const sashes = await page.locator('.monaco-sash.vertical').all();
      for (const sash of sashes) {
        const b = await sash.boundingBox();
        if (b && Math.abs(b.x + b.width / 2 - (sb.x + sb.width)) < 8) {
          const y = sb.y + 300;
          await page.mouse.move(b.x + b.width / 2, y);
          await page.mouse.down();
          await page.mouse.move(b.x + b.width / 2 + dx, y, { steps: 12 });
          await page.mouse.up();
          await page.waitForTimeout(1200);
          return true;
        }
      }
      return false;
    };
    const widened = await widenBy(200);
    await page.mouse.move(600, 990);
    await page.waitForTimeout(400);
    log('sidebar widened=' + widened);

    await inner.locator('a[href="/api-discovery"]').click();
    await inner.locator('#path-to-folder').waitFor({ timeout: 15000 });
    await inner.locator('#path-to-folder').fill('/tmp/javaspringvulny');
    await inner.locator('#path-to-folder').blur();
    await page.waitForTimeout(1000);
    await inner.locator('#language').selectOption({ label: 'Java' });
    await page.waitForTimeout(500);

    await inner.getByRole('button', { name: 'Generate OpenAPI Spec' }).click();
    log('extraction started');
    await inner.locator('text=Nightvision Extractor found:').waitFor({ timeout: 300000 });
    log('extraction finished');
    await page.waitForTimeout(3000); // let the editor open and highlight

    // Blur webview focus ring
    try {
      await inner.locator('body').evaluate((b) => {
        const a = b.ownerDocument.activeElement;
        if (a && a.blur) {a.blur();}
      });
    } catch (e) { /* ignore */ }
    await page.waitForTimeout(500);

    const ab = await page.locator('.part.activitybar').boundingBox();
    const ed = await page.locator('.part.editor').boundingBox();
    const sb = await page.locator('.part.statusbar').boundingBox();
    const x = ab.x;
    const y = ab.y;
    const width = ed.x + ed.width - x;
    const height = (sb ? sb.y : 1000) - y;
    await page.screenshot({ path: path.join(OUT, 'api_discovery_example.png'), clip: { x, y, width, height } });
    log(`shot api_discovery_example.png (${Math.round(width)}x${Math.round(height)})`);

    log('done');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('[discovery] FAILED:', e.message); process.exit(1); });
