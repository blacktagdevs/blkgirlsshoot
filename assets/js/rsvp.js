(function () {
  const form = document.getElementById('rsvp-form');
  const successEl = document.getElementById('rsvp-success');
  if (!form) return;
  const endpoint = form.dataset.endpoint;
  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById('rsvp-status');

  if (sessionStorage.getItem('bgs-rsvp-submitted')) {
    showSuccess();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!endpoint || endpoint.includes('YOUR-SUBDOMAIN')) {
      setStatus('Form endpoint not configured yet.', true);
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    button.disabled = true;
    const original = button.textContent;
    button.textContent = 'Sending…';
    setStatus('', false);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
      sessionStorage.setItem('bgs-rsvp-submitted', '1');
      showSuccess();
    } catch (err) {
      button.disabled = false;
      button.textContent = original;
      setStatus(err.message || 'Something went wrong. Try again?', true);
    }
  });

  function showSuccess() {
    form.style.display = 'none';
    if (successEl) successEl.classList.remove('hidden');
  }

  function setStatus(text, isError) {
    if (!status) return;
    status.textContent = text;
    status.style.color = isError ? '#F6B1D5' : '#FBF6F2';
  }
})();
