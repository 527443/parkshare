/* Core: utilities, UI primitives (modal/toast), shared components, map helper, router. */
(function () {
  var C = PS.config, I = PS.illus;

  /* ---------- utilities ---------- */
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var U = PS.util = {
    esc: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
    },
    money: function (n) { n = +n || 0; return '$' + (n % 1 ? n.toFixed(2) : String(n)); },
    money2: function (n) { return '$' + (+n || 0).toFixed(2); },
    pd: function (s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); },
    iso: function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
    addDays: function (s, n) { var d = U.pd(s); d.setDate(d.getDate() + n); return U.iso(d); },
    fmtDate: function (s, long) {
      var d = U.pd(s);
      return DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + (long ? ', ' + d.getFullYear() : '');
    },
    monthName: function (s) { var d = U.pd(s.length === 7 ? s + '-01' : s); return MONTHS[d.getMonth()]; },
    monthDay: function (s) { var d = U.pd(s); return { m: MONTHS[d.getMonth()].toUpperCase(), d: d.getDate(), w: DAYS[d.getDay()] }; },
    fmtTime: function (t) {
      if (!t) return '';
      var p = t.split(':'), h = +p[0], m = p[1];
      return ((h % 12) || 12) + (m === '00' ? '' : ':' + m) + ' ' + (h < 12 ? 'AM' : 'PM');
    },
    addHours: function (t, n) { var p = t.split(':'); var h = (+p[0] + n) % 24; return String(h).padStart(2, '0') + ':' + p[1]; },
    daysBetween: function (a, b) { return Math.round((U.pd(b) - U.pd(a)) / 86400000); },
    parseQuery: function (q) {
      var o = {};
      (q || '').split('&').forEach(function (kv) { if (!kv) return; var p = kv.split('='); o[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || '').replace(/\+/g, ' ')); });
      return o;
    },
    buildQuery: function (o) {
      return Object.keys(o).filter(function (k) { return o[k] !== '' && o[k] != null; })
        .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(o[k]); }).join('&');
    },
    stars: function (r) {
      var out = '';
      for (var i = 1; i <= 5; i++) out += '<span class="st ' + (r >= i - 0.25 ? 'on' : r >= i - 0.75 ? 'half' : '') + '">' + I.icon('star') + '</span>';
      return '<span class="stars" aria-label="' + r + ' out of 5">' + out + '</span>';
    },
    $: function (sel, root) { return (root || document).querySelector(sel); },
    $$: function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  };
  var esc = U.esc;

  /* ---------- labels ---------- */
  var L = PS.labels = {
    spot: { driveway: 'Driveway', yard: 'Yard', church: 'Church lot', business: 'Business lot', school: 'School lot' },
    host: { home: 'Homeowner', business: 'Business', church: 'Church', school: 'School' },
    amen: { ev: 'EV charging', oversize: 'Oversize OK', covered: 'Covered', tailgate: 'Tailgating allowed', leave: 'Leave anytime' },
    amenShort: { ev: 'EV', oversize: 'Oversize', covered: 'Covered', tailgate: 'Tailgate', leave: 'Leave anytime' },
    amenIcon: { ev: 'ev', oversize: 'oversize', covered: 'covered', tailgate: 'tailgate', leave: 'leave' },
    type: { event: 'Event', hourly: 'Hourly', monthly: 'Monthly' },
    unit: { event: '/ event', hourly: '/ hr', monthly: '/ mo' },
    cancel: {
      flexible: { name: 'Flexible', text: 'Full refund up to 24 hours before your start time. 50% refund after that.' },
      moderate: { name: 'Moderate', text: 'Full refund up to 3 days before your start time. 50% refund after that.' },
      strict: { name: 'Strict', text: '50% refund up to 7 days before your start time. No refund after that.' }
    }
  };

  /* ---------- toast + modal ---------- */
  var UI = PS.ui = {};
  UI.toast = function (msg, kind) {
    var wrap = document.getElementById('toasts');
    var t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.innerHTML = I.icon(kind === 'warn' ? 'warn' : 'check') + '<span>' + msg + '</span>';
    wrap.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 3200);
    setTimeout(function () { t.remove(); }, 3700);
  };

  UI.modal = function (o) {
    var root = document.getElementById('modal-root');
    var el = document.createElement('div');
    el.className = 'modal-backdrop';
    el.innerHTML = '<div class="modal ' + (o.cls || '') + '" role="dialog" aria-modal="true" aria-label="' + esc(o.title) + '">' +
      '<div class="modal-head"><h3>' + esc(o.title) + '</h3><button class="icon-btn" data-close aria-label="Close">' + I.icon('x') + '</button></div>' +
      '<div class="modal-body">' + o.body + '</div>' +
      (o.actions ? '<div class="modal-foot">' + o.actions.map(function (a, i) {
        return '<button class="btn ' + (a.cls || 'btn-ghost') + '" data-act="' + i + '">' + a.label + '</button>';
      }).join('') + '</div>' : '') + '</div>';
    root.appendChild(el);
    document.body.classList.add('no-scroll');
    function close() {
      el.remove();
      if (!root.children.length) document.body.classList.remove('no-scroll');
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    el.addEventListener('click', function (e) {
      if (e.target === el || e.target.closest('[data-close]')) return close();
      var a = e.target.closest('[data-act]');
      if (a) { var act = o.actions[+a.getAttribute('data-act')]; if (act.onClick && act.onClick(el) === false) return; close(); }
    });
    if (o.mount) o.mount(el, close);
    var f = el.querySelector('input, textarea, select'); if (f && o.focus !== false) setTimeout(function () { f.focus(); }, 30);
    return { el: el, close: close };
  };

  UI.confirm = function (title, body, okLabel, onOk, danger) {
    return UI.modal({ title: title, body: '<p>' + body + '</p>', actions: [
      { label: 'Keep it', cls: 'btn-ghost' },
      { label: okLabel, cls: danger ? 'btn-danger' : 'btn-primary', onClick: onOk }
    ] });
  };

  UI.report = function (ctx) {
    var reasons = ['Spot was blocked or already taken', 'Host was unreachable', 'Listing doesn\'t match the photos', 'Safety concern', 'Billing or refund issue', 'Something else'];
    UI.modal({
      title: 'Report a problem',
      body: '<p class="muted">' + (ctx ? 'About: <strong>' + esc(ctx) + '</strong>. ' : '') + 'Our trust team reviews every report. For emergencies, call 911.</p>' +
        '<div class="radio-list">' + reasons.map(function (r, i) {
          return '<label class="radio-row"><input type="radio" name="reason" value="' + esc(r) + '"' + (i === 0 ? ' checked' : '') + '><span>' + esc(r) + '</span></label>';
        }).join('') + '</div>' +
        '<label class="field"><span>Details (optional)</span><textarea rows="3" id="rp-text" placeholder="What happened?"></textarea></label>',
      focus: false,
      actions: [
        { label: 'Cancel' },
        { label: 'Send report', cls: 'btn-primary', onClick: function (el) {
          var r = PS.store.addReport({ about: ctx || '', reason: el.querySelector('input[name=reason]:checked').value, text: el.querySelector('#rp-text').value });
          UI.toast('Report ' + r.id + ' sent. Our trust team usually replies within 15 minutes (demo).');
        } }
      ]
    });
  };

  /* ---------- shared components ---------- */
  var CMP = PS.cmp = {};
  CMP.priceFor = function (l, type) { return l.price[type || 'event']; };

  CMP.amenities = function (l, full) {
    return Object.keys(L.amen).filter(function (k) { return l.amenities[k]; }).map(function (k) {
      return '<span class="amen" title="' + L.amen[k] + '">' + I.icon(L.amenIcon[k]) + (full ? '<span>' + L.amen[k] + '</span>' : '<span class="amen-txt">' + L.amenShort[k] + '</span>') + '</span>';
    }).join('');
  };

  CMP.verified = function (l) {
    return l.host.verified
      ? '<span class="badge-verified" title="ID, address and property rights verified">' + I.icon('shield') + 'Verified host</span>'
      : '<span class="badge-pending" title="Verification in progress">' + I.icon('clock') + 'Verification pending</span>';
  };

  CMP.rating = function (l) {
    return l.reviewCount
      ? '<span class="rating">' + I.icon('star', 'ic-fill') + '<b>' + (+l.rating).toFixed(1) + '</b><span class="muted">(' + l.reviewCount + ')</span></span>'
      : '<span class="rating new">New</span>';
  };

  CMP.walk = function (l) {
    var w = PS.store.walk(l);
    return '<span class="walk">' + I.icon('walk') + w.miles.toFixed(1) + ' mi · ' + w.mins + ' min walk</span>';
  };

  CMP.card = function (l, ctx) {
    ctx = ctx || {};
    var type = ctx.type || 'event';
    var price = l.price[type];
    var left = ctx.eventId ? PS.store.spotsLeft(l, ctx.eventId) : null;
    var q = U.buildQuery({ type: type, event: ctx.eventId || '' });
    var stall = (l.photoSeed % 40) + 1;
    return '<a class="lcard" href="#/spot/' + l.id + (q ? '?' + q : '') + '" data-lid="' + l.id + '">' +
      '<div class="lcard-media">' + I.photo(l, 0, { key: 'c' }) +
        '<span class="stall">' + stall + '</span>' +
        '<span class="lcard-type">' + L.spot[l.spotType] + '</span>' +
        (left !== null ? '<span class="left ' + (left <= 2 ? 'low' : '') + '">' + (left ? left + ' left' : 'Sold out') + '</span>' : '') +
      '</div>' +
      '<div class="lcard-body">' +
        '<div class="lcard-top">' + CMP.rating(l) + (l.host.verified ? '<span class="vdot" title="Verified host">' + I.icon('shield') + '</span>' : '') + '</div>' +
        '<h3>' + esc(l.title) + '</h3>' +
        '<div class="lcard-meta">' + CMP.walk(l) + '<span class="muted">to ' + esc(PS.store.venue(l.venueId).name) + '</span></div>' +
        '<div class="amen-row">' + CMP.amenities(l) + '</div>' +
        '<div class="lcard-price"><b>' + (price ? U.money(price) : '—') + '</b><span>' + L.unit[type] + '</span></div>' +
      '</div></a>';
  };

  CMP.rulesBanner = function (v) {
    var ok = v.rules.level === 'ok';
    return '<div class="rules-banner ' + (ok ? 'ok' : 'check') + '">' + I.icon(ok ? 'check' : 'info') +
      '<div><strong>' + (ok ? 'Commonly allowed in ' : 'Check local rules in ') + esc(v.city) + ', ' + v.state + '</strong>' +
      '<p>' + esc(v.rules.text) + ' <span class="muted">Demo info, not legal advice.</span></p></div></div>';
  };

  CMP.eventChip = function (e) {
    var md = U.monthDay(e.date), v = PS.store.venue(e.venue);
    return '<a class="ev-card" href="#/search?event=' + e.id + '">' +
      '<div class="ev-date"><span>' + md.m + '</span><b>' + md.d + '</b><span>' + md.w + '</span></div>' +
      '<div class="ev-info"><span class="ev-cat">' + esc(e.cat) + '</span><strong>' + esc(e.name) + '</strong>' +
      '<span class="muted">' + esc(v.name) + ' · ' + U.fmtTime(e.time) + '</span></div>' +
      '<span class="ev-go">' + I.icon('arrow') + '</span></a>';
  };

  /* ---------- map helper (Leaflet with offline fallback) ---------- */
  PS.map = {
    available: function () { return typeof window.L !== 'undefined' && window.L.map; },
    // Bare Leaflet map with the shared OSM tile layer
    base: function (el, lopts) {
      var map = window.L.map(el, Object.assign({ zoomControl: true, attributionControl: true }, lopts || {}));
      window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
      }).addTo(map);
      return map;
    },
    // items: [{id, lat, lng, label, kind:'spot'|'venue'|'new'}]
    create: function (el, items, opts) {
      opts = opts || {};
      var markers = {};
      if (PS.map.available()) {
        var map = PS.map.base(el, { scrollWheelZoom: !!opts.scroll });
        var bounds = [];
        items.forEach(function (it) {
          var html = it.kind === 'venue' ? '<div class="pin-venue">' + I.icon('star', 'ic-fill') + '<span>' + esc(it.label) + '</span></div>'
            : '<div class="pin-price ' + (it.kind === 'new' ? 'pin-new' : '') + '">' + esc(it.label) + '</div>';
          var icon = window.L.divIcon({ className: 'pin-wrap', html: html, iconSize: null });
          var m = window.L.marker([it.lat, it.lng], { icon: icon, zIndexOffset: it.kind === 'venue' ? 1000 : 0, keyboard: true }).addTo(map);
          if (opts.onClick && it.kind !== 'venue') m.on('click', function () { opts.onClick(it.id); });
          markers[it.id] = m;
          bounds.push([it.lat, it.lng]);
        });
        if (opts.line) window.L.polyline(opts.line, { color: '#13212E', weight: 3, dashArray: '2 8', lineCap: 'round' }).addTo(map);
        var fitAll = function () {
          if (bounds.length === 1) map.setView(bounds[0], opts.zoom || 15);
          else if (bounds.length) map.fitBounds(bounds, { padding: [40, 40], maxZoom: opts.maxZoom || 16 });
          else map.setView([39.5, -98.35], 4);
        };
        fitAll();
        setTimeout(function () { map.invalidateSize(); }, 60);
        return {
          map: map,
          highlight: function (id, on) { var m = markers[id]; if (!m) return; var e = m.getElement(); if (e) e.classList.toggle('hl', !!on); if (on) m.setZIndexOffset(900); else m.setZIndexOffset(0); },
          focus: function (id) { var m = markers[id]; if (m) map.panTo(m.getLatLng()); },
          refresh: function () { map.invalidateSize(); fitAll(); },
          destroy: function () { map.remove(); }
        };
      }
      // Fallback: schematic map (no network / Leaflet blocked)
      var lats = items.map(function (i) { return i.lat; }), lngs = items.map(function (i) { return i.lng; });
      var minLa = Math.min.apply(0, lats), maxLa = Math.max.apply(0, lats), minLn = Math.min.apply(0, lngs), maxLn = Math.max.apply(0, lngs);
      var dLa = (maxLa - minLa) || 0.01, dLn = (maxLn - minLn) || 0.01;
      el.classList.add('map-fallback');
      el.innerHTML = '<div class="mf-grid"></div><div class="mf-note">' + I.icon('map') + 'Schematic map (map tiles unavailable offline)</div>' + items.map(function (it) {
        var x = 8 + 84 * (it.lng - minLn) / dLn, y = 8 + 84 * (1 - (it.lat - minLa) / dLa);
        var inner = it.kind === 'venue' ? '<div class="pin-venue">' + I.icon('star', 'ic-fill') + '<span>' + esc(it.label) + '</span></div>' : '<div class="pin-price">' + esc(it.label) + '</div>';
        return '<div class="mf-pin pin-wrap" data-id="' + it.id + '" style="left:' + x + '%;top:' + y + '%">' + inner + '</div>';
      }).join('');
      if (opts.onClick) el.addEventListener('click', function (e) { var p = e.target.closest('.mf-pin'); if (p && p.getAttribute('data-id').indexOf('venue') !== 0) opts.onClick(p.getAttribute('data-id')); });
      return {
        map: null,
        highlight: function (id, on) { var p = el.querySelector('.mf-pin[data-id="' + id + '"]'); if (p) p.classList.toggle('hl', !!on); },
        focus: function () {}, refresh: function () {}, destroy: function () {}
      };
    }
  };

  /* ---------- router ---------- */
  var routes = [];
  var cleanups = [];
  PS.router = {
    add: function (re, view) { routes.push({ re: re, view: view }); },
    onLeave: function (fn) { cleanups.push(fn); },
    go: function (hash) { if (location.hash === hash) PS.router.render(); else location.hash = hash; },
    current: function () {
      var h = location.hash.replace(/^#/, '') || '/';
      var qi = h.indexOf('?');
      return { path: qi > -1 ? h.slice(0, qi) : h, query: U.parseQuery(qi > -1 ? h.slice(qi + 1) : '') };
    },
    render: function () {
      cleanups.splice(0).forEach(function (fn) { try { fn(); } catch (e) {} });
      var cur = PS.router.current();
      var app = document.getElementById('app');
      for (var i = 0; i < routes.length; i++) {
        var m = cur.path.match(routes[i].re);
        if (m) {
          var res = routes[i].view(m.slice(1), cur.query) || {};
          if (res.redirect) { location.replace(res.redirect); return; }
          var role = res.role || (cur.path.indexOf('/host') === 0 ? 'host' : res.neutral ? PS.store.state.role : 'driver');
          if (PS.store.state.role !== role) { PS.store.state.role = role; PS.store.save(); }
          app.innerHTML = res.html;
          document.title = (res.title ? res.title + ' · ' : '') + C.APP_NAME;
          PS.header.update(cur.path);
          if (!res.keepScroll) window.scrollTo(0, 0);
          if (res.mount) res.mount(app);
          app.focus({ preventScroll: true });
          return;
        }
      }
      app.innerHTML = '<section class="wrap empty-page"><h1>Page not found</h1><p>That link doesn\'t lead anywhere.</p><a class="btn btn-primary" href="#/">Back to search</a></section>';
      PS.header.update(cur.path);
    }
  };
})();
