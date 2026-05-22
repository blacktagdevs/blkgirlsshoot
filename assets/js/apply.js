(function () {
  const form = document.getElementById('apply-form');
  if (!form) return;
  const endpoint = form.dataset.endpoint;
  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById('apply-status');
  const dlg = document.getElementById('apply-modal');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!endpoint || endpoint.includes('YOUR-SUBDOMAIN')) {
      setStatus('Form endpoint not configured yet.', true);
      return;
    }

    // Collect form data — multi-valued fields (checkboxes) come back as arrays.
    const fd = new FormData(form);
    const data = {};
    for (const key of new Set(fd.keys())) {
      const vals = fd.getAll(key).filter((v) => v !== '');
      if (vals.length === 0) continue;
      data[key] = vals.length > 1 ? vals : vals[0];
    }

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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Request failed');
      }
      form.reset();
      setStatus("Application received. We'll be in touch.", false);
      // Auto-close the dialog after a short pause so users see the confirmation.
      setTimeout(() => {
        if (dlg && typeof dlg.close === 'function') dlg.close();
      }, 1600);
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
    status.style.color = isError ? '#0A0A0A' : '#FFFFFF';
  }
})();
