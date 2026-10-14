import { storeUrl } from './assets/config/steam.js';

export function validSteamStoreUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.hostname !== 'store.steampowered.com' ||
        url.username || url.password || url.search || url.hash ||
        !/^\/app\/[1-9]\d+(?:\/[a-zA-Z0-9_-]+)?\/?$/.test(url.pathname)) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function showWishlistLinks(root, value) {
  const href = validSteamStoreUrl(value);
  if (!href) return 0;
  const links = root.querySelectorAll('[data-steam-wishlist]');
  for (const link of links) {
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.hidden = false;
  }
  return links.length;
}

if (typeof document !== 'undefined') showWishlistLinks(document, storeUrl);
