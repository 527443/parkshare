/* Header (brand, role switcher, nav, reset) and app boot. */
(function () {
  var C = PS.config, I = PS.illus, U = PS.util, S = PS.store, UI = PS.ui;

  var NAV = {
    driver: [['#/', 'Find parking', /^\/$|^\/search|^\/spot|^\/checkout/], ['#/bookings', 'My bookings', /^\/bookings|^\/confirm/]],
    host: [['#/host', 'Dashboard', /^\/host$/], ['#/host/new', 'List your spot', /^\/host\/new/]]
  };

  function brandHTML() {
    return '<a class="brand" href="#/" aria-label="' + U.esc(C.APP_NAME) + ' home"><span class="brand-mark" aria-hidden="true">P</span><span class="brand-name">' + U.esc(C.APP_NAME) + '</span></a>';
  }

  PS.header = {
    mount: function () {
      var h = document.getElementById('site-header');
      h.innerHTML = '<div class="wrap header-inner">' + brandHTML() +
        '<nav class="main-nav" id="main-nav" aria-label="Main"></nav>' +
        '<div class="header-right">' +
          '<div class="role-switch" role="group" aria-label="Switch role"><button data-role="driver">' + I.icon('car') + '<span>Driver</span></button><button data-role="host">' + I.icon('home') + '<span>Host</span></button></div>' +
          '<button class="icon-btn reset-btn" id="reset-demo" title="Reset demo data" aria-label="Reset demo data">' + I.icon('reset') + '<span>Reset demo</span></button>' +
        '</div></div>';
      U.$$('[data-role]', h).forEach(function (b) {
        b.addEventListener('click', function () {
          var role = b.getAttribute('data-role');
          if (role === S.state.role) return;
          S.state.role = role; S.save();
          PS.router.go(role === 'host' ? '#/host' : '#/');
        });
      });
      U.$('#reset-demo', h).addEventListener('click', function () {
        UI.confirm('Reset demo data?', 'This clears your bookings, listings, reviews and reports and restores the original sample data.', 'Reset demo', function () {
          S.reset();
          try { sessionStorage.clear(); } catch (e) {}
          if (location.hash === '#/' || location.hash === '') PS.router.render(); else location.hash = '#/';
          UI.toast('Demo data reset.');
        }, true);
      });
      // footer
      document.getElementById('site-footer').innerHTML = '<div class="wrap footer-inner"><div>' + brandHTML() + '<p class="muted small">' + U.esc(C.TAGLINE) + '</p></div>' +
        '<div class="foot-links"><a href="#/search">Find parking</a><a href="#/host/new">List your spot</a><a href="#/bookings">My bookings</a><button class="link" id="foot-report">Report a problem</button></div>' +
        '<p class="muted small foot-note">Demo app with sample data only. No real payments, bookings or hosts. Map data &copy; OpenStreetMap contributors. Demo date: ' + U.fmtDate(C.TODAY, true) + '.</p></div>';
      U.$('#foot-report').addEventListener('click', function () { UI.report(''); });
    },
    update: function (path) {
      var role = S.state.role;
      U.$$('.role-switch button').forEach(function (b) { var on = b.getAttribute('data-role') === role; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      document.body.setAttribute('data-role', role);
      U.$('#main-nav').innerHTML = NAV[role].map(function (n) {
        return '<a href="' + n[0] + '" class="' + (n[2].test(path) ? 'on' : '') + '">' + n[1] + '</a>';
      }).join('');
    }
  };

  function boot() {
    S.load();
    document.querySelectorAll('[data-brand]').forEach(function (el) { el.textContent = C.APP_NAME; });
    PS.header.mount();
    window.addEventListener('hashchange', PS.router.render);
    PS.router.render();
  }

  window.addEventListener('error', function (e) {
    // Surface unexpected errors in the demo instead of failing silently
    if (UI && UI.toast && document.getElementById('toasts')) UI.toast('Something went wrong: ' + U.esc(e.message), 'warn');
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
