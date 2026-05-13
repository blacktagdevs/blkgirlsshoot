(function () {
  const form = document.getElementById('rsvp-form');
  if (!form) return;
  const endpoint = form.dataset.endpoint;
  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById('rsvp-status');

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
      form.reset();
      setStatus("You're in. We'll be in touch.", false);
    } catch (err) {
      setStatus(err.message || 'Something went wrong. Try again?', true);
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  });

  function setStatus(text, isError) {
    if (!status) return;
    status.textContent = text;
    status.style.color = isError ? '#F6B1D5' : '#FBF6F2';
  }
})();
