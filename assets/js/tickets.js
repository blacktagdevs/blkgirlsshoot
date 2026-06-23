(function () {
  'use strict';

  var EB_EVENT_ID   = '1992306790241';
  var EB_TRIGGER_ID = 'eventbrite-widget-modal-trigger-' + EB_EVENT_ID;
  var TARGET_MS     = new Date('2026-06-26T00:00:00-04:00').getTime();

  // Eventbrite checkout widget
  function initEBWidgets() {
    if (!window.EBWidgets) return;
    window.EBWidgets.createWidget({
      widgetType:            'checkout',
      eventId:               EB_EVENT_ID,
      themeSettings:         { brandColor: '#D4478A' },
      modal:                 true,
      modalTriggerElementId: EB_TRIGGER_ID,
      onOrderComplete:       function () {}
    });
  }

  function loadEBScript() {
    var s    = document.createElement('script');
    s.src    = 'https://www.eventbrite.com/static/widgets/eb_widgets.js';
    s.async  = true;
    s.onload = initEBWidgets;
    document.head.appendChild(s);
  }

  // Event delegation — handles statically rendered and dynamically inserted buttons
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-buy-tickets]');
    if (!btn) return;
    e.preventDefault();
    var trigger = document.getElementById(EB_TRIGGER_ID);
    if (trigger) trigger.click();
  });

  // Countdown
  function pad(n) { return String(n).padStart(2, '0'); }

  function setById(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  var timer;

  function tick() {
    var diff = TARGET_MS - Date.now();
    if (diff <= 0) {
      clearInterval(timer);
      var pre  = document.getElementById('tl-pre');
      var live = document.getElementById('tl-live');
      if (pre)  pre.style.display  = 'none';
      if (live) live.style.display = 'flex';
      return;
    }
    setById('tl-days',    pad(Math.floor(diff / 86400000)));
    setById('tl-hours',   pad(Math.floor((diff % 86400000) / 3600000)));
    setById('tl-minutes', pad(Math.floor((diff % 3600000)  / 60000)));
    setById('tl-seconds', pad(Math.floor((diff % 60000)    / 1000)));
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadEBScript();
    tick();
    timer = setInterval(tick, 1000);
  });

}());
