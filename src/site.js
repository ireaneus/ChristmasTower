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
