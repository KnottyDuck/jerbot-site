import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { storeUrl } from '../assets/config/steam.js';
import { showWishlistLinks, validSteamStoreUrl } from '../wishlist.mjs';

const fixture = 'https://store.steampowered.com/app/999999999999/wishlist_fixture';

test('empty default keeps both slots hidden and without a request-capable href', () => {
  assert.equal(storeUrl, '');
  for (const page of ['index.html', 'rug-pulled.html']) {
    const html = readFileSync(new URL(`../${page}`, import.meta.url), 'utf8');
    assert.match(html, /<a class="wishlist-button" data-steam-wishlist hidden>Wishlist on Steam<\/a>/);
    assert.match(html, /<script type="module" src="wishlist\.mjs"><\/script>/);
  }
  const link = { hidden:true };
  assert.equal(showWishlistLinks({ querySelectorAll: () => [link] }, storeUrl), 0);
  assert.equal(link.hidden, true);
  assert.equal(link.href, undefined);
});

test('a configured fixture URL reveals links safely', () => {
  const links = [{ hidden:true }, { hidden:true }];
  assert.equal(showWishlistLinks({ querySelectorAll: () => links }, fixture), 2);
  for (const link of links) {
    assert.equal(link.hidden, false);
    assert.equal(link.href, fixture);
    assert.equal(link.target, '_blank');
    assert.equal(link.rel, 'noopener noreferrer');
  }
});

test('rejects empty, non-Steam, and request-bearing URLs', () => {
  for (const value of ['', 'https://example.com/app/999999999999/x', 'http://store.steampowered.com/app/999999999999/x',
    'https://store.steampowered.com/app/999999999999/x?tracking=1',
    'https://store.steampowered.com/app/999999999999/x#fragment',
    'https://store.steampowered.com.evil.invalid/app/999999999999/x']) {
    assert.equal(validSteamStoreUrl(value), null);
  }
});
