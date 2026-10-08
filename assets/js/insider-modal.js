// Shared "Become an Insider" modal. Injected on every page; opens from any
// [data-open-insider] element. Same fields + Worker endpoint as the Home
// #rsvp form, so submissions land in the same Klaviyo list. rsvp.js handles submit.
(function () {
  const ENDPOINT = 'https://bgs-rsvp.meccaclarkepro.workers.dev';

  const css = `
    .insider-modal {
      width: 92%; max-width: 560px; max-height: 88vh;
      padding: 0; border: none; border-radius: 18px;
      background: var(--ink, #0A0A0A); color: var(--cream, #FBF6F2);
      overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,.45);
    }
    .insider-modal::backdrop { background: rgba(10,10,10,.7); backdrop-filter: blur(2px); }
    .insider-modal__scroll { padding: 2.25rem 2rem; max-height: 88vh; overflow-y: auto; }
    .insider-modal__close {
      position: absolute; top: .9rem; right: .9rem;
      width: 36px; height: 36px; border: none; border-radius: 999px;
      background: rgba(246,177,213,.18); color: var(--cream, #FBF6F2);
      font-size: 1.25rem; line-height: 1; cursor: pointer; z-index: 2;
      transition: background .15s ease;
    }
    .insider-modal__close:hover { background: rgba(246,177,213,.35); }
  `;

  const html = `
    <button type="button" class="insider-modal__close" data-close-insider aria-label="Close">×</button>
    <div class="insider-modal__scroll">
      <div class="text-center mb-8">
        <p class="text-pink-soft font-semibold tracking-[0.2em] text-xs uppercase mb-3">Become a BGS Insider</p>
        <h2 id="insider-modal-title" class="font-display text-3xl md:text-4xl mb-3">Step Into Your Creative Era</h2>
        <p class="text-cream/70 text-sm max-w-md mx-auto">
          Join the list for Black Girls Shoot 2027 and be the first to know when tickets go on sale.
        </p>
      </div>
      <form data-endpoint="${ENDPOINT}" class="space-y-4">
        <div class="grid md:grid-cols-2 gap-4">
          <input type="text" name="name" placeholder="Your name" required class="field">
          <input type="email" name="email" placeholder="Email" required class="field">
        </div>
        <input type="tel" name="phone" placeholder="Phone (optional) — (404) 555-1234" inputmode="tel" autocomplete="tel" class="field">
        <textarea name="message" placeholder="Anything you'd like us to know? (optional)" rows="3" class="field"></textarea>
        <button type="submit" class="btn-primary w-full md:w-auto">Send my info</button>
        <p class="text-sm min-h-[1.25rem]" role="status" aria-live="polite"></p>
      </form>
      <div data-rsvp-success class="hidden text-center py-8">
        <div class="flex items-center justify-center mb-5">
          <span class="text-pink-soft" style="font-size:4rem;line-height:1">✓</span>
        </div>
        <p class="font-display text-3xl text-cream mb-2">You're in.</p>
        <p class="text-cream/70 text-sm">We'll let you know the moment tickets go on sale.</p>
      </div>
    </div>
  `;

  function init() {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const dlg = document.createElement('dialog');
    dlg.className = 'insider-modal';
    dlg.setAttribute('aria-labelledby', 'insider-modal-title');
    dlg.innerHTML = html;
    document.body.appendChild(dlg);

    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-insider]')) {
        e.preventDefault();
        if (typeof dlg.showModal === 'function') dlg.showModal();
        else dlg.setAttribute('open', '');
      } else if (e.target.closest('[data-close-insider]') || e.target === dlg) {
        dlg.close();
      }
    });

    document.dispatchEvent(new Event('bgs:insider-modal-ready'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
