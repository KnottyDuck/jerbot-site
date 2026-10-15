// Pending product marks are valid, transparent SVGs. Only reveal a path after
// A replaces its marked placeholder with approved art; no missing-image 404s.
for (const mark of document.querySelectorAll('img.product-mark[data-mark-src]')) {
  const url = new URL(mark.dataset.markSrc, document.baseURI);
  if (url.origin !== location.origin || !url.pathname.startsWith('/assets/marks/')) continue;
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok || !response.headers.get('content-type')?.includes('image/svg+xml')) continue;
    if ((await response.text()).includes('data-pending-mark="true"')) continue;
    mark.src = url.pathname;
    await mark.decode();
    mark.hidden = false;
  } catch { /* Missing art stays hidden until A supplies the file. */ }
}
