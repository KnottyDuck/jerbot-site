import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../home.css', import.meta.url), 'utf8');

test('all five cards have a product mark slot and a standard image frame', () => {
  const cards = [...html.matchAll(/<article class="home-card" id="([^"]+)">([^]*?)<\/article>/g)];
  assert.deepEqual(cards.map(card => card[1]), ['rug-pulled', 'pubmint', 'stresslab', 'avoiding-jayms', 'rug-pulled-live']);
  for (const [, id, content] of cards) {
    assert.match(content, /<div class="home-card-copy"><img class="product-mark"/);
    assert.match(content, /class="card-art(?: [^"]+)?"/);
    if (['stresslab', 'avoiding-jayms', 'rug-pulled-live'].includes(id)) {
      assert.match(content, new RegExp(`data-mark-src="assets/marks/${id}\\.svg"[^>]* hidden>`));
    }
  }
  assert.match(html, /home\.css\?v=20261014-cards/);
  assert.match(html, /src="product-marks\.mjs"/);
  assert.match(css, /\.card-art \{[^]*?aspect-ratio: 8\/5/);
});

test('Stress Lab artwork has separate block rows even without its CSS', () => {
  assert.match(html, /class="card-art stresslab-art"[^>]*><div>[^]*?<\/div><div>[^]*?<\/div><div>[^]*?<\/div><\/div>/);
  assert.match(css, /\.card-art\.stresslab-art \{[^]*?display: grid/);
  assert.match(css, /\.stresslab-art > div \{[^]*?border-top:/);
});
