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
  assert.equal(createHash('sha256').update(mark).digest('hex'), '1205ca6bcf0bcb1b051aaa16c05763a09e05324a287689b2682c7abd8373b1ab');
  assert.match(home, /id="pubmint"[^]*?assets\/pubmint\/brandmark\.svg/);
  assert.match(pubmint, /class="pubmint-mark-panel"[^]*?assets\/pubmint\/brandmark\.svg/);
  assert.match(pubmint, /<link rel="icon" href="\/assets\/pubmint\/brandmark\.svg"/);
  assert.match(pubmint, /<meta property="og:image" content="https:\/\/jerbot\.dev\/assets\/pubmint\/brandmark-512\.png"/);
});

test('product screenshots preserve their original captions and keep the reel separate', async () => {
  const [rug, pubmint] = await Promise.all([html('rug-pulled.html'), html('pubmint.html')]);
  assert.ok(rug.indexOf('class="rp-reel"') < rug.indexOf('class="rp-captures site-carousel"'));
  assert.deepEqual([...rug.matchAll(/<figcaption>([^<]+)<\/figcaption>/g)].map(match => match[1]),
    ['Your desk', 'Trading screen', 'Position open', 'Morning review', 'Day recap', 'Notebook Prices', 'Notebook Fills']);
  assert.deepEqual([...pubmint.matchAll(/<figcaption>([^<]+)<\/figcaption>/g)].map(match => match[1]),
    ['Overview', 'Design your token', 'Review before you sign', 'Token dashboard', 'Owner console']);
  for (const page of [rug, pubmint]) {
    assert.match(page, /class="carousel-controls" hidden/);
    assert.match(page, /class="carousel-dots"[^>]*hidden/);
    assert.match(page, /src="carousel\.js" defer/);
  }
});

test('Jerry-selected card marks are the approved source bytes', async () => {
  for (const [file, expected] of [
    ['stresslab.svg', '49890f69d81f4bac9848b22c29097803bb98ac93f69f14f49ac59e4f399351cb'],
    ['avoiding-jayms.svg', '5047a78a11212722a95640b91a7add4fb1a57f0d5e98dbdb6a8b591db66f3a2b'],
    ['rug-pulled-live.svg', '57621513f41079f49866cf5c620d84b4a2d55f8de1cf7d1edc807f899079a0eb'],
  ]) {
    const asset = await readFile(new URL(`../assets/marks/${file}`, import.meta.url));
    assert.equal(createHash('sha256').update(asset).digest('hex'), expected);
    assert.doesNotMatch(asset.toString(), /data-pending-mark/);
  }
  const rug = await html('rug-pulled.html');
  assert.match(rug, /00-furnished-desk-home\.png"[^]*?alt="Rug Pulled! home screen showing a furnished trading desk[^]*?<figcaption>Your desk<\/figcaption>/);
  assert.equal([...rug.matchAll(/data-slide="\d+"/g)].length, 7);
});
