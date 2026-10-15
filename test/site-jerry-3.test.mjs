import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const html = async name => readFile(new URL(`../${name}`, import.meta.url), 'utf8');

test('product order and approved PubMint identity', async () => {
  const [home, pubmint, mark] = await Promise.all([
    html('index.html'), html('pubmint.html'), readFile(new URL('../assets/pubmint/brandmark.svg', import.meta.url)),
  ]);
  const ids = [...home.matchAll(/<article class="home-card" id="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(ids, ['rug-pulled', 'pubmint', 'stresslab', 'avoiding-jayms', 'rug-pulled-live']);
  assert.match(home, /id="stresslab"[^]*?<h3>Strategy Stress Lab<\/h3><span class="product-status">In development<\/span><p>Write down your trading rules\. Then watch them run through thousands of fictional markets\.<\/p><a class="detail-link" href="\/stresslab">/);
  assert.equal(createHash('sha256').update(mark).digest('hex'), '10733f8a4e72a61431d0b8d509fe16fc28be944f14515da5291f202b1e30198b');
  assert.match(home, /id="pubmint"[^]*?assets\/pubmint\/brandmark\.svg/);
  assert.match(pubmint, /class="pubmint-mark-panel"[^]*?assets\/pubmint\/brandmark\.svg/);
  assert.match(pubmint, /<link rel="icon" href="\/assets\/pubmint\/brandmark\.svg"/);
  assert.match(pubmint, /<meta property="og:image" content="https:\/\/jerbot\.dev\/assets\/pubmint\/brandmark-512\.png"/);
});

test('product screenshots preserve their original captions and keep the reel separate', async () => {
  const [rug, pubmint] = await Promise.all([html('rug-pulled.html'), html('pubmint.html')]);
  assert.ok(rug.indexOf('class="rp-reel"') < rug.indexOf('class="rp-captures site-carousel"'));
  assert.deepEqual([...rug.matchAll(/<figcaption>([^<]+)<\/figcaption>/g)].map(match => match[1]),
    ['Trading screen', 'Position open', 'Morning review', 'Day recap', 'Notebook Prices', 'Notebook Fills']);
  assert.deepEqual([...pubmint.matchAll(/<figcaption>([^<]+)<\/figcaption>/g)].map(match => match[1]),
    ['Overview', 'Design your token', 'Review before you sign', 'Token dashboard', 'Owner console']);
  for (const page of [rug, pubmint]) {
    assert.match(page, /class="carousel-controls" hidden/);
    assert.match(page, /class="carousel-dots"[^>]*hidden/);
    assert.match(page, /src="carousel\.js" defer/);
  }
});
