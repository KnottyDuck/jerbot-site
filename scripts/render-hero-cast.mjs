/**
 * Export the four approved Live Avatar poses as transparent, self-contained
 * site SVGs. Run with AVATAR_ENGINE_ROOT pointing at rug-pulled-live containing
 * PR #17 (or its eventual merged successor):
 *   AVATAR_ENGINE_ROOT=/path/to/rug-pulled-live node scripts/render-hero-cast.mjs
 * The fifth figure is the existing approved ROOT assets/cast/spider.svg.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const engineRoot = process.env.AVATAR_ENGINE_ROOT;
if (!engineRoot) throw new Error('Set AVATAR_ENGINE_ROOT to the rug-pulled-live worktree with the four approved hero poses.');
const enginePackage = join(resolve(engineRoot), 'package.json');
const requireEngine = createRequire(enginePackage);
const { createServer } = await import(pathToFileURL(requireEngine.resolve('vite')).href);
const React = requireEngine('react');
const { renderToStaticMarkup } = requireEngine('react-dom/server');

const spider = await readFile(join(siteRoot, 'assets/cast/spider.svg'));
const spiderHash = createHash('sha256').update(spider).digest('hex');
assert.equal(spiderHash, 'edc053b01c8b8eed1d325a8acf4982e8ff773434eb1fedcc96b0e1a43b0dab51', 'the fifth figure must be the unchanged approved ROOT spider');

const figures = [
  { file: 'hero-trader-m.svg', pose: 'male-trader-open', appearance: { sex: 'm', skin: 2, themeId: 'desk-jacket', hairStyle: 'short', hairColor: 'black' } },
  { file: 'hero-trader-f.svg', pose: 'female-trader-present', appearance: { sex: 'f', skin: 3, themeId: 'desk-jacket', hairStyle: 'bob', hairColor: 'brown' } },
  { file: 'hero-friend-m.svg', pose: 'male-live-crossed', appearance: { sex: 'm', skin: 4, themeId: 'starter-hoodie', hairStyle: 'crop', hairColor: 'chestnut', look: 'live-friend' } },
  { file: 'hero-friend-f.svg', pose: 'female-live-wave-hip', appearance: { sex: 'f', skin: 1, themeId: 'desk-jacket', hairStyle: 'curls', hairColor: 'black', look: 'live-friend' } },
];
const artColors = { '--art-ink': '#102522', '--art-paper': '#eef5e9', '--art-brass': '#a6e1ba' };

function transparentFigure(markup, pose, liveFriend) {
  const openingEnd = markup.indexOf('>') + 1;
  assert.ok(openingEnd > 1 && markup.startsWith('<svg '));
  const opening = markup.slice(0, openingEnd);
  assert.match(opening, /viewBox="-50 0 220 140" width="220" height="140"/);
  assert.match(opening, new RegExp(`data-pose="${pose}"`));
  const remainder = markup.slice(openingEnd);
  assert.ok(remainder.startsWith('<g>'), 'Avatar background must be its first SVG child');
  const backgroundEnd = remainder.indexOf('</g>') + 4;
  assert.ok(backgroundEnd > 4);
  assert.match(remainder.slice(0, backgroundEnd), /<rect x="-50" width="220" height="140"/);
  let output = `${opening.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/ style="[^"]*"/, '')}${remainder.slice(backgroundEnd)}`;
  for (const [token, color] of Object.entries(artColors)) output = output.replaceAll(`var(${token})`, color);
  assert.doesNotMatch(output, /var\(|<script|<foreignObject|\s(?:href|src)="https?:/i);
  assert.match(output, /data-avatar-layer="pose-smile"/);
  assert.equal(output.includes('data-avatar-layer="live-badge"'), liveFriend);
  if (liveFriend) assert.match(output, />LIVE<\/text>/);
  return `${output}\n`;
}

const engineSha = execFileSync('git', ['-C', resolve(engineRoot), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const server = await createServer({ root: join(resolve(engineRoot), 'client'), configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
try {
  const { Avatar } = await server.ssrLoadModule('/src/ui/Avatar.tsx');
  for (const figure of figures) {
    const markup = renderToStaticMarkup(React.createElement(Avatar, { ...figure.appearance, size: 140, renderMode: 'hero', pose: figure.pose }));
    const output = transparentFigure(markup, figure.pose, figure.appearance.look === 'live-friend');
    await writeFile(join(siteRoot, 'assets/cast', figure.file), output);
    console.log(`${figure.file}: ${figure.pose}, 220x140, ${Buffer.byteLength(output)} bytes`);
  }
} finally {
  await server.close();
}
console.log(`engine HEAD ${engineSha}; approved root spider SHA-256 ${spiderHash}`);
