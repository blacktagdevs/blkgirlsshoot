// Insider signup handler. Binds every form[data-endpoint] on the page
// (Home #rsvp section, Events Register modal, and the shared Insider modal
// injected by insider-modal.js). Status + success elements are looked up
// inside each form's parent so multiple forms can coexist on one page.
(function () {
  const STORAGE_KEY = 'bgs-rsvp-submitted';

  // US/Canada (NANP) numbers: area code and exchange must start 2-9, and
  // obvious fakes (all one digit, 555-01xx test range) are rejected.
  function validUS(d) {
    if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(d)) return false;
    if (/^(\d)\1+$/.test(d)) return false;
    if (d.slice(3, 6) === '555' && /^01\d\d$/.test(d.slice(6))) return false;
    return true;
  }

  // Returns '' for blank, the +E.164 string for valid input, or null if invalid.
  function normalizePhone(raw) {
    const trimmed = String(raw || '').trim();
    if (!trimmed) return '';
    if (/[^\d\s().+-]/.test(trimmed)) return null;
    const digits = trimmed.replace(/\D/g, '');
    if (trimmed.startsWith('+') && !digits.startsWith('1')) {
      return digits.length >= 8 && digits.length <= 15 ? '+' + digits : null;
    }
    const us = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
    return us.length === 10 && validUS(us) ? '+1' + us : null;
  }

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

      // Block bad phone numbers here so they never reach Klaviyo as unusable data.
      const phone = normalizePhone(data.phone);
      if (phone === null) {
        setStatus('Please enter a valid phone number, like (404) 555-1234, or leave it blank.', true);
        const phoneInput = form.querySelector('[name="phone"]');
        if (phoneInput) phoneInput.focus();
        return;
      }
      data.phone = phone;
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
