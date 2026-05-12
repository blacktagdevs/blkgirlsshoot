(function () {
  const wrap = document.getElementById('ba');
  const handle = document.getElementById('ba-handle');
  if (!wrap || !handle) return;
  const after = wrap.querySelector('.ba-after');
  let dragging = false;

  function setPos(clientX) {
    const rect = wrap.getBoundingClientRect();
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    handle.style.left = pct + '%';
    after.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
  }

  handle.addEventListener('mousedown', () => (dragging = true));
  handle.addEventListener('touchstart', () => (dragging = true));
  document.addEventListener('mouseup', () => (dragging = false));
  document.addEventListener('touchend', () => (dragging = false));
  document.addEventListener('mousemove', (e) => dragging && setPos(e.clientX));
  document.addEventListener('touchmove', (e) => dragging && setPos(e.touches[0].clientX));
  wrap.addEventListener('click', (e) => setPos(e.clientX));
})();
