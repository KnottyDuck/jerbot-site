(() => {
  const track = document.querySelector('.screen-track');
  if (!track) return;
  const slides = [...track.querySelectorAll('figure')];
  const pause = document.querySelector('[data-pause]');
  const dots = [...document.querySelectorAll('[data-slide]')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, paused = false, hovered = false, timer;
  const schedule = () => {
    clearInterval(timer);
    if (!paused && !hovered && !motion.matches && !document.hidden && !track.closest('.marquee').contains(document.activeElement)) timer = setInterval(() => go(index + 1), 5000);
  };
  const go = (next) => {
    index = (next + slides.length) % slides.length;
    track.scrollTo({left: slides[index].offsetLeft - slides[0].offsetLeft, behavior: motion.matches ? 'auto' : 'smooth'});
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
  };
  document.querySelector('.carousel-controls').hidden = false;
  document.querySelector('.carousel-dots').hidden = false;
  pause.addEventListener('click', () => { paused = !paused; pause.textContent = paused ? 'Resume' : 'Pause'; pause.setAttribute('aria-pressed', String(paused)); schedule(); });
  document.querySelector('[data-prev]').addEventListener('click', () => go(index - 1));
  document.querySelector('[data-next]').addEventListener('click', () => go(index + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => go(i)));
  const region = track.closest('.marquee');
  region.addEventListener('mouseenter', () => { hovered = true; schedule(); });
  region.addEventListener('mouseleave', () => { hovered = false; schedule(); });
  region.addEventListener('focusin', schedule);
  region.addEventListener('focusout', () => setTimeout(schedule, 0));
  track.addEventListener('keydown', event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); go(index + (event.key === 'ArrowRight' ? 1 : -1)); } });
  motion.addEventListener('change', schedule);
  document.addEventListener('visibilitychange', schedule);
  schedule();
})();
