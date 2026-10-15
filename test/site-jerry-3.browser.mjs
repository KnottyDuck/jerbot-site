// Local-only product-carousel check. Set PLAYWRIGHT_MODULE to an installed Playwright ESM entry.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';

if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to the installed Playwright ESM entry');
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE);
const root = resolve(new URL('..', import.meta.url).pathname);
const output = process.env.SITE_JERRY3_EVIDENCE_DIR ?? '/tmp/site-jerry-3-evidence';
await mkdir(output, { recursive: true });
const types = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript',
  '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg', '.ico':'image/x-icon', '.mp4':'video/mp4' };
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const file = resolve(root, `.${decodeURIComponent(pathname === '/' ? '/index.html' : pathname)}`);
  if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  try {
    response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self'; connect-src 'self'; object-src 'none'; frame-src 'none'" }).end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const paths = [
  { path:'/', label:'home', selector:'.marquee', count:4 },
  { path:'/rug-pulled.html', label:'rug-pulled', selector:'.rp-captures', count:6 },
  { path:'/pubmint.html', label:'pubmint', selector:'.pubmint-section.site-carousel', count:5 },
];
const checks = [];
try {
  for (const [browserName, engine] of [['chrome', chromium], ['webkit', webkit]]) {
    const browser = await engine.launch(browserName === 'chrome' ? { channel:'chrome', headless:true } : { headless:true });
    try {
      for (const [width, height] of [[390,844], [768,900], [1440,900]]) {
        for (const theme of ['light', 'dark']) {
          for (const entry of paths) {
            const context = await browser.newContext({ viewport:{ width, height }, reducedMotion:'no-preference' });
            const page = await context.newPage();
            const errors = [], external = [];
            page.on('pageerror', error => errors.push(error.message));
            page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
            page.on('request', request => {
              if (!request.url().startsWith(base) && !request.url().startsWith('data:') && !request.url().startsWith(`blob:${base}/`)) external.push(request.url());
            });
            await page.addInitScript(value => {
              localStorage.setItem('jerbot.site.theme', value);
              window.__csp = [];
              document.addEventListener('securitypolicyviolation', event => window.__csp.push(`${event.violatedDirective}: ${event.blockedURI}`));
            }, theme);
            await page.goto(base + entry.path);
            await page.waitForLoadState('networkidle');
            assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), theme);
            const carousel = page.locator(entry.selector);
            const track = carousel.locator('.screen-track');
            const dots = carousel.locator('[data-slide]');
            assert.equal(await carousel.locator('figure').count(), entry.count);
            assert.equal(await dots.count(), entry.count);
            assert.equal(await carousel.locator('.carousel-controls').isVisible(), true);
            assert.equal(await carousel.locator('.carousel-dots').isVisible(), true);
            assert.equal(await dots.nth(0).getAttribute('aria-current'), 'true');
            await carousel.locator('[data-next]').click();
            assert.equal(await dots.nth(1).getAttribute('aria-current'), 'true');
            await carousel.locator('[data-prev]').click();
            assert.equal(await dots.nth(0).getAttribute('aria-current'), 'true');
            await dots.last().click();
            assert.equal(await dots.last().getAttribute('aria-current'), 'true');
            await track.focus();
            await track.press('ArrowRight');
            assert.equal(await dots.nth(0).getAttribute('aria-current'), 'true');
            await track.press('ArrowLeft');
            assert.equal(await dots.last().getAttribute('aria-current'), 'true');
            await carousel.locator('[data-pause]').click();
            assert.equal(await carousel.locator('[data-pause]').getAttribute('aria-pressed'), 'true');
            assert.equal(await carousel.locator('[data-pause]').textContent(), 'Play');
            await carousel.locator('[data-pause]').click();
            assert.equal(await carousel.locator('[data-pause]').getAttribute('aria-pressed'), 'false');
            assert.equal(await carousel.locator('[data-pause]').textContent(), 'Pause');
            for (const figure of await carousel.locator('figure').all()) {
              await figure.scrollIntoViewIfNeeded();
              const images = await figure.locator('img:visible').all();
              for (const img of images) assert.ok(await img.evaluate(node => node.complete && node.naturalWidth > 0));
              assert.ok((await figure.locator('figcaption').textContent()).trim());
            }
            for (const img of await page.locator('img:visible').all()) {
              await img.scrollIntoViewIfNeeded();
              await img.evaluate(node => node.decode());
            }
            await dots.first().click();
            await track.evaluate(node => { node.style.scrollBehavior = 'auto'; node.scrollLeft = 0; });
            await page.waitForFunction(selector => document.querySelector(selector).scrollLeft < 2, `${entry.selector} .screen-track`);
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
            const runtimeErrors = [...errors];
            const runtimeViolations = await page.evaluate(() => [...window.__csp]);
            assert.ok(overflow <= 1, `${browserName} ${width} ${entry.label} overflow ${overflow}`);
            assert.deepEqual(runtimeErrors, []);
            assert.deepEqual(runtimeViolations, []);
            assert.deepEqual(external, []);
            await page.evaluate(() => window.scrollTo(0, 0));
            const screenshot = `${browserName}-${width}x${height}-${theme}-${entry.label}.png`;
            await page.screenshot({ path:join(output, screenshot), fullPage:true, animations:'disabled' });
            checks.push({ browser:browserName, viewport:`${width}x${height}`, theme, page:entry.path, slides:entry.count,
              overflow, runtimeErrors, runtimeViolations, screenshotErrors:errors.slice(runtimeErrors.length),
              screenshotViolations:(await page.evaluate(() => window.__csp)).slice(runtimeViolations.length), external, screenshot });
            console.log(`${browserName} ${width} ${theme} ${entry.label}: PASS`);
            await context.close();
          }
        }
      }
      for (const entry of paths) {
        const context = await browser.newContext({ viewport:{ width:390, height:844 }, reducedMotion:'reduce' });
        const page = await context.newPage();
        await page.addInitScript(() => {
          window.__intervals = 0;
          const original = window.setInterval;
          window.setInterval = (...args) => { window.__intervals++; return original(...args); };
        });
        await page.goto(base + entry.path);
        await page.waitForLoadState('networkidle');
        assert.equal(await page.evaluate(() => window.__intervals), 0, `${browserName} ${entry.label} reduced motion scheduled auto-advance`);
        await page.locator(`${entry.selector} [data-next]`).click();
        assert.equal(await page.locator(`${entry.selector} [data-slide="1"]`).getAttribute('aria-current'), 'true');
        console.log(`${browserName} reduced-motion ${entry.label}: PASS`);
        await context.close();
      }
      const noJs = await browser.newContext({ javaScriptEnabled:false, viewport:{ width:390, height:844 } });
      const noJsPage = await noJs.newPage();
      await noJsPage.goto(base + '/pubmint.html');
      assert.equal(await noJsPage.locator('.carousel-controls').isVisible(), false);
      assert.equal(await noJsPage.locator('.carousel-dots').isVisible(), false);
      assert.equal(await noJsPage.locator('.screen-track').evaluate(node => node.scrollWidth > node.clientWidth), true);
      console.log(`${browserName} no-JS PubMint scroll fallback: PASS`);
      await noJs.close();
      const timerContext = await browser.newContext({ viewport:{ width:390, height:844 } });
      const timerPage = await timerContext.newPage();
      await timerPage.addInitScript(() => {
        const active = new Set();
        const start = window.setInterval.bind(window);
        const stop = window.clearInterval.bind(window);
        window.setInterval = (...args) => { const id = start(...args); active.add(id); return id; };
        window.clearInterval = id => { active.delete(id); return stop(id); };
        window.__activeIntervals = active;
      });
      await timerPage.goto(base + '/');
      await timerPage.waitForLoadState('networkidle');
      const activeCount = () => timerPage.evaluate(() => window.__activeIntervals.size);
      assert.equal(await activeCount(), 1, 'autoplay should schedule when idle');
      await timerPage.locator('.marquee').hover();
      assert.equal(await activeCount(), 0, 'hover should pause autoplay');
      await timerPage.mouse.move(0, 0);
      assert.equal(await activeCount(), 1, 'leaving hover should resume autoplay');
      await timerPage.locator('.marquee .screen-track').focus();
      assert.equal(await activeCount(), 0, 'focus should pause autoplay');
      await timerPage.evaluate(() => document.activeElement.blur());
      await timerPage.waitForTimeout(10);
      assert.equal(await activeCount(), 1, 'leaving focus should resume autoplay');
      console.log(`${browserName} hover/focus autoplay: PASS`);
      await timerContext.close();
    } finally { await browser.close(); }
  }
} finally {
  await writeFile(join(output, 'checks.json'), JSON.stringify(checks, null, 2));
  server.close();
}
