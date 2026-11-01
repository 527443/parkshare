/* Driver views: home, search (map + list), spot detail, checkout, confirmation, my bookings. */
(function () {
  var C = PS.config, D = PS.data, S = PS.store, U = PS.util, I = PS.illus, L = PS.labels, CMP = PS.cmp, UI = PS.ui;
  var esc = U.esc, R = PS.router;

  /* ---------- helpers ---------- */
  function matchVenues(q) {
    q = (q || '').trim().toLowerCase();
    if (!q) return null;
    var hits = D.venues.filter(function (v) {
      if (v.name.toLowerCase().indexOf(q) > -1 || v.city.toLowerCase().indexOf(q) > -1) return true;
      return v.aliases.some(function (a) { return a === q || (q.length >= 3 && (a.indexOf(q) > -1 || q.indexOf(a) > -1 && a.length >= 3)); });
    });
    if (!hits.length) {
      // try street/address match against listings
      var ids = {};
      S.state.listings.forEach(function (l) { if ((l.street + ' ' + l.city + ' ' + l.state).toLowerCase().indexOf(q) > -1) ids[l.venueId] = 1; });
      hits = D.venues.filter(function (v) { return ids[v.id]; });
    }
    return hits;
  }

  function parkingStart(e) {
    var h = Math.max(6, +e.time.split(':')[0] - 4);
    return String(h).padStart(2, '0') + ':' + e.time.split(':')[1];
  }

  PS.bookingWhen = function (bk) {
    if (bk.type === 'event') {
      var e = bk.eventId ? S.event(bk.eventId) : null;
      return { title: e ? e.name : (bk.eventName || 'Event day'), sub: U.fmtDate(bk.date) + ' · parking from ' + U.fmtTime(bk.start) };
    }
    if (bk.type === 'hourly') return { title: bk.hours + '-hour parking', sub: U.fmtDate(bk.date) + ' · ' + U.fmtTime(bk.start) + '–' + U.fmtTime(U.addHours(bk.start, bk.hours)) };
    return { title: 'Monthly parking', sub: 'Starts ' + U.fmtDate(bk.date) + ' · 30 days' };
  };

  function statusPill(bk) {
    var map = { confirmed: ['Confirmed', 'ok'], 'checked-in': ['Checked in', 'go'], completed: ['Completed', 'muted'], cancelled: ['Cancelled', 'bad'] };
    var s = map[bk.status] || [bk.status, ''];
    return '<span class="pill pill-' + s[1] + '">' + s[0] + '</span>';
  }
  PS.statusPill = statusPill;

  /* ---------- HOME: "You are here" map (Lyft-style) ---------- */
  // Shows the driver's location (browser geolocation, or a demo spot near AT&T Stadium)
  // with every bookable spot as a price pin. Pan/zoom freely; tap a pin for a quick card.
  var DEMO_LOC = { lat: 32.7559, lng: -97.1032, demo: true };
  var NEAR_M = 100000; // within ~62 mi we frame you together with the nearest venue's spots

  function homeMap(root, type) {
    var el = U.$('#home-map', root), locEl = U.$('#hm-loc', root), countEl = U.$('#hm-count', root),
      sheet = U.$('#hm-sheet', root), locBtn = U.$('#hm-locate', root);
    var dead = false;
    function spots() { return S.state.listings.filter(function (l) { return l.active && l.price[type]; }); }
    function nearestVenue(lat, lng) {
      var best = null;
      D.venues.forEach(function (v) { var m = S.haversine(lat, lng, v.lat, v.lng); if (!best || m < best.m) best = { v: v, m: m }; });
      return best;
    }
    function shortName(v) { return v.name.replace('GEHA Field at ', '').replace('Downtown Austin — ', ''); }

    // Offline / Leaflet blocked: schematic map around the demo venue, no live location.
    if (!PS.map.available()) {
      var nv0 = nearestVenue(DEMO_LOC.lat, DEMO_LOC.lng).v;
      PS.map.create(el, spots().filter(function (l) { return l.venueId === nv0.id; })
        .map(function (l) { return { id: l.id, lat: l.lat, lng: l.lng, label: U.money(l.price[type]), kind: 'spot' }; })
        .concat([{ id: 'venue-' + nv0.id, lat: nv0.lat, lng: nv0.lng, label: shortName(nv0), kind: 'venue' }]),
        { onClick: function (id) { R.go('#/spot/' + id); } });
      locEl.textContent = 'Map offline · ' + nv0.city + ', ' + nv0.state;
      locBtn.hidden = true;
      return { setType: function () {}, destroy: function () {} };
    }

    var map = PS.map.base(el, { scrollWheelZoom: false });
    var layer = window.L.layerGroup().addTo(map);
    var markers = {}, me = null, meMarker = null, openId = null;

    // Scroll-wheel zoom only after the map is clicked, so the page still scrolls past it.
    el.addEventListener('click', function () { map.scrollWheelZoom.enable(); });
    el.addEventListener('mouseleave', function () { map.scrollWheelZoom.disable(); });

    function icon(html) { return window.L.divIcon({ className: 'pin-wrap', html: html, iconSize: null }); }
    function draw() {
      layer.clearLayers(); markers = {};
      D.venues.forEach(function (v) {
        window.L.marker([v.lat, v.lng], { icon: icon('<div class="pin-venue">' + I.icon('star', 'ic-fill') + '<span>' + esc(shortName(v)) + '</span></div>'), zIndexOffset: 1000, title: v.name })
          .on('click', function () { R.go('#/search?' + U.buildQuery({ venue: v.id, type: type })); }).addTo(layer);
      });
      spots().forEach(function (l) {
        markers[l.id] = window.L.marker([l.lat, l.lng], { icon: icon('<div class="pin-price">' + U.money(l.price[type]) + '</div>'), title: l.title })
          .on('click', function () { openSheet(l); }).addTo(layer);
      });
      updateCount();
    }

    function setHl(id, on) { var m = markers[id], e = m && m.getElement(); if (e) e.classList.toggle('hl', on); if (m) m.setZIndexOffset(on ? 900 : 0); }
    function openSheet(l) {
      if (openId) setHl(openId, false);
      openId = l.id; setHl(l.id, true);
      var w = S.walk(l), v = S.venue(l.venueId);
      sheet.innerHTML = '<a class="hm-spot" href="#/spot/' + l.id + '?' + U.buildQuery({ type: type }) + '">' +
        '<span class="hm-thumb">' + I.photo(l, 0, { key: 'hm' }) + '</span>' +
        '<span class="hm-info"><strong>' + esc(l.title) + '</strong><span class="muted">' + w.mins + ' min walk to ' + esc(shortName(v)) + '</span>' + CMP.rating(l) + '</span>' +
        '<span class="hm-price"><b>' + U.money(l.price[type]) + '</b><span>' + L.unit[type] + '</span></span></a>' +
        '<button type="button" class="hm-close" aria-label="Close">' + I.icon('x') + '</button>';
      sheet.hidden = false;
      U.$('.hm-close', sheet).addEventListener('click', closeSheet);
    }
    function closeSheet() { if (openId) setHl(openId, false); openId = null; sheet.hidden = true; }
    map.on('click', closeSheet);

    function fitVenue(v) {
      var pts = spots().filter(function (l) { return l.venueId === v.id; }).map(function (l) { return [l.lat, l.lng]; }).concat([[v.lat, v.lng]]);
      map.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
    }
    function updateCount() {
      if (dead) return;
      var b = map.getBounds(), c = map.getCenter();
      var n = spots().filter(function (l) { return b.contains([l.lat, l.lng]); }).length;
      var nv = nearestVenue(c.lat, c.lng).v;
      countEl.innerHTML = n
        ? '<b>' + n + '</b>&nbsp;spot' + (n === 1 ? '' : 's') + ' in view <a href="#/search?' + U.buildQuery({ venue: nv.id, type: type }) + '">List ' + I.icon('arrow') + '</a>'
        : 'No spots here <button type="button" data-jump="' + nv.id + '">Go to ' + esc(shortName(nv)) + ' ' + I.icon('arrow') + '</button>';
      var j = U.$('[data-jump]', countEl);
      if (j) j.addEventListener('click', function () { fitVenue(S.venue(j.getAttribute('data-jump'))); });
    }
    map.on('moveend', updateCount);

    function placeMe(pos) {
      me = pos;
      if (meMarker) meMarker.remove();
      meMarker = window.L.marker([pos.lat, pos.lng], {
        icon: window.L.divIcon({ className: 'me-wrap', html: '<div class="me-dot"><span></span></div>', iconSize: [22, 22] }),
        zIndexOffset: 2000, interactive: false, keyboard: false
      }).addTo(map);
      var nv = nearestVenue(pos.lat, pos.lng), mi = nv.m / 1609.34;
      if (nv.m <= NEAR_M) {
        var pts = spots().filter(function (l) { return l.venueId === nv.v.id; }).map(function (l) { return [l.lat, l.lng]; })
          .concat([[pos.lat, pos.lng], [nv.v.lat, nv.v.lng]]);
        map.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
      } else {
        map.setView([pos.lat, pos.lng], 12);
      }
      locEl.textContent = pos.demo ? 'Demo location · ' + nv.v.city + ', ' + nv.v.state
        : (mi < 3 ? 'Spots near ' + shortName(nv.v) : (mi < 10 ? mi.toFixed(1) : Math.round(mi)) + ' mi from ' + shortName(nv.v));
    }

    function locate(manual) {
      if (!navigator.geolocation) { if (manual) UI.toast('Location isn’t available in this browser. Showing the demo location.'); return; }
      locBtn.classList.add('busy');
      navigator.geolocation.getCurrentPosition(function (p) {
        if (dead) return;
        locBtn.classList.remove('busy');
        placeMe({ lat: p.coords.latitude, lng: p.coords.longitude });
      }, function () {
        if (dead) return;
        locBtn.classList.remove('busy');
        if (manual) UI.toast('Couldn’t get your location. Showing the demo location in Arlington, TX.');
        placeMe(DEMO_LOC);
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
    }
    locBtn.addEventListener('click', function () { if (me && !me.demo) placeMe(me); else locate(true); });

    placeMe(DEMO_LOC);       // something useful right away (map needs a view before drawing)...
    draw();
    locEl.textContent = 'Finding you…';
    locate(false);           // ...then switch to the real location if the browser allows it
    setTimeout(function () { if (!dead) map.invalidateSize(); }, 60);

    return {
      setType: function (t) { type = t; closeSheet(); draw(); },
      destroy: function () { dead = true; map.remove(); }
    };
  }

  /* ---------- HOME ---------- */
  R.add(/^\/$/, function () {
    var evs = S.upcomingEvents();
    var venueStats = D.venues.map(function (v) {
      var ls = S.state.listings.filter(function (l) { return l.venueId === v.id && l.active; });
      var prices = ls.map(function (l) { return l.price.event || l.price.hourly; }).filter(Boolean);
      return { v: v, n: ls.length, from: prices.length ? Math.min.apply(0, prices) : null };
    });
    var feat = S.state.listings.filter(function (l) { return l.rating >= 4.9 && l.active; }).slice(0, 4);

    var html =
      '<section class="hero"><div class="hero-lines" aria-hidden="true"></div><div class="wrap hero-inner"><div class="hero-copy">' +
        '<p class="eyebrow">Event-day, hourly & monthly parking</p>' +
        '<h1>Park closer.<br><span class="hl-curb">Pay a neighbor.</span></h1>' +
        '<p class="hero-sub">Driveways, yards, church and business lots within walking distance of the stadium, from hosts who live there.</p>' +
        '<form class="hero-search" id="hero-search" autocomplete="off">' +
          '<div class="seg seg-dark" role="tablist" id="hero-type">' +
            ['event', 'hourly', 'monthly'].map(function (t, i) { return '<button type="button" role="tab" class="' + (i === 0 ? 'on' : '') + '" data-type="' + t + '">' + L.type[t] + '</button>'; }).join('') +
          '</div>' +
          '<div class="search-box">' + I.icon('search') +
            '<input id="hero-q" type="search" placeholder="Venue, city or address, e.g. Lambeau Field" aria-label="Search venue, city or address">' +
            '<button class="btn btn-primary" type="submit">Find parking</button>' +
            '<div class="suggest" id="hero-suggest" hidden></div>' +
          '</div>' +
          '<div class="quick">' + ['AT&T Stadium', 'Lambeau Field', 'Wrigley Field', 'Ohio Stadium', 'Austin 6th St'].map(function (q) { return '<button type="button" class="chip chip-dark" data-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div>' +
        '</form>' +
        '<div class="home-map-card">' +
          '<div class="hm-head"><h2>You are here</h2><span class="hm-loc" id="hm-loc">Finding you…</span></div>' +
          '<div class="hm-wrap"><div id="home-map" class="map home-map" role="region" aria-label="Map of parking spots near you"></div>' +
            '<div class="hm-count" id="hm-count" aria-live="polite"></div>' +
            '<div class="hm-sheet" id="hm-sheet" hidden></div>' +
            '<button type="button" class="hm-locate" id="hm-locate" aria-label="Center on my location" title="Center on my location">' + I.icon('locate') + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="hero-stats"><div><b>' + S.state.listings.length + '</b><span>spots listed</span></div><div><b>' + D.venues.length + '</b><span>venues</span></div><div><b>4.8' + I.icon('star', 'ic-fill') + '</b><span>avg host rating</span></div></div>' +
      '</div></div></section>' +

      '<section class="wrap section"><div class="section-head"><div><p class="eyebrow">Next up</p><h2>Upcoming events</h2></div><a class="link" href="#/search?type=event">All spots ' + I.icon('arrow') + '</a></div>' +
        '<div class="ev-strip" tabindex="0">' + evs.map(CMP.eventChip).join('') + '</div></section>' +

      '<section class="wrap section"><div class="section-head"><div><p class="eyebrow">Where we park</p><h2>Popular venues</h2></div></div>' +
        '<div class="venue-grid">' + venueStats.map(function (s) {
          return '<a class="venue-tile" href="#/search?venue=' + s.v.id + '"><span class="vt-kind">' + s.v.kind + '</span><strong>' + esc(s.v.name) + '</strong>' +
            '<span class="muted">' + esc(s.v.city) + ', ' + s.v.state + '</span><span class="vt-foot"><span>' + s.n + ' spots</span>' + (s.from ? '<span>from <b>' + U.money(s.from) + '</b></span>' : '') + '</span></a>';
        }).join('') + '</div></section>' +

      '<section class="wrap section"><div class="section-head"><div><p class="eyebrow">Top rated</p><h2>Hosts drivers love</h2></div></div>' +
        '<div class="card-grid">' + feat.map(function (l) { return CMP.card(l); }).join('') + '</div></section>' +

      '<section class="band"><div class="wrap how">' +
        '<div><span class="step-n">1</span><h3>Pick your game</h3><p>Search a venue or choose an event. Every spot shows the real walking time to the gate.</p></div>' +
        '<div><span class="step-n">2</span><h3>Book in a minute</h3><p>See the full price up front, including the service fee. Cancellation terms are listed on every spot.</p></div>' +
        '<div><span class="step-n">3</span><h3>Scan in and walk over</h3><p>Show your QR pass or say your plate. Most spots let you leave anytime without being blocked in.</p></div>' +
      '</div></section>' +

      '<section class="wrap section trust">' +
        '<div class="trust-item">' + I.icon('shield') + '<div><h3>Verified hosts</h3><p>We check ID, the address, and the host\'s right to rent the space before the verified badge appears.</p></div></div>' +
        '<div class="trust-item">' + I.icon('star') + '<div><h3>Real reviews</h3><p>Only drivers who parked can leave a review, and reviews are posted after the event.</p></div></div>' +
        '<div class="trust-item">' + I.icon('flag') + '<div><h3>Help on game day</h3><p>Spot taken or host missing? Report it in one tap and we\'ll rebook you nearby or refund you.</p></div></div>' +
      '</section>' +

      '<section class="wrap section"><div class="host-cta"><div><p class="eyebrow">For homeowners, churches, schools & businesses</p><h2>Your driveway could earn $300+ a season.</h2>' +
        '<p>List it in about five minutes. You decide the days, the price and the house rules.</p></div>' +
        '<a class="btn btn-primary btn-lg" href="#/host/new">List your spot ' + I.icon('arrow') + '</a></div></section>';

    return {
      html: html, title: 'Event parking near the stadium',
      mount: function (root) {
        var form = U.$('#hero-search', root), input = U.$('#hero-q', root), sug = U.$('#hero-suggest', root);
        var type = 'event';
        var hm = homeMap(root, type);
        R.onLeave(function () { hm.destroy(); });
        U.$$('#hero-type button', root).forEach(function (b) {
          b.addEventListener('click', function () {
            U.$$('#hero-type button', root).forEach(function (x) { x.classList.remove('on'); });
            b.classList.add('on'); type = b.getAttribute('data-type');
            hm.setType(type);
          });
        });
        function go(q) { R.go('#/search?' + U.buildQuery({ q: q, type: type })); }
        form.addEventListener('submit', function (e) { e.preventDefault(); go(input.value.trim()); });
        U.$$('[data-q]', root).forEach(function (b) { b.addEventListener('click', function () { go(b.getAttribute('data-q')); }); });
        input.addEventListener('input', function () {
          var hits = matchVenues(input.value) || [];
          if (!input.value.trim() || !hits.length) { sug.hidden = true; return; }
          sug.innerHTML = hits.slice(0, 5).map(function (v) {
            return '<button type="button" data-v="' + v.id + '">' + I.icon('pin') + '<span><b>' + esc(v.name) + '</b><small>' + esc(v.city) + ', ' + v.state + '</small></span></button>';
          }).join('');
          sug.hidden = false;
        });
        sug.addEventListener('click', function (e) {
          var b = e.target.closest('[data-v]'); if (b) R.go('#/search?' + U.buildQuery({ venue: b.getAttribute('data-v'), type: type }));
        });
        function hide(e) { if (!form.contains(e.target)) sug.hidden = true; }
        document.addEventListener('click', hide);
        R.onLeave(function () { document.removeEventListener('click', hide); });
      }
    };
  });

  /* ---------- SEARCH ---------- */
  var PRICE_MAX = { event: 100, hourly: 30, monthly: 800 };

  R.add(/^\/search$/, function (_, q) {
    var st = {
      q: q.q || '', venue: q.venue || '', event: q.event || '',
      type: q.type || 'event', max: q.max ? +q.max : null,
      am: q.am ? q.am.split(',') : [], spot: q.spot || '', sort: q.sort || 'distance'
    };
    if (st.event) { var ev0 = S.event(st.event); if (ev0) { st.venue = ev0.venue; st.type = 'event'; } else st.event = ''; }
    if (st.type !== 'event') st.event = '';

    var html =
      '<section class="search-page">' +
        '<div class="search-top"><div class="wrap">' +
          '<form class="search-inline" id="s-form" autocomplete="off">' + I.icon('search') +
            '<input id="s-q" type="search" value="' + esc(st.venue && !st.q ? S.venue(st.venue).name : st.q) + '" placeholder="Venue, city or address" aria-label="Search">' +
            '<button class="btn btn-primary btn-sm" type="submit">Search</button></form>' +
          '<div class="filters" id="filters">' +
            '<div class="seg" id="f-type">' + ['event', 'hourly', 'monthly'].map(function (t) { return '<button type="button" data-type="' + t + '" class="' + (st.type === t ? 'on' : '') + '">' + L.type[t] + '</button>'; }).join('') + '</div>' +
            '<button type="button" class="chip chip-toggle" id="f-more">' + I.icon('list') + 'Filters <span id="f-count"></span></button>' +
            '<div class="filter-panel" id="f-panel">' +
              '<label class="range-field"><span>Max price <b id="f-max-l"></b></span><input type="range" id="f-max" min="0" step="1"></label>' +
              '<div class="chips" id="f-am">' + Object.keys(L.amen).map(function (k) {
                return '<button type="button" class="chip ' + (st.am.indexOf(k) > -1 ? 'on' : '') + '" data-am="' + k + '">' + I.icon(L.amenIcon[k]) + L.amen[k] + '</button>';
              }).join('') + '</div>' +
              '<div class="filter-row"><label class="sel"><span>Spot type</span><select id="f-spot"><option value="">Any</option>' +
                Object.keys(L.spot).map(function (k) { return '<option value="' + k + '"' + (st.spot === k ? ' selected' : '') + '>' + L.spot[k] + '</option>'; }).join('') + '</select></label>' +
              '<label class="sel"><span>Sort</span><select id="f-sort">' +
                [['distance', 'Closest walk'], ['price', 'Lowest price'], ['rating', 'Top rated']].map(function (o) { return '<option value="' + o[0] + '"' + (st.sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') +
              '</select></label><button type="button" class="link" id="f-clear">Clear filters</button></div>' +
            '</div>' +
          '</div>' +
        '</div></div>' +
        '<div class="search-split">' +
          '<div class="results-col"><div id="s-context"></div><div class="results-head"><span id="s-count"></span></div><div id="s-list" class="result-list"></div></div>' +
          '<div class="map-col"><div id="s-map" class="map"></div></div>' +
        '</div>' +
        '<button class="fab" id="view-toggle" type="button">' + I.icon('map') + '<span>Map</span></button>' +
      '</section>';

    return {
      html: html, title: 'Find parking',
      mount: function (root) {
        var mapCtl = null;
        R.onLeave(function () { if (mapCtl) mapCtl.destroy(); });
        var maxEl = U.$('#f-max', root);

        function syncHash() {
          var qs = U.buildQuery({ q: st.q, venue: st.q ? '' : st.venue, event: st.event, type: st.type, max: st.max, am: st.am.join(','), spot: st.spot, sort: st.sort === 'distance' ? '' : st.sort });
          history.replaceState(null, '', '#/search' + (qs ? '?' + qs : ''));
        }

        function setupRange() {
          var cap = PRICE_MAX[st.type];
          maxEl.max = cap; maxEl.step = st.type === 'monthly' ? 25 : 1;
          if (st.max == null || st.max > cap) st.max = null;
          maxEl.value = st.max == null ? cap : st.max;
          U.$('#f-max-l', root).textContent = st.max == null ? 'Any' : U.money(st.max) + ' ' + L.unit[st.type];
        }

        function compute() {
          var venues = st.venue ? [S.venue(st.venue)] : matchVenues(st.q);
          var notFound = st.q && venues && !venues.length;
          var vIds = venues && venues.length ? venues.map(function (v) { return v.id; }) : null;
          var list = S.state.listings.filter(function (l) {
            if (!l.active) return false;
            if (vIds && vIds.indexOf(l.venueId) < 0) return false;
            var p = l.price[st.type];
            if (!p) return false;
            if (st.max != null && p > st.max) return false;
            if (st.spot && l.spotType !== st.spot) return false;
            for (var i = 0; i < st.am.length; i++) if (!l.amenities[st.am[i]]) return false;
            return true;
          });
          list.sort(function (a, b) {
            if (st.sort === 'price') return a.price[st.type] - b.price[st.type];
            if (st.sort === 'rating') return b.rating - a.rating;
            if (!vIds || vIds.length > 1) { var c = a.venueId.localeCompare(b.venueId); if (c) return c; }
            return S.walk(a).miles - S.walk(b).miles;
          });
          return { list: list, venues: venues && venues.length ? venues : null, notFound: notFound };
        }

        function renderContext(res) {
          var h = '';
          var ev = st.event ? S.event(st.event) : null;
          if (res.notFound) h += '<div class="notice">' + I.icon('info') + '<span>We couldn\'t place "<b>' + esc(st.q) + '</b>". This demo covers the venues below, so we\'re showing all spots.</span></div>';
          if (ev) {
            var md = U.monthDay(ev.date);
            h += '<div class="event-banner"><div class="ev-date"><span>' + md.m + '</span><b>' + md.d + '</b><span>' + md.w + '</span></div><div><span class="ev-cat">' + esc(ev.cat) + '</span><h2>' + esc(ev.name) + '</h2><p class="muted">' + esc(S.venue(ev.venue).name) + ' · ' + U.fmtTime(ev.time) + ' · parking opens ' + U.fmtTime(parkingStart(ev)) + '</p></div><button class="icon-btn" id="clear-ev" aria-label="Clear event">' + I.icon('x') + '</button></div>';
          } else if (res.venues && res.venues.length === 1) {
            var v = res.venues[0];
            h += '<div class="venue-head"><p class="eyebrow">' + v.kind + ' · ' + esc(v.city) + ', ' + v.state + '</p><h2>Parking near ' + esc(v.name) + '</h2></div>';
          }
          if (st.type === 'event' && !ev && res.venues && res.venues.length === 1) {
            var evs = S.upcomingEvents(res.venues[0].id);
            if (evs.length) h += '<div class="pick-ev"><span class="muted">Pick a date to see availability:</span><div class="chips">' + evs.map(function (e) { return '<button class="chip" data-ev="' + e.id + '">' + U.fmtDate(e.date) + ' · ' + esc(e.name) + '</button>'; }).join('') + '</div></div>';
          }
          if (res.venues && res.venues.length === 1) h += CMP.rulesBanner(res.venues[0]);
          U.$('#s-context', root).innerHTML = h;
          var ce = U.$('#clear-ev', root); if (ce) ce.addEventListener('click', function () { st.event = ''; update(); });
          U.$$('[data-ev]', root).forEach(function (b) { b.addEventListener('click', function () { st.event = b.getAttribute('data-ev'); update(); }); });
        }

        function update() {
          syncHash();
          setupRange();
          U.$$('#f-type button', root).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-type') === st.type); });
          var nf = st.am.length + (st.max != null ? 1 : 0) + (st.spot ? 1 : 0);
          U.$('#f-count', root).textContent = nf ? '(' + nf + ')' : '';
          var res = compute();
          renderContext(res);
          U.$('#s-count', root).innerHTML = '<b>' + res.list.length + '</b> ' + (res.list.length === 1 ? 'spot' : 'spots') + (st.type !== 'event' ? ' with ' + L.type[st.type].toLowerCase() + ' parking' : '');
          U.$('#s-list', root).innerHTML = res.list.length ? res.list.map(function (l) { return CMP.card(l, { type: st.type, eventId: st.event }); }).join('')
            : '<div class="empty">' + I.icon('car') + '<h3>No spots match those filters</h3><p>Try a higher max price or fewer amenities.</p><button class="btn btn-ghost" id="empty-clear">Clear filters</button></div>';
          var ec = U.$('#empty-clear', root); if (ec) ec.addEventListener('click', clearFilters);
          // map
          if (mapCtl) mapCtl.destroy();
          var mapEl = U.$('#s-map', root);
          mapEl.innerHTML = ''; mapEl.className = 'map';
          var vs = res.venues || D.venues;
          var items = res.list.map(function (l) { return { id: l.id, lat: l.lat, lng: l.lng, label: U.money(l.price[st.type]), kind: 'spot' }; })
            .concat(vs.map(function (v) { return { id: 'venue-' + v.id, lat: v.lat, lng: v.lng, label: v.name.replace('GEHA Field at ', '').replace('Downtown Austin — ', ''), kind: 'venue' }; }));
          mapCtl = PS.map.create(mapEl, items, {
            maxZoom: 16,
            onClick: function (id) {
              var card = U.$('.lcard[data-lid="' + id + '"]', root);
              if (card) { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); card.classList.add('flash'); setTimeout(function () { card.classList.remove('flash'); }, 1200); }
              if (card && document.body.classList.contains('show-map')) R.go(card.getAttribute('href'));
            }
          });
        }

        function clearFilters() { st.am = []; st.max = null; st.spot = ''; st.sort = 'distance'; U.$('#f-spot', root).value = ''; U.$('#f-sort', root).value = 'distance'; U.$$('#f-am .chip', root).forEach(function (c) { c.classList.remove('on'); }); update(); }

        U.$('#s-form', root).addEventListener('submit', function (e) { e.preventDefault(); st.q = U.$('#s-q', root).value.trim(); st.venue = ''; st.event = ''; var hits = matchVenues(st.q); if (hits && hits.length === 1) { st.venue = hits[0].id; st.q = ''; } update(); });
        U.$$('#f-type button', root).forEach(function (b) { b.addEventListener('click', function () { st.type = b.getAttribute('data-type'); st.max = null; if (st.type !== 'event') st.event = ''; update(); }); });
        U.$('#f-more', root).addEventListener('click', function () { U.$('#filters', root).classList.toggle('open'); });
        maxEl.addEventListener('input', function () { st.max = +maxEl.value >= PRICE_MAX[st.type] ? null : +maxEl.value; U.$('#f-max-l', root).textContent = st.max == null ? 'Any' : U.money(st.max) + ' ' + L.unit[st.type]; });
        maxEl.addEventListener('change', update);
        U.$$('#f-am .chip', root).forEach(function (c) { c.addEventListener('click', function () { var k = c.getAttribute('data-am'); var i = st.am.indexOf(k); if (i > -1) st.am.splice(i, 1); else st.am.push(k); c.classList.toggle('on'); update(); }); });
        U.$('#f-spot', root).addEventListener('change', function (e) { st.spot = e.target.value; update(); });
        U.$('#f-sort', root).addEventListener('change', function (e) { st.sort = e.target.value; update(); });
        U.$('#f-clear', root).addEventListener('click', clearFilters);

        var list = U.$('#s-list', root);
        list.addEventListener('mouseover', function (e) { var c = e.target.closest('.lcard'); if (c && mapCtl) mapCtl.highlight(c.getAttribute('data-lid'), true); });
        list.addEventListener('mouseout', function (e) { var c = e.target.closest('.lcard'); if (c && mapCtl) mapCtl.highlight(c.getAttribute('data-lid'), false); });

        var tog = U.$('#view-toggle', root);
        document.body.classList.remove('show-map');
        R.onLeave(function () { document.body.classList.remove('show-map'); });
        tog.addEventListener('click', function () {
          var on = document.body.classList.toggle('show-map');
          tog.innerHTML = on ? I.icon('list') + '<span>List</span>' : I.icon('map') + '<span>Map</span>';
          if (on && mapCtl) setTimeout(function () { mapCtl.refresh(); }, 50);
          window.scrollTo(0, 0);
        });
        update();
      }
    };
  });

  /* ---------- SPOT DETAIL ---------- */
  R.add(/^\/spot\/([^/]+)$/, function (p, q) {
    var l = S.listing(p[0]);
    if (!l) return { html: '<section class="wrap empty-page"><h1>Spot not found</h1><p>This listing may have been removed. Try resetting the demo data.</p><a class="btn btn-primary" href="#/search">Browse spots</a></section>' };
    var v = S.venue(l.venueId), w = S.walk(l), revs = S.reviews(l.id);
    var types = ['event', 'hourly', 'monthly'].filter(function (t) { return l.price[t]; });
    var type = types.indexOf(q.type) > -1 ? q.type : types[0];
    var mine = l.host.id === 'me';
    var cp = L.cancel[l.cancel];
    var fromPrice = l.price[type];

    var html =
      '<section class="spot-page wrap">' +
        '<a class="back" href="#/search?' + U.buildQuery({ venue: l.venueId, type: type, event: q.event || '' }) + '">' + I.icon('back') + 'Spots near ' + esc(v.name) + '</a>' +
        (q.created ? '<div class="notice ok">' + I.icon('check') + '<span><b>Your listing is live.</b> Drivers searching ' + esc(v.name) + ' can book it now. Manage it from your <a href="#/host">host dashboard</a>.</span></div>' : '') +
        '<div class="gallery" id="gallery">' +
          '<div class="g-main" id="g-main">' + I.photo(l, 0, { key: 'm' }) + '</div>' +
          '<div class="g-thumbs">' + [0, 1, 2].map(function (i) { return '<button class="g-thumb ' + (i === 0 ? 'on' : '') + '" data-i="' + i + '" aria-label="Photo ' + (i + 1) + '">' + I.photo(l, i, { key: 't' }) + '</button>'; }).join('') + '</div>' +
          '<span class="g-note">Illustrations · demo photos</span>' +
        '</div>' +
        '<div class="spot-grid">' +
          '<div class="spot-main">' +
            '<div class="spot-title"><span class="tag">' + L.spot[l.spotType] + '</span>' + CMP.verified(l) + '</div>' +
            '<h1>' + esc(l.title) + '</h1>' +
            '<p class="spot-sub">' + CMP.rating(l) + '<span class="dot">·</span>' + esc(l.street) + ', ' + esc(l.city) + ', ' + l.state + '</p>' +
            '<div class="walk-card">' +
              '<div class="wc-big"><b>' + w.mins + '</b><span>min walk</span></div>' +
              '<div><strong>' + w.miles.toFixed(1) + ' miles to ' + esc(v.name) + '</strong><p class="muted">Exact address and gate code are shared after booking. ' + l.spots + ' space' + (l.spots > 1 ? 's' : '') + ' total.</p></div>' +
            '</div>' +
            '<h2 class="h-sec">What this spot offers</h2>' +
            '<div class="amen-full">' + (CMP.amenities(l, true) || '<span class="muted">Standard parking space, no extra amenities.</span>') + '</div>' +
            '<h2 class="h-sec">About the spot</h2><p>' + esc(l.description) + '</p>' +
            '<div class="host-card">' +
              '<div class="avatar">' + esc(l.host.name.charAt(0)) + '</div>' +
              '<div><strong>Hosted by ' + esc(l.host.name) + (mine ? ' (you)' : '') + '</strong><p class="muted">' + L.host[l.host.type] + ' · hosting since ' + l.host.since + ' · replies in ~' + l.host.responseMins + ' min</p>' + CMP.verified(l) + '</div>' +
            '</div>' +
            '<h2 class="h-sec">House rules</h2><ul class="rules">' + l.rules.map(function (r) { return '<li>' + I.icon('check') + '<span>' + esc(r) + '</span></li>'; }).join('') + '</ul>' +
            '<h2 class="h-sec">Cancellation policy</h2><div class="policy"><strong>' + cp.name + '</strong><p>' + cp.text + ' The service fee is refunded on the same terms.</p></div>' +
            CMP.rulesBanner(v) +
            '<h2 class="h-sec">Location</h2><div class="map map-sm" id="spot-map"></div>' +
            '<h2 class="h-sec">Reviews <span class="muted">' + (l.reviewCount ? '· ' + (+l.rating).toFixed(1) + ' from ' + l.reviewCount : '') + '</span></h2>' +
            '<div class="reviews">' + (revs.length ? revs.map(function (r) {
              return '<div class="review"><div class="review-head"><div class="avatar sm">' + esc(r.name.charAt(0)) + '</div><div><strong>' + esc(r.name) + '</strong><span class="muted">' + U.fmtDate(r.date, true) + '</span></div>' + U.stars(r.rating) + '</div><p>' + esc(r.text) + '</p></div>';
            }).join('') : '<p class="muted">No reviews yet. Be one of the first to park here.</p>') + '</div>' +
            '<button class="btn btn-ghost report-btn" id="report">' + I.icon('flag') + 'Report a problem with this listing</button>' +
          '</div>' +
          '<aside class="book-col"><div class="book-card" id="book-card"></div></aside>' +
        '</div>' +
        '<div class="book-bar"><div><b>' + U.money(fromPrice) + '</b> <span class="muted">' + L.unit[type] + '</span></div><button class="btn btn-primary" id="bar-reserve">Reserve</button></div>' +
      '</section>';

    return {
      html: html, title: l.title, neutral: true,
      mount: function (root) {
        // gallery
        U.$$('.g-thumb', root).forEach(function (b) {
          b.addEventListener('click', function () {
            U.$$('.g-thumb', root).forEach(function (x) { x.classList.remove('on'); });
            b.classList.add('on');
            U.$('#g-main', root).innerHTML = I.photo(l, +b.getAttribute('data-i'), { key: 'm' });
          });
        });
        U.$('#report', root).addEventListener('click', function () { UI.report(l.title); });
        U.$('#bar-reserve', root).addEventListener('click', function () { U.$('#book-card', root).scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        var m = PS.map.create(U.$('#spot-map', root), [
          { id: l.id, lat: l.lat, lng: l.lng, label: 'P', kind: 'spot' },
          { id: 'venue-' + v.id, lat: v.lat, lng: v.lng, label: v.name.replace('GEHA Field at ', '').replace('Downtown Austin — ', ''), kind: 'venue' }
        ], { line: [[l.lat, l.lng], [v.lat, v.lng]], maxZoom: 16 });
        R.onLeave(function () { m.destroy(); });

        // booking widget
        var bs = { type: type, eventId: q.event || '', date: U.addDays(C.TODAY, 1), start: '17:00', hours: 3, month: '2026-11-01' };
        var evs = S.upcomingEvents(l.venueId).filter(function (e) { return !l.eventIds || l.eventIds.indexOf(e.id) > -1; });
        if (!bs.eventId || !evs.some(function (e) { return e.id === bs.eventId; })) {
          var firstOpen = evs.filter(function (e) { return S.spotsLeft(l, e.id) > 0; })[0];
          bs.eventId = firstOpen ? firstOpen.id : '';
        }
        var card = U.$('#book-card', root);

        function opts() {
          if (bs.type === 'event') { var e = S.event(bs.eventId); return e ? { type: 'event', eventId: e.id, date: e.date, start: parkingStart(e) } : null; }
          if (bs.type === 'hourly') return { type: 'hourly', date: bs.date, start: bs.start, hours: bs.hours };
          return { type: 'monthly', date: bs.month, start: '00:00' };
        }

        function draw() {
          var h = '<div class="bc-price"><b>' + U.money(l.price[bs.type]) + '</b><span>' + L.unit[bs.type] + '</span></div>';
          if (types.length > 1) h += '<div class="seg seg-full" id="bc-type">' + types.map(function (t) { return '<button type="button" data-t="' + t + '" class="' + (bs.type === t ? 'on' : '') + '">' + L.type[t] + '</button>'; }).join('') + '</div>';
          if (bs.type === 'event') {
            h += evs.length ? '<div class="ev-pick">' + evs.map(function (e) {
              var left = S.spotsLeft(l, e.id), md = U.monthDay(e.date);
              return '<label class="ev-opt ' + (left ? '' : 'disabled') + '"><input type="radio" name="ev" value="' + e.id + '"' + (bs.eventId === e.id ? ' checked' : '') + (left ? '' : ' disabled') + '>' +
                '<span class="ev-mini"><span>' + md.m + '</span><b>' + md.d + '</b></span><span class="ev-o-txt"><strong>' + esc(e.name) + '</strong><small>' + md.w + ' · ' + U.fmtTime(e.time) + ' · parking from ' + U.fmtTime(parkingStart(e)) + '</small></span>' +
                '<span class="left ' + (left <= 2 ? 'low' : '') + '">' + (left ? left + ' left' : 'Sold out') + '</span></label>';
            }).join('') + '</div>' : '<p class="muted">No upcoming events at this venue right now.</p>';
          } else if (bs.type === 'hourly') {
            var hoursOpts = '', startOpts = '';
            for (var hh = 6; hh <= 22; hh++) { var t = String(hh).padStart(2, '0') + ':00'; startOpts += '<option value="' + t + '"' + (bs.start === t ? ' selected' : '') + '>' + U.fmtTime(t) + '</option>'; }
            for (var n = 1; n <= 12; n++) hoursOpts += '<option value="' + n + '"' + (bs.hours === n ? ' selected' : '') + '>' + n + ' hr' + (n > 1 ? 's' : '') + '</option>';
            h += '<div class="form-grid"><label class="field"><span>Date</span><input type="date" id="bc-date" min="' + C.TODAY + '" max="2027-12-31" value="' + bs.date + '"></label>' +
              '<label class="field"><span>Start</span><select id="bc-start">' + startOpts + '</select></label>' +
              '<label class="field"><span>Duration</span><select id="bc-hours">' + hoursOpts + '</select></label></div>' +
              '<p class="muted small">Ends ' + U.fmtTime(U.addHours(bs.start, bs.hours)) + '. Host availability: 7 AM–11 PM daily.</p>';
          } else {
            h += '<label class="field"><span>Start date</span><select id="bc-month">' + ['2026-11-01', '2026-11-15', '2026-12-01', '2027-01-01'].map(function (d) { return '<option value="' + d + '"' + (bs.month === d ? ' selected' : '') + '>' + U.fmtDate(d, true) + '</option>'; }).join('') + '</select></label>' +
              '<p class="muted small">24/7 access to one reserved space. Renews monthly and you can cancel anytime before renewal.</p>';
          }
          var o = opts();
          if (o) {
            var qt = S.quote(l, o);
            h += '<div class="breakdown"><div><span>' + qt.label + '</span><span>' + U.money2(qt.price) + '</span></div>' +
              '<div><span>Driver service fee <button class="tip" type="button" title="Covers payment processing, 24/7 support and the parking guarantee.">?</button></span><span>' + U.money2(qt.fee) + '</span></div>' +
              '<div class="total"><span>Total</span><span>' + U.money2(qt.total) + '</span></div></div>';
          }
          h += '<button class="btn btn-primary btn-block btn-lg" id="bc-go"' + (o && !mine ? '' : ' disabled') + '>' + (mine ? 'This is your listing' : o ? 'Reserve · ' + U.money2(S.quote(l, o).total) : 'Choose a date') + '</button>' +
            '<p class="bc-foot">' + I.icon('lock') + 'You won\'t be charged yet · ' + L.cancel[l.cancel].name + ' cancellation</p>';
          card.innerHTML = h;

          U.$$('#bc-type button', card).forEach(function (b) { b.addEventListener('click', function () { bs.type = b.getAttribute('data-t'); draw(); }); });
          U.$$('input[name=ev]', card).forEach(function (r) { r.addEventListener('change', function () { bs.eventId = r.value; draw(); }); });
          var d = U.$('#bc-date', card); if (d) d.addEventListener('change', function () { if (d.value) { bs.date = d.value < C.TODAY ? C.TODAY : d.value; } draw(); });
          var s = U.$('#bc-start', card); if (s) s.addEventListener('change', function () { bs.start = s.value; draw(); });
          var hr = U.$('#bc-hours', card); if (hr) hr.addEventListener('change', function () { bs.hours = +hr.value; draw(); });
          var mo = U.$('#bc-month', card); if (mo) mo.addEventListener('change', function () { bs.month = mo.value; draw(); });
          U.$('#bc-go', card).addEventListener('click', function () {
            var o2 = opts(); if (!o2) return;
            R.go('#/checkout/' + l.id + '?' + U.buildQuery({ type: o2.type, event: o2.eventId || '', date: o2.date, start: o2.start, hours: o2.hours || '' }));
          });
        }
        draw();
      }
    };
  });

  /* ---------- CHECKOUT ---------- */
  R.add(/^\/checkout\/([^/]+)$/, function (p, q) {
    var l = S.listing(p[0]);
    if (!l || !q.type || !l.price[q.type]) return { redirect: '#/search' };
    var o = { type: q.type, eventId: q.event || null, date: q.date || C.TODAY, start: q.start || '08:00', hours: q.hours ? +q.hours : null };
    if (o.type === 'event' && !S.event(o.eventId)) return { redirect: '#/spot/' + l.id };
    var qt = S.quote(l, o), me = C.CURRENT_USER;
    var when = PS.bookingWhen(o);
    var v = S.venue(l.venueId);

    var html =
      '<section class="wrap checkout">' +
        '<a class="back" href="#/spot/' + l.id + '?type=' + o.type + (o.eventId ? '&event=' + o.eventId : '') + '">' + I.icon('back') + 'Back to spot</a>' +
        '<h1>Confirm and pay</h1>' +
        '<div class="co-grid">' +
          '<form id="co-form" class="co-form" novalidate>' +
            '<fieldset><legend><span class="step-n sm">1</span>Your vehicle</legend>' +
              '<div class="form-grid"><label class="field"><span>License plate</span><input id="co-plate" class="mono" required value="' + esc(me.plate) + '" autocomplete="off"></label>' +
              '<label class="field"><span>Make, model & color</span><input id="co-veh" value="' + esc(me.vehicle) + '"></label></div>' +
              (l.amenities.oversize ? '' : '<p class="muted small">' + I.icon('info') + 'Standard vehicles only at this spot. No trailers or dually trucks.</p>') +
            '</fieldset>' +
            '<fieldset><legend><span class="step-n sm">2</span>Contact</legend>' +
              '<div class="form-grid"><label class="field"><span>Full name</span><input id="co-name" required value="' + esc(me.name) + '"></label>' +
              '<label class="field"><span>Email for your pass</span><input id="co-email" type="email" required value="' + esc(me.email) + '"></label></div>' +
            '</fieldset>' +
            '<fieldset class="pay"><legend><span class="step-n sm">3</span>Payment</legend>' +
              '<div class="demo-ribbon">' + I.icon('info') + 'Demo checkout. No charge will be made.</div>' +
              '<div class="stripe-el">' +
                '<label class="field"><span>Card number</span><div class="card-input">' + I.icon('lock') + '<input id="co-card" class="mono" inputmode="numeric" value="4242 4242 4242 4242" maxlength="19" autocomplete="off"><span class="brand">VISA</span></div></label>' +
                '<div class="form-grid g3"><label class="field"><span>Expiry</span><input id="co-exp" class="mono" value="12 / 28" maxlength="7"></label>' +
                '<label class="field"><span>CVC</span><input id="co-cvc" class="mono" value="123" maxlength="4"></label>' +
                '<label class="field"><span>ZIP</span><input id="co-zip" class="mono" value="76011" maxlength="5"></label></div>' +
              '</div>' +
              '<p class="muted small powered">' + I.icon('lock') + 'Payments powered by a Stripe-style mock · test card prefilled</p>' +
            '</fieldset>' +
            '<p class="small muted">By paying you agree to the host\'s house rules and the ' + L.cancel[l.cancel].name.toLowerCase() + ' cancellation policy.</p>' +
            '<button class="btn btn-primary btn-lg btn-block" id="co-pay" type="submit">Pay ' + U.money2(qt.total) + ' <span class="demo-tag">demo, no charge</span></button>' +
          '</form>' +
          '<aside class="co-summary">' +
            '<div class="cs-head"><div class="cs-thumb">' + I.photo(l, 0, { key: 's' }) + '</div><div><span class="tag">' + L.spot[l.spotType] + '</span><strong>' + esc(l.title) + '</strong>' + CMP.rating(l) + '</div></div>' +
            '<div class="cs-rows">' +
              '<div>' + I.icon('cal') + '<span><b>' + esc(when.title) + '</b><small>' + esc(when.sub) + '</small></span></div>' +
              '<div>' + I.icon('walk') + '<span><b>' + S.walk(l).mins + ' min walk</b><small>to ' + esc(v.name) + '</small></span></div>' +
              '<div>' + I.icon('leave') + '<span><b>' + (l.amenities.leave ? 'Leave anytime' : 'Stacked parking') + '</b><small>' + (l.amenities.leave ? 'You won\'t be blocked in' : 'Exit after the host releases your row') + '</small></span></div>' +
            '</div>' +
            '<div class="breakdown"><div><span>' + qt.label + '</span><span>' + U.money2(qt.price) + '</span></div>' +
              '<div><span>Driver service fee</span><span>' + U.money2(qt.fee) + '</span></div>' +
              '<div class="total"><span>Total (USD)</span><span>' + U.money2(qt.total) + '</span></div></div>' +
            '<div class="policy sm"><strong>' + L.cancel[l.cancel].name + ' cancellation</strong><p>' + L.cancel[l.cancel].text + '</p></div>' +
          '</aside>' +
        '</div>' +
      '</section>';

    return {
      html: html, title: 'Checkout',
      mount: function (root) {
        var card = U.$('#co-card', root);
        card.addEventListener('input', function () { var d = card.value.replace(/\D/g, '').slice(0, 16); card.value = d.replace(/(.{4})/g, '$1 ').trim(); });
        U.$('#co-form', root).addEventListener('submit', function (e) {
          e.preventDefault();
          var errs = [];
          function chk(id, ok, msg) { var el = U.$(id, root); el.closest('.field').classList.toggle('err', !ok); if (!ok) errs.push(msg); }
          chk('#co-plate', U.$('#co-plate', root).value.trim().length >= 2, 'Enter your license plate');
          chk('#co-name', U.$('#co-name', root).value.trim().length >= 2, 'Enter your name');
          chk('#co-email', /.+@.+\..+/.test(U.$('#co-email', root).value), 'Enter a valid email');
          chk('#co-card', card.value.replace(/\D/g, '').length === 16, 'Card number must be 16 digits');
          chk('#co-exp', /^\s*\d{2}\s*\/\s*\d{2}\s*$/.test(U.$('#co-exp', root).value), 'Expiry must be MM / YY');
          chk('#co-cvc', /^\d{3,4}$/.test(U.$('#co-cvc', root).value.trim()), 'CVC must be 3–4 digits');
          if (errs.length) { UI.toast(errs[0], 'warn'); return; }
          var btn = U.$('#co-pay', root);
          btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Processing…';
          setTimeout(function () {
            var bk = S.createBooking(l, o, { name: U.$('#co-name', root).value.trim(), plate: U.$('#co-plate', root).value.trim().toUpperCase(), vehicle: U.$('#co-veh', root).value.trim(), email: U.$('#co-email', root).value.trim() });
            R.go('#/confirm/' + bk.id);
          }, 1100);
        });
      }
    };
  });

  /* ---------- CONFIRMATION ---------- */
  function icsFor(bk, l) {
    var d = bk.date.replace(/-/g, ''), t = (bk.start || '08:00').replace(':', '') + '00';
    var endH = bk.type === 'hourly' ? U.addHours(bk.start, bk.hours) : U.addHours(bk.start, 8);
    var when = PS.bookingWhen(bk);
    return 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//' + C.APP_NAME + '//Demo//EN\r\nBEGIN:VEVENT\r\nUID:' + bk.id + '@demo\r\nDTSTAMP:20261029T120000\r\nDTSTART:' + d + 'T' + t +
      '\r\nDTEND:' + d + 'T' + endH.replace(':', '') + '00\r\nSUMMARY:Parking: ' + when.title + ' (' + bk.code + ')\r\nLOCATION:' + l.street + ', ' + l.city + ', ' + l.state +
      '\r\nDESCRIPTION:' + C.APP_NAME + ' pass ' + bk.code + '. ' + l.arrival.replace(/[,;]/g, ' ') + '\r\nEND:VEVENT\r\nEND:VCALENDAR';
  }

  R.add(/^\/confirm\/([^/]+)$/, function (p) {
    var bk = S.booking(p[0]);
    if (!bk) return { redirect: '#/bookings' };
    var l = S.listing(bk.listingId), v = S.venue(l.venueId), when = PS.bookingWhen(bk);
    var dir = 'https://www.google.com/maps/dir/?api=1&destination=' + l.lat + ',' + l.lng + '&travelmode=driving';
    var walk = 'https://www.google.com/maps/dir/?api=1&origin=' + l.lat + ',' + l.lng + '&destination=' + v.lat + ',' + v.lng + '&travelmode=walking';
    var stall = (l.photoSeed % 40) + 1;
    var html =
      '<section class="wrap confirm">' +
        '<div class="confirm-head"><div class="big-check">' + I.icon('check') + '</div><div><p class="eyebrow">' + (bk.status === 'cancelled' ? 'Cancelled booking' : 'Booking confirmed') + '</p><h1>' + (bk.status === 'cancelled' ? 'This booking was cancelled.' : 'You\'re parked, ' + esc(bk.driver.name.split(' ')[0]) + '.') + '</h1>' +
          '<p class="muted">We emailed your pass to ' + esc(bk.driver.email || C.CURRENT_USER.email) + ' (demo, nothing was sent).</p></div></div>' +
        '<div class="confirm-grid">' +
          '<div class="pass">' +
            '<div class="pass-top"><span class="brand-mini">' + esc(C.APP_NAME) + ' PASS</span>' + PS.statusPill(bk) + '</div>' +
            '<div class="pass-qr">' + I.qr(bk.code, 210) + '</div>' +
            '<div class="pass-code mono">' + bk.code + '</div>' +
            '<p class="muted small center">Show this at the entrance, or just tell the host your plate.</p>' +
            '<div class="perf" aria-hidden="true"></div>' +
            '<dl class="pass-dl">' +
              '<div><dt>Event</dt><dd>' + esc(when.title) + '</dd></div>' +
              '<div><dt>When</dt><dd>' + esc(when.sub) + '</dd></div>' +
              '<div><dt>Plate</dt><dd class="mono">' + esc(bk.driver.plate) + '</dd></div>' +
              '<div><dt>Space</dt><dd>#' + stall + ' · ' + L.spot[l.spotType] + '</dd></div>' +
              '<div><dt>Paid</dt><dd>' + U.money2(bk.total) + ' <span class="muted small">(demo)</span></dd></div>' +
            '</dl>' +
          '</div>' +
          '<div class="confirm-info">' +
            '<div class="ci-block"><h2>' + esc(l.title) + '</h2><p class="muted">' + esc(l.street) + ', ' + esc(l.city) + ', ' + l.state + ' · hosted by ' + esc(l.host.name) + '</p>' +
              '<div class="btn-row"><a class="btn btn-primary" href="' + dir + '" target="_blank" rel="noopener">' + I.icon('pin') + 'Directions to spot</a>' +
              '<a class="btn btn-ghost" href="' + walk + '" target="_blank" rel="noopener">' + I.icon('walk') + 'Walk to ' + esc(v.name.replace('GEHA Field at ', '')) + '</a>' +
              '<button class="btn btn-ghost" id="ics">' + I.icon('cal') + 'Add to calendar</button></div></div>' +
            '<div class="ci-block"><h3>Arrival instructions</h3><ol class="arrive">' +
              '<li>' + (bk.type === 'event' ? 'Parking opens at <b>' + U.fmtTime(bk.start) + '</b>. Arrive early, because traffic builds 2 hours before kickoff.' : bk.type === 'hourly' ? 'Your window is <b>' + esc(when.sub) + '</b>. Grace period: 10 minutes either side.' : 'Your monthly access starts <b>' + U.fmtDate(bk.date) + '</b>. Gate code arrives by email the day before.') + '</li>' +
              '<li>' + esc(l.arrival) + '</li>' +
              '<li>Your space number is <b>#' + stall + '</b>. ' + (l.amenities.leave ? 'You can leave anytime and won\'t be blocked in.' : 'This is stacked parking, so plan to leave after the host releases your row.') + '</li>' +
              '<li>Walk ' + S.walk(l).mins + ' minutes (' + S.walk(l).miles.toFixed(1) + ' mi) to ' + esc(v.name) + '.</li>' +
            '</ol></div>' +
            '<div class="ci-block"><h3>Need help?</h3><div class="btn-row"><button class="btn btn-ghost" id="msg-host">Message host</button><button class="btn btn-ghost" id="rep">' + I.icon('flag') + 'Report a problem</button><a class="btn btn-ghost" href="#/bookings">My bookings</a></div></div>' +
          '</div>' +
        '</div>' +
      '</section>';
    return {
      html: html, title: 'Booking confirmed',
      mount: function (root) {
        U.$('#ics', root).addEventListener('click', function () {
          var blob = new Blob([icsFor(bk, l)], { type: 'text/calendar' });
          var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = bk.code + '.ics';
          document.body.appendChild(a); a.click(); a.remove();
          UI.toast('Calendar file downloaded.');
        });
        U.$('#msg-host', root).addEventListener('click', function () { UI.toast('Message sent to ' + esc(l.host.name) + ' (demo). Typical reply: ~' + l.host.responseMins + ' min.'); });
        U.$('#rep', root).addEventListener('click', function () { UI.report('Booking ' + bk.code + ' · ' + l.title); });
      }
    };
  });

  /* ---------- MY BOOKINGS ---------- */
  R.add(/^\/bookings$/, function (_, q) {
    var tab = q.tab || 'upcoming';
    var mine = S.state.bookings.filter(function (b) { return b.mine; });
    var groups = {
      upcoming: mine.filter(function (b) { return (b.status === 'confirmed' || b.status === 'checked-in') && b.date >= C.TODAY; }),
      past: mine.filter(function (b) { return b.status === 'completed' || (b.status !== 'cancelled' && b.date < C.TODAY); }),
      cancelled: mine.filter(function (b) { return b.status === 'cancelled'; })
    };
    groups.upcoming.sort(function (a, b) { return a.date.localeCompare(b.date); });
    var list = groups[tab] || [];

    function row(bk) {
      var l = S.listing(bk.listingId); if (!l) return '';
      var w = PS.bookingWhen(bk), md = U.monthDay(bk.date);
      var acts = '';
      if (tab === 'upcoming') acts = '<a class="btn btn-primary btn-sm" href="#/confirm/' + bk.id + '">View pass</a><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' + l.lat + ',' + l.lng + '">Directions</a><button class="btn btn-ghost btn-sm" data-cancel="' + bk.id + '">Cancel</button>';
      else if (tab === 'past') acts = (bk.reviewed ? '<span class="muted small">' + I.icon('check') + 'Reviewed</span>' : '<button class="btn btn-primary btn-sm" data-review="' + bk.id + '">Leave a review</button>') + '<a class="btn btn-ghost btn-sm" href="#/spot/' + l.id + '">Book again</a>';
      else acts = '<a class="btn btn-ghost btn-sm" href="#/spot/' + l.id + '">View spot</a>';
      return '<article class="bk-row">' +
        '<div class="bk-date"><span>' + md.m + '</span><b>' + md.d + '</b></div>' +
        '<div class="bk-thumb">' + I.photo(l, 0, { key: 'b' + bk.id }) + '</div>' +
        '<div class="bk-main"><div class="bk-top">' + PS.statusPill(bk) + '<span class="mono muted small">' + bk.code + '</span></div>' +
          '<h3>' + esc(w.title) + '</h3><p class="muted">' + esc(w.sub) + '</p><p>' + esc(l.title) + ' · ' + esc(S.venue(l.venueId).name) + '</p>' +
          '<div class="bk-acts">' + acts + '<button class="link small" data-rep="' + bk.id + '">Report a problem</button></div></div>' +
        '<div class="bk-total"><b>' + U.money2(bk.total) + '</b>' + (bk.refund != null ? '<span class="muted small">refunded ' + U.money2(bk.refund) + '</span>' : '') + '</div>' +
      '</article>';
    }

    var html = '<section class="wrap page">' +
      '<div class="page-head"><div><p class="eyebrow">Driver</p><h1>My bookings</h1></div><a class="btn btn-primary" href="#/search">' + I.icon('search') + 'Find parking</a></div>' +
      '<div class="tabs">' + ['upcoming', 'past', 'cancelled'].map(function (t) { return '<a href="#/bookings?tab=' + t + '" class="' + (t === tab ? 'on' : '') + '">' + t.charAt(0).toUpperCase() + t.slice(1) + ' <span>' + groups[t].length + '</span></a>'; }).join('') + '</div>' +
      (list.length ? '<div class="bk-list">' + list.map(row).join('') + '</div>' :
        '<div class="empty">' + I.icon('cal') + '<h3>No ' + tab + ' bookings</h3><p>' + (tab === 'upcoming' ? 'Find a spot for your next game or concert.' : 'Nothing here yet.') + '</p><a class="btn btn-primary" href="#/">Browse events</a></div>') +
      '</section>';

    return {
      html: html, title: 'My bookings',
      mount: function (root) {
        U.$('.page', root).addEventListener('click', function (e) {
          var c = e.target.closest('[data-cancel]'), r = e.target.closest('[data-review]'), rp = e.target.closest('[data-rep]');
          if (c) {
            var bk = S.booking(c.getAttribute('data-cancel')), l = S.listing(bk.listingId), rf = S.refundFor(bk);
            UI.confirm('Cancel booking ' + bk.code + '?', 'Under the <b>' + L.cancel[l.cancel].name + '</b> policy you\'ll get <b>' + U.money2(rf.amount) + '</b> back (' + Math.round(rf.pct * 100) + '% of ' + U.money2(bk.total) + '). ' + L.cancel[l.cancel].text, 'Cancel booking', function () {
              bk.status = 'cancelled'; bk.refund = rf.amount; S.save();
              UI.toast('Booking cancelled. ' + U.money2(rf.amount) + ' refund issued (demo).');
              R.render();
            }, true);
          } else if (r) {
            var b2 = S.booking(r.getAttribute('data-review'));
            var rating = 5;
            UI.modal({
              title: 'Review ' + S.listing(b2.listingId).title,
              body: '<div class="star-pick" id="star-pick">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-n="' + n + '" class="on" aria-label="' + n + ' stars">' + I.icon('star', 'ic-fill') + '</button>'; }).join('') + '</div>' +
                '<label class="field"><span>How was it?</span><textarea id="rv-text" rows="3" placeholder="Easy to find? Walk to the gate? Getting out after?"></textarea></label>',
              mount: function (el) {
                U.$$('#star-pick button', el).forEach(function (b) {
                  b.addEventListener('click', function () { rating = +b.getAttribute('data-n'); U.$$('#star-pick button', el).forEach(function (x) { x.classList.toggle('on', +x.getAttribute('data-n') <= rating); }); });
                });
              },
              actions: [{ label: 'Cancel' }, { label: 'Post review', cls: 'btn-primary', onClick: function (el) {
                var txt = U.$('#rv-text', el).value.trim() || 'Great spot, would park here again.';
                S.addReview(b2.listingId, { name: C.CURRENT_USER.name.split(' ')[0] + ' ' + C.CURRENT_USER.name.split(' ')[1].charAt(0) + '.', rating: rating, text: txt, date: C.TODAY });
                b2.reviewed = true; S.save();
                UI.toast('Thanks! Your review is posted.');
                R.render();
              } }]
            });
          } else if (rp) {
            var b3 = S.booking(rp.getAttribute('data-rep'));
            UI.report('Booking ' + b3.code);
          }
        });
      }
    };
  });

  PS.matchVenues = matchVenues;
  PS.parkingStart = parkingStart;
})();
