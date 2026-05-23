(function () {
  const toggle = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  const hamburger = toggle.querySelector('[data-icon-hamburger]');
  const close = toggle.querySelector('[data-icon-close]');

  function setOpen(open) {
    menu.classList.toggle('hidden', !open);
    toggle.setAttribute('aria-expanded', String(open));
    if (hamburger) hamburger.classList.toggle('hidden', open);
    if (close) close.classList.toggle('hidden', !open);
  }

  toggle.addEventListener('click', () => {
    setOpen(menu.classList.contains('hidden'));
  });

  // Close after navigating to an in-page anchor
  menu.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => setOpen(false));
  });

  // ESC closes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.classList.contains('hidden')) setOpen(false);
  });
})();
