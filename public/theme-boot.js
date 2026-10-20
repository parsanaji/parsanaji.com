(function () {
  var d = document.documentElement, t = null, rm = false, fc = false;
  try { t = localStorage.getItem('pn.theme'); } catch (e) {}
  if (t === 'light' || t === 'dark') d.setAttribute('data-theme', t);
  try {
    rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    fc = window.matchMedia('(forced-colors: active)').matches;
  } catch (e) {}
  if (!rm && !fc && !/[?&]noentry\b/.test(location.search)) d.setAttribute('data-entry', 'run');
})();
