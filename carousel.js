// Shared, progressively enhanced screenshot carousel. Native horizontal scrolling remains without JS.
document.querySelectorAll('.site-carousel').forEach(region => {
  const track = region.querySelector('.screen-track');
  if (!track) return;
  const slides = [...track.querySelectorAll('figure')];
  const controls = region.querySelector('.carousel-controls');
  const pause = region.querySelector('[data-pause]');
  const dots = [...region.querySelectorAll('[data-slide]')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, paused = false, hovered = false, timer;

  const schedule = () => {
    clearInterval(timer);
    if (!paused && !hovered && !motion.matches && !document.hidden && !region.contains(document.activeElement)) {
      timer = setInterval(() => go(index + 1), 5000);
    }
  };
  const go = next => {
    index = (next + slides.length) % slides.length;
    track.scrollTo({ left: slides[index].offsetLeft - slides[0].offsetLeft, behavior: motion.matches ? 'auto' : 'smooth' });
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
    schedule();
  };
  controls.hidden = false;
  region.querySelector('.carousel-dots').hidden = false;
  pause.addEventListener('click', () => {
    paused = !paused;
    pause.textContent = paused ? 'Play' : 'Pause';
    pause.setAttribute('aria-pressed', String(paused));
    schedule();
  });
  region.querySelector('[data-prev]').addEventListener('click', () => go(index - 1));
  region.querySelector('[data-next]').addEventListener('click', () => go(index + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => go(i)));
  region.addEventListener('mouseenter', () => { hovered = true; schedule(); });
  region.addEventListener('mouseleave', () => { hovered = false; schedule(); });
  region.addEventListener('focusin', event => {
    schedule();
    const slide = event.target.closest('.screen-track figure');
    if (slide && track.contains(slide)) requestAnimationFrame(() => go(slides.indexOf(slide)));
  });
  region.addEventListener('focusout', () => setTimeout(schedule, 0));
  track.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      go(index + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  motion.addEventListener('change', schedule);
  document.addEventListener('visibilitychange', schedule);
  schedule();
});
