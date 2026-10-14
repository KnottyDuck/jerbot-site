(() => {
  const reel = document.getElementById('rp-preview');
  const toggle = document.getElementById('rp-preview-toggle');
  if (!reel || !toggle) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) {
    reel.autoplay = false;
    reel.removeAttribute('autoplay');
    reel.pause();
  }

  function syncLabel() {
    toggle.textContent = reel.paused ? 'Play preview' : 'Pause preview';
  }
  toggle.hidden = false;
  reel.removeAttribute('controls'); // Native controls remain as the no-JS fallback.
  for (const event of ['play', 'pause', 'ended']) reel.addEventListener(event, syncLabel);
  toggle.addEventListener('click', async () => {
    if (reel.paused) {
      try { await reel.play(); } catch { syncLabel(); }
    } else reel.pause();
    syncLabel();
  });
  syncLabel();
})();
