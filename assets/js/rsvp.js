// Insider signup handler. Binds every form[data-endpoint] on the page
// (Home #rsvp section, Events Register modal, and the shared Insider modal
// injected by insider-modal.js). Status + success elements are looked up
// inside each form's parent so multiple forms can coexist on one page.
(function () {
  const STORAGE_KEY = 'bgs-rsvp-submitted';

  function bind(form) {
    if (form.dataset.bound) return;
    form.dataset.bound = '1';

    const root = form.parentElement;
    const endpoint = form.dataset.endpoint;
    const button = form.querySelector('button[type="submit"]');
    const status = root.querySelector('[role="status"]');
    const successEl = root.querySelector('[data-rsvp-success], #rsvp-success');

    if (sessionStorage.getItem(STORAGE_KEY)) showSuccess();

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
        sessionStorage.setItem(STORAGE_KEY, '1');
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
  }

  function init() {
    document.querySelectorAll('form[data-endpoint]').forEach(bind);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // insider-modal.js dispatches this after injecting its form.
  document.addEventListener('bgs:insider-modal-ready', init);
})();
