const { chromium } = require('playwright-core');
const fs = require('fs');
const os = require('os');
const path = require('path');

const EXEC = process.env.CHROMIUM_PATH;
if (!EXEC) {throw new Error('Set CHROMIUM_PATH to a Chrome for Testing binary (see scripts/screenshots/README.md)');}
const OUT = process.env.OUT_DIR || '.';
const PAD = 14;

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC, headless: true });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1512, height: 1000 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const log = (m) => console.log(`[modals] ${m}`);

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

    await page.locator('.activitybar [aria-label^="NightVision"]').first().click();
    const inner = page.frameLocator('iframe.webview.ready').frameLocator('#active-frame');
    await inner.locator('text=OVERVIEW').waitFor({ timeout: 30000 });
    await inner.locator('body').evaluate((b) => {
      const s = b.ownerDocument.createElement('style');
      s.textContent = '.tooltiptext { display: none !important; }';
      b.ownerDocument.head.appendChild(s);
    });

    // Match capture.js: ~500 px sidebar, mouse parked over the editor.
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
    await page.mouse.move(900, 400);
    await page.waitForTimeout(400);
    log('sidebar widened=' + widened);

    // Every shot here is a modal, so trim to the modal card: the leaf-element
    // scan capture.js uses would measure the full-height backdrop and the
    // dimmed page behind it, leaving blank space under the card.
    const CARD = '.absolute.inset-0.z-50 > div';
    const shoot = async (name) => {
      await page.waitForTimeout(400);
      const sidebarBox = await page.locator('.part.sidebar').boundingBox();
      let height = sidebarBox.height;
      const card = await inner.locator(CARD).boundingBox();
      if (card) {height = Math.min(height, (card.y - sidebarBox.y) + card.height + PAD);}
      await page.screenshot({ path: path.join(OUT, name), clip: { x: sidebarBox.x, y: sidebarBox.y, width: sidebarBox.width, height } });
      log(`shot ${name} (${Math.round(sidebarBox.width)}x${Math.round(height)})`);
    };

    const goOverview = async () => {
      for (let i = 0; i < 6; i++) {
        if (await inner.locator('text=OVERVIEW').first().isVisible().catch(() => false)) {break;}
        const back = inner.locator('a').first();
        if (await back.isVisible().catch(() => false)) { await back.click(); await page.waitForTimeout(1500); } else {break;}
      }
      await inner.locator('text=OVERVIEW').first().waitFor({ timeout: 8000 });
      if (!(await inner.locator('a[href="/projects"]').isVisible().catch(() => false))) {
        await inner.getByRole('link', { name: 'API and Web Security Testing' }).click();
        await inner.locator('a[href="/projects"]').waitFor({ timeout: 8000 });
      }
    };

    await inner.getByRole('link', { name: 'API and Web Security Testing' }).click();
    await inner.locator('a[href="/projects"]').waitFor({ timeout: 8000 });

    // --- project_2: Create Project modal, name typed, NOT submitted ---
    await inner.locator('a[href="/projects"]').click();
    await page.waitForTimeout(2000);
    await inner.getByRole('button', { name: 'Create Project' }).click();
    await page.waitForTimeout(800);
    await inner.locator('input').last().fill('Tutorial_test_project');
    await page.waitForTimeout(300);
    await shoot('project_2.png');
    await inner.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForTimeout(500);

    // --- target_2: Create Target modal, API Target + Spec URL, NOT submitted ---
    await goOverview();
    await inner.locator('a[href="/targets"]').click();
    await page.waitForTimeout(2000);
    await inner.getByRole('button', { name: 'Create Target' }).click();
    await page.waitForTimeout(800);
    await inner.getByRole('button', { name: 'API Target' }).click();
    await page.waitForTimeout(500);
    await inner.locator('#target-name').fill('javaspringvulny-api');
    await inner.locator('#target-url').fill('https://javaspringvulny.nvtest.io:9000/');
    const specUrlBtn = inner.getByRole('button', { name: 'Spec URL' });
    if (await specUrlBtn.isVisible().catch(() => false)) {
      await specUrlBtn.click();
      await page.waitForTimeout(400);
    }
    await inner.locator('#open-api-url').fill('https://javaspringvulny.nvtest.io:9000/openapi.yml');
    // The URL fields kick off async validation; wait out the spinner.
    await page.waitForTimeout(4000);
    await shoot('target_2.png');
    await inner.getByRole('button', { name: 'Cancel' }).click();
    await page.waitForTimeout(500);

    // --- authentication_2: Create Authentication modal, Playwright type, NOT submitted ---
    await goOverview();
    await inner.locator('a[href="/authentications"]').click();
    await page.waitForTimeout(2000);
    await inner.getByRole('button', { name: 'Create Authentication' }).click();
    await page.waitForTimeout(800);
    await inner.getByRole('button', { name: 'Playwright' }).click();
    await page.waitForTimeout(500);
    await inner.locator('#auth-name').fill('javaspringvulny-auth');
    await inner.locator('#auth-url').fill('https://javaspringvulny.nvtest.io:9000/');
    await page.waitForTimeout(300);
    await shoot('authentication_2.png');
    await inner.getByRole('button', { name: 'Cancel' }).click();

    log('done');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('[modals] FAILED:', e.message); process.exit(1); });
