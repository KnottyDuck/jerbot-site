import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const routes = ['/', '/rug-pulled', '/pubmint', '/stresslab', '/rug-pulled-live', '/services',
  '/about', '/questionnaire', '/privacy', '/terms', '/security', '/licenses'];
const read = name => readFile(new URL(name, root), 'utf8');

test('sitemap lists only approved clean routes with valid lastmod dates', async () => {
  const xml = await read('sitemap.xml');
  const entries = [...xml.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod><\/url>/g)]
    .map(([, loc, lastmod]) => ({ loc, lastmod }));
  assert.equal(entries.length, routes.length);
  assert.deepEqual(entries.map(entry => entry.loc), routes.map(path => `https://jerbot.dev${path}`));
  for (const entry of entries) {
    const date = new Date(`${entry.lastmod}T00:00:00Z`);
    assert.equal(date.toISOString().slice(0, 10), entry.lastmod);
    assert.ok(date.getTime() <= Date.now(), `${entry.loc} future lastmod`);
  }
  assert.doesNotMatch(xml, /404|preview|proof|\.html<\/loc>/);
});

test('each indexed page canonicals and shares its clean public URL', async () => {
  for (const path of routes) {
    const file = path === '/' ? 'index.html' : `${path.slice(1)}.html`;
    const html = await read(file);
    const expected = `https://jerbot.dev${path}`;
    assert.equal(html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1], expected, `${file} canonical`);
    assert.equal(html.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i)?.[1], expected, `${file} og:url`);
    assert.doesNotMatch(html, /<meta\s+name="robots"\s+content="[^"]*noindex/i, `${file} noindex`);
  }
  assert.match(await read('404.html'), /<meta\s+name="robots"\s+content="noindex"/i);
});

test('robots allows public routes and advertises the sitemap', async () => {
  const robots = await read('robots.txt');
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /^Sitemap: https:\/\/jerbot\.dev\/sitemap\.xml$/m);
  assert.doesNotMatch(robots, /^Disallow:/m);
});
