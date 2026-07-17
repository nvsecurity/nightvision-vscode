const { chromium } = require('playwright-core');
const fs = require('fs');
const os = require('os');
const path = require('path');

const EXEC = process.env.CHROMIUM_PATH;
if (!EXEC) {throw new Error('Set CHROMIUM_PATH to a Chrome for Testing binary (see scripts/screenshots/README.md)');}
const OUT = process.env.OUT_DIR || '.';
const PAD = 14; // logical px below content

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC, headless: true });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1512, height: 1000 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const log = (m) => console.log(`[capture] ${m}`);

    const token = fs.readFileSync(path.join(os.homedir(), '.vscode/cli/serve-web-token'), 'utf8').trim();
    await page.goto(`http://127.0.0.1:8000/?tkn=${encodeURIComponent(token)}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.monaco-workbench', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Force Dark Modern via the theme picker (fresh profile follows OS scheme).
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

    const nvIcon = page.locator('.activitybar [aria-label^="NightVision"]').first();
    await nvIcon.waitFor({ timeout: 30000 });
    await nvIcon.click();

    const outer = page.frameLocator('iframe.webview.ready');
    const inner = outer.frameLocator('#active-frame');
    await inner.locator('text=OVERVIEW').waitFor({ timeout: 30000 });

    // Suppress hover tooltips for clean captures.
    await inner.locator('body').evaluate((b) => {
      const s = b.ownerDocument.createElement('style');
      s.textContent = '.tooltiptext { display: none !important; }';
      b.ownerDocument.head.appendChild(s);
    });
    log('tooltips suppressed');

    // All shots use a ~500 px sidebar: drag the sash out from the ~300 px
    // default, then park the mouse over the editor so no hover highlight
    // (sash or otherwise) bleeds into the sidebar clips.
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

    const blurActive = async () => {
      try {
        await inner.locator('body').evaluate((b) => {
          const a = b.ownerDocument.activeElement;
          if (a && a.blur) {a.blur();}
        });
      } catch (e) { /* ignore */ }
    };

    const shoot = async (name, opts = {}) => {
      await blurActive();
      await page.waitForTimeout(400);
      const sidebarBox = await page.locator('.part.sidebar').boundingBox();
      const webviewBox = await page.locator('iframe.webview.ready').boundingBox();
      let contentBottom = null;
      try {
        contentBottom = await inner.locator('body').evaluate((b) => {
          let bottom = 0;
          b.querySelectorAll('*').forEach((el) => {
            if (el.children.length === 0) {
              const hasContent = el.textContent.trim().length > 0 ||
                ['IMG', 'INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(el.tagName.toUpperCase());
              const r = el.getBoundingClientRect();
              if (hasContent && r.height > 0 && r.bottom > bottom) {bottom = r.bottom;}
            }
          });
          return bottom;
        });
      } catch (e) { /* full height */ }
      let height = sidebarBox.height;
      if (contentBottom && !opts.fullHeight) {
        height = Math.min(sidebarBox.height, (webviewBox.y - sidebarBox.y) + contentBottom + PAD);
      }
      // opts.topSelector starts the clip at that element instead of the
      // sidebar top, for shots focused on one section of a page.
      let top = sidebarBox.y;
      if (opts.topSelector) {
        const tb = await inner.locator(opts.topSelector).first().boundingBox();
        if (tb) {top = tb.y - 8;}
      }
      const clip = { x: sidebarBox.x, y: top, width: sidebarBox.width, height: height - (top - sidebarBox.y) };
      await page.screenshot({ path: path.join(OUT, name), clip });
      log(`shot ${name} (${Math.round(clip.width)}x${Math.round(clip.height)})`);
    };


    const goOverview = async () => {
      for (let i = 0; i < 6; i++) {
        const onOverview = await inner.locator('text=OVERVIEW').first().isVisible().catch(() => false);
        if (onOverview) {break;}
        const back = inner.locator('a').first();
        if (await back.isVisible().catch(() => false)) {
          await back.click();
          await page.waitForTimeout(1500);
        } else {break;}
      }
      await inner.locator('text=OVERVIEW').first().waitFor({ timeout: 8000 });
      const submenuOpen = await inner.locator('a[href="/projects"]').isVisible().catch(() => false);
      if (!submenuOpen) {
        await inner.getByRole('link', { name: 'API and Web Security Testing' }).click();
        await inner.locator('a[href="/projects"]').waitFor({ timeout: 8000 });
      }
    };

    const nav = async (href) => {
      await inner.locator(`a[href="${href}"]`).first().click();
      await page.waitForTimeout(2000);
    };

    // --- Overview with expanded submenu ---
    await inner.getByRole('link', { name: 'API and Web Security Testing' }).click();
    await page.waitForTimeout(1000);
    await inner.locator('a[href="/projects"]').waitFor({ timeout: 10000 });
    await shoot('main_page.png');

    // --- Projects ---
    await nav('/projects');
    await inner.locator('text=CURRENT PROJECT').first().waitFor({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await shoot('project_1.png');

    // Project row -> options (old project_4)
    try {
      await inner.locator('li:has-text("nv-demo"), div:has-text("nv-demo")').last().click();
      await page.waitForTimeout(1500);
      await shoot('project_4.png');
    } catch (e) { log('project_4 skipped: ' + e.message); }

    // --- Targets ---
    await goOverview();
    await nav('/targets');
    await inner.locator('text=Create Target').first().waitFor({ timeout: 15000 });
    await page.waitForTimeout(1500);
    await shoot('target_1.png');

    // Target details
    await inner.locator('text=javaspringvulny').first().click();
    await page.waitForTimeout(2500);
    await shoot('target_4.png');

    // --- Authentications ---
    await goOverview();
    await nav('/authentications');
    await inner.locator('text=Create Authentication').first().waitFor({ timeout: 15000 });
    await page.waitForTimeout(1500);
    await shoot('authentication_6.png');

    // Auth details
    try {
      await inner.locator('text=javaspringvulny').first().click();
      await page.waitForTimeout(2000);
      await shoot('authentication_7.png');
    } catch (e) { log('authentication_7 skipped: ' + e.message); }

    // --- Scans ---
    await goOverview();
    await nav('/scans');
    await inner.locator('text=PREVIOUS SCANS').first().waitFor({ timeout: 15000 });
    await page.waitForTimeout(2000);
    await shoot('scan_1.png');

    await shoot('scan_4.png', { topSelector: 'text=PREVIOUS SCANS' });

    // Scan config (Scan APIs) with selects filled
    await nav('/scans/new-scan/openapi');
    await page.waitForTimeout(2000);
    try {
      const selects = inner.locator('select');
      const n = await selects.count();
      log(`newscan selects: ${n}`);
      // choose javaspringvulny target (and auth if present)
      for (let i = 0; i < n; i++) {
        const options = await selects.nth(i).locator('option').allInnerTexts();
        const idx = options.findIndex((o) => /javaspringvulny/i.test(o));
        if (idx >= 0) {await selects.nth(i).selectOption({ index: idx });}
        await page.waitForTimeout(800);
      }
    } catch (e) { log('newscan fill issue: ' + e.message); }
    await page.waitForTimeout(1000);
    await shoot('scan_2.png');

    // Scan details of an existing scan
    await nav('/scans');
    await page.waitForTimeout(2500);
    try {
      await inner.locator('a[href^="/scans/"]:not([href*="new-scan"])').first().click();
      await page.waitForTimeout(3000);
      await shoot('scan_5.png');
    } catch (e) { log('scan_5 skipped: ' + e.message); }

    log('done');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('[capture] FAILED:', e.message); process.exit(1); });
