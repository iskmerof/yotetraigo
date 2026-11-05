/* GA4: send a `whatsapp_click` event for every click on a WhatsApp link (wa.me).
   Mark `whatsapp_click` as a key event in GA4 (Admin > Events) to count it as a conversion.
   Loaded with <script src="/wa-track.js" defer></script> right after the gtag snippet. */
(function () {
  var SELECTOR = 'a[href*="wa.me/"], a[href*="api.whatsapp.com/"], a[href*="whatsapp.com/send"]';

  function placement(a) {
    if (a.getAttribute('data-wa-placement')) return a.getAttribute('data-wa-placement');
    try {
      if (window.getComputedStyle(a).position === 'fixed') return 'float';
    } catch (err) {}
    if (a.closest('footer')) return 'footer';
    if (a.closest('header, nav')) return 'nav';
    return 'content';
  }

  function track(e) {
    var a = e.target && e.target.closest ? e.target.closest(SELECTOR) : null;
    if (!a || typeof window.gtag !== 'function') return;
    window.gtag('event', 'whatsapp_click', {
      link_url: a.href,
      link_text: ((a.textContent || '').replace(/\s+/g, ' ').trim() || 'icon').slice(0, 60),
      placement: placement(a),
      page_path: location.pathname,
      transport_type: 'beacon'
    });
  }

  // capture phase so it fires even if another handler stops propagation; auxclick = middle-click
  document.addEventListener('click', track, true);
  document.addEventListener('auxclick', function (e) { if (e.button === 1) track(e); }, true);
})();
