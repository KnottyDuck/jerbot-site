// Local-only browser check. Set PLAYWRIGHT_MODULE to an installed Playwright ESM entry.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';

if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to the installed Playwright ESM entry');
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE);
const root = resolve(new URL('..', import.meta.url).pathname);
const output = process.env.WISHLIST_SITE_EVIDENCE_DIR ?? '/tmp/jerbot-wishlist-evidence';
await mkdir(output, { recursive:true });
const types = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript',
  '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg', '.ico':'image/x-icon', '.mp4':'video/mp4' };
const server = createServer(async (request, response) => {
  const file = resolve(root, `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname === '/' ? '/index.html' : new URL(request.url, 'http://localhost').pathname)}`);
  if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type':types[extname(file)] ?? 'application/octet-stream',
      'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self'; connect-src 'self'; object-src 'none'; frame-src 'none'" }).end(body);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const checks = [];
const fixture = 'https://store.steampowered.com/app/999999999999/wishlist_fixture';
try {
  for (const [name, engine] of [['chrome', chromium], ['webkit', webkit]]) {
    const browser = await engine.launch(name === 'chrome' ? { channel:'chrome', headless:true } : { headless:true });
    try {
      for (const [width, height] of [[390, 844], [1440, 900]]) {
        for (const theme of ['light', 'dark']) {
          for (const pagePath of ['/', '/rug-pulled.html']) {
            for (const visible of [false, true]) {
              const context = await browser.newContext({ viewport:{ width, height }, reducedMotion:'reduce' });
              if (visible) await context.route('**/assets/config/steam.js', route => route.fulfill({
                status:200, contentType:'text/javascript', body:`export const storeUrl = ${JSON.stringify(fixture)};`,
              }));
              const page = await context.newPage();
              const errors = []; const violations = []; const external = [];
              page.on('pageerror', error => errors.push(error.message));
              page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
              page.on('request', request => { if (!request.url().startsWith(base) && !request.url().startsWith('data:') && !request.url().startsWith(`blob:${base}/`)) external.push(request.url()); });
              await page.addInitScript(value => {
                localStorage.setItem('jerbot.site.theme', value);
                document.addEventListener('securitypolicyviolation', event => {
                  window.__wishlistCspViolations ??= [];
                  window.__wishlistCspViolations.push(event.violatedDirective);
                });
              }, theme);
              await page.goto(base + pagePath);
              await page.waitForLoadState('networkidle');
              assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), theme);
              const link = page.locator('[data-steam-wishlist]');
              assert.equal(await link.isVisible(), visible);
              assert.equal(await link.getAttribute('href'), visible ? fixture : null);
              if (visible) {
                const rect = await link.boundingBox();
                assert.ok(rect.width >= 44 && rect.height >= 44);
                assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
              }
              const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
              violations.push(...await page.evaluate(() => window.__wishlistCspViolations ?? []));
              assert.ok(overflow <= 1, `${name} ${width} ${pagePath} overflow ${overflow}`);
              assert.deepEqual(errors, []);
              assert.deepEqual(violations, []);
              assert.deepEqual(external, []);
              const screenshot = `${name}-${width}x${height}-${theme}-${pagePath === '/' ? 'home' : 'rug-pulled'}-${visible ? 'visible' : 'hidden'}.png`;
              await page.screenshot({ path:join(output, screenshot), fullPage:true, animations:'disabled' });
              checks.push({ browser:name, viewport:`${width}x${height}`, theme, page:pagePath, visible, overflow, errors, violations, external, screenshot });
              console.log(`${name} ${width} ${theme} ${pagePath} ${visible ? 'visible' : 'hidden'}: PASS`);
              await context.close();
            }
          }
        }
      }
    } finally { await browser.close(); }
  }
} finally {
  await new Promise(resolve => server.close(resolve));
  await writeFile(join(output, 'checks.json'), JSON.stringify(checks, null, 2) + '\n');
}
