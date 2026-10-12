(() => {
  const key = 'jerbot.site.theme';
  const root = document.documentElement;
  let choice = 'system';
  try {
    const saved = localStorage.getItem(key);
    if (saved === 'light' || saved === 'dark') choice = saved;
  } catch { /* The OS preference still works when storage is unavailable. */ }
  if (choice !== 'system') root.dataset.theme = choice;

  function mount() {
    const label = document.createElement('label');
    label.className = 'theme-picker';
    const caption = document.createElement('span');
    caption.textContent = 'Theme';
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Theme');
    for (const [value, text] of [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      select.append(option);
    }
    select.value = choice;
    select.addEventListener('change', () => {
      choice = select.value;
      if (choice === 'system') delete root.dataset.theme;
      else root.dataset.theme = choice;
      try {
        if (choice === 'system') localStorage.removeItem(key);
        else localStorage.setItem(key, choice);
      } catch { /* The current page still switches. */ }
    });
    label.append(caption, select);
    const skip = document.querySelector('.skip-link');
    if (skip) skip.after(label);
    else document.body.prepend(label);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
