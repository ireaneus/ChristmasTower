// Theme toggle and "continue reading". The theme itself is applied by the inline script in <head>.
(function () {
  var root = document.documentElement;

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }
  function recall(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  var toggle = document.querySelector('.theme-toggle');
  function label() {
    var dark = root.getAttribute('data-theme') === 'dark';
    toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  if (toggle) {
    label();
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store('ct-theme', next);
      label();
    });
  }

  // Turn pages with the arrow keys or a sideways swipe.
  function turn(rel) {
    var link = document.querySelector('.pager a[rel="' + rel + '"]');
    if (link) window.location.href = link.href;
  }
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowRight') turn('next');
    if (e.key === 'ArrowLeft') turn('prev');
  });
  var startX = null, startY = 0;
  document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { startX = null; return; }
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    var dy = e.changedTouches[0].clientY - startY;
    startX = null;
    if (Math.abs(dx) > 80 && Math.abs(dy) < 50) turn(dx < 0 ? 'next' : 'prev');
  }, { passive: true });

  var body = document.body;
  var href = body.getAttribute('data-continue-href');
  if (href) {
    store('ct-continue', JSON.stringify({ href: href, label: body.getAttribute('data-continue-label') }));
  }

  var button = document.getElementById('continue-reading');
  if (button) {
    var saved = null;
    try { saved = JSON.parse(recall('ct-continue')); } catch (e) {}
    if (saved && saved.href && saved.label && saved.href.charAt(0) === '/') {
      button.href = saved.href;
      button.textContent = 'Continue with ' + saved.label;
      button.hidden = false;
    }
  }
})();
