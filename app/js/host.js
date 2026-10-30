/* Host views: dashboard (bookings, earnings chart, payouts, check-in) and the "List your spot" wizard. */
(function () {
  var C = PS.config, D = PS.data, S = PS.store, U = PS.util, I = PS.illus, L = PS.labels, CMP = PS.cmp, UI = PS.ui;
  var esc = U.esc, R = PS.router;

  function norm(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }

  /* ---------- earnings chart (SVG) ---------- */
  function earningsChart(hist, booked) {
    var data = hist.map(function (h) { return { m: h.month, v: h.amount, kind: 'paid' }; })
      .concat(booked.map(function (b) { return { m: b.month, v: b.amount, kind: 'booked' }; }));
    var W = 560, H = 220, padL = 8, padB = 28, padT = 26, bw = (W - padL * 2) / data.length;
    var max = Math.max.apply(0, data.map(function (d) { return d.v; }).concat([100]));
    max = Math.ceil(max / 100) * 100;
    var s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Monthly earnings chart">' +
      '<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#FFE3A3"/><rect width="2.5" height="6" fill="#FFB81C"/></pattern></defs>';
    [0.5, 1].forEach(function (f) {
      var y = padT + (H - padT - padB) * (1 - f);
      s += '<line x1="0" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="#E6DFD0" stroke-dasharray="3 4"/>' +
        '<text x="' + (W - 2) + '" y="' + (y - 4) + '" text-anchor="end" class="ch-ax">$' + (max * f) + '</text>';
    });
    data.forEach(function (d, i) {
      var h = (H - padT - padB) * (d.v / max), x = padL + i * bw + bw * 0.18, w = bw * 0.64, y = H - padB - h;
      s += '<g class="bar"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + Math.max(h, 2) + '" rx="4" fill="' + (d.kind === 'paid' ? '#13212E' : 'url(#hatch)') + '"' + (d.kind === 'booked' ? ' stroke="#E89B00"' : '') + '/>' +
        '<text x="' + (x + w / 2) + '" y="' + (y - 6) + '" text-anchor="middle" class="ch-val">$' + Math.round(d.v) + '</text>' +
        '<text x="' + (x + w / 2) + '" y="' + (H - 9) + '" text-anchor="middle" class="ch-ax">' + U.monthName(d.m) + '</text><title>' + U.monthName(d.m) + ': $' + d.v.toFixed(2) + (d.kind === 'booked' ? ' booked' : ' earned') + '</title></g>';
    });
    s += '<line x1="0" x2="' + W + '" y1="' + (H - padB) + '" y2="' + (H - padB) + '" stroke="#13212E" stroke-width="1.5"/></svg>';
    return s;
  }

  /* ---------- DASHBOARD ---------- */
  R.add(/^\/host$/, function () {
    var mine = S.hostListings();
    var hb = S.hostBookings();
    var upcoming = hb.filter(function (b) { return (b.status === 'confirmed' || b.status === 'checked-in') && b.date >= C.TODAY; })
      .sort(function (a, b) { return (a.date + a.start).localeCompare(b.date + b.start); });
    var booked = {};
    upcoming.forEach(function (b) { var m = b.date.slice(0, 7); booked[m] = (booked[m] || 0) + b.hostPayout; });
    var bookedArr = ['2026-11', '2026-12'].map(function (m) { return { month: m, amount: +(booked[m] || 0).toFixed(2) }; });
    var hist = S.state.earnings;
    var octEarn = hist[hist.length - 1].amount;
    var projected = upcoming.reduce(function (a, b) { return a + b.hostPayout; }, 0);
    var rated = mine.filter(function (l) { return l.reviewCount; });
    var avg = rated.length ? rated.reduce(function (a, l) { return a + l.rating; }, 0) / rated.length : 0;
    var scheduled = upcoming.filter(function (b) { return b.date <= '2026-11-09'; }).reduce(function (a, b) { return a + b.hostPayout; }, 0);
    var payouts = S.state.payouts.map(function (p) { return p.status === 'scheduled' ? Object.assign({}, p, { amount: scheduled }) : p; });

    // group upcoming by date
    var byDate = {};
    upcoming.forEach(function (b) { (byDate[b.date] = byDate[b.date] || []).push(b); });

    function bkRow(b) {
      var l = S.listing(b.listingId), w = PS.bookingWhen(b);
      return '<div class="hb-row" data-bk="' + b.id + '">' +
        '<div class="hb-who"><div class="avatar sm">' + esc(b.driver.name.charAt(0)) + '</div><div><strong>' + esc(b.driver.name) + '</strong><span class="muted small">' + esc(b.driver.vehicle || '') + '</span></div></div>' +
        '<div class="hb-plate mono">' + esc(b.driver.plate) + '</div>' +
        '<div class="hb-what"><span>' + esc(l.title) + '</span><span class="muted small">' + esc(b.type === 'event' ? 'From ' + U.fmtTime(b.start) : w.sub) + ' · <span class="mono">' + b.code + '</span></span></div>' +
        '<div class="hb-pay"><b>' + U.money2(b.hostPayout) + '</b></div>' +
        '<div class="hb-act">' + (b.status === 'checked-in' ? '<span class="pill pill-go">' + I.icon('check') + 'Checked in</span>' : '<button class="btn btn-ghost btn-sm" data-checkin="' + b.id + '">Check in</button>') + '</div>' +
      '</div>';
    }

    var html = '<section class="wrap page host-dash">' +
      '<div class="page-head"><div><p class="eyebrow">Host dashboard</p><h1>Welcome back, ' + esc(C.CURRENT_USER.first) + '.</h1></div>' +
        '<a class="btn btn-primary" href="#/host/new">' + I.icon('plus') + 'List a new spot</a></div>' +

      '<div class="stats">' +
        '<div class="stat"><span>Earned in October</span><b>' + U.money(octEarn) + '</b><small class="up">▲ 26% vs Sep</small></div>' +
        '<div class="stat"><span>Upcoming bookings</span><b>' + upcoming.length + '</b><small>' + Object.keys(byDate).length + ' dates</small></div>' +
        '<div class="stat"><span>Booked Nov–Dec</span><b>' + U.money2(projected) + '</b><small>after 10% host fee</small></div>' +
        '<div class="stat"><span>Host rating</span><b>' + (avg ? avg.toFixed(2) : '—') + '</b><small>' + mine.length + ' listing' + (mine.length === 1 ? '' : 's') + '</small></div>' +
      '</div>' +

      '<div class="dash-grid">' +
        '<div class="dash-main">' +
          '<div class="panel checkin" id="checkin"><div class="panel-head"><h2>' + I.icon('scan') + 'Check in a driver</h2><span class="muted small">Scan the pass or type the code or plate</span></div>' +
            '<form id="ci-form" class="ci-form" autocomplete="off"><input id="ci-q" class="mono" placeholder="PS-7K3Q9 or LMN 2210" aria-label="Booking code or plate"><button class="btn btn-primary" type="submit">Look up</button><button class="btn btn-dark" type="button" id="ci-scan">' + I.icon('camera') + 'Scan QR</button></form>' +
            '<div id="ci-result"></div>' +
            '<p class="muted small">Try <button class="link mono" data-try="PS-7K3Q9">PS-7K3Q9</button> or plate <button class="link mono" data-try="RKX 5512">RKX 5512</button></p>' +
          '</div>' +

          '<div class="panel"><div class="panel-head"><h2>Upcoming bookings</h2><span class="muted small">' + upcoming.length + ' total</span></div>' +
            (upcoming.length ? Object.keys(byDate).sort().map(function (d) {
              var first = byDate[d][0], ev = first.eventId ? S.event(first.eventId) : null, md = U.monthDay(d);
              var sum = byDate[d].reduce(function (a, b) { return a + b.hostPayout; }, 0);
              return '<div class="hb-group"><div class="hb-ghead"><div class="ev-date sm"><span>' + md.m + '</span><b>' + md.d + '</b></div><div><strong>' + (ev ? esc(ev.name) : U.fmtDate(d)) + '</strong><span class="muted small">' + (ev ? U.fmtDate(d) + ' · kickoff ' + U.fmtTime(ev.time) : 'Hourly') + ' · ' + byDate[d].length + ' car' + (byDate[d].length > 1 ? 's' : '') + '</span></div><b class="hb-sum">' + U.money2(sum) + '</b></div>' +
                byDate[d].map(bkRow).join('') + '</div>';
            }).join('') : '<div class="empty sm"><p>No upcoming bookings yet. Make sure your event days are turned on.</p></div>') +
          '</div>' +

          '<div class="panel"><div class="panel-head"><h2>Your listings</h2><a class="link" href="#/host/new">' + I.icon('plus') + 'Add</a></div><div class="my-listings">' +
            mine.map(function (l) {
              var cnt = upcoming.filter(function (b) { return b.listingId === l.id; }).length;
              return '<div class="ml-row"><div class="ml-thumb">' + I.photo(l, 0, { key: 'h' }) + '</div><div class="ml-main"><strong>' + esc(l.title) + '</strong><span class="muted small">' + esc(S.venue(l.venueId).name) + ' · ' + l.spots + ' space' + (l.spots > 1 ? 's' : '') + ' · ' +
                ['event', 'hourly', 'monthly'].filter(function (t) { return l.price[t]; }).map(function (t) { return U.money(l.price[t]) + ' ' + L.unit[t]; }).join(' · ') + '</span>' +
                '<span class="small">' + CMP.rating(l) + ' · ' + cnt + ' upcoming · ' + (l.host.verified ? '<span class="ok-txt">Verified</span>' : '<span class="warn-txt">Verification pending</span>') + '</span></div>' +
                '<div class="ml-acts"><label class="switch" title="Accepting bookings"><input type="checkbox" data-toggle="' + l.id + '"' + (l.active ? ' checked' : '') + '><span></span></label><a class="link small" href="#/spot/' + l.id + '">View</a></div></div>';
            }).join('') + '</div></div>' +
        '</div>' +

        '<div class="dash-side">' +
          '<div class="panel"><div class="panel-head"><h2>Earnings</h2><span class="legend"><i class="lg-paid"></i>Paid <i class="lg-booked"></i>Booked</span></div>' + earningsChart(hist, bookedArr) +
            '<p class="muted small">Net of the ' + Math.round(C.HOST_FEE_RATE * 100) + '% host fee. Season to date: <b>' + U.money(hist.reduce(function (a, h) { return a + h.amount; }, 0)) + '</b></p></div>' +
          '<div class="panel"><div class="panel-head"><h2>Payouts</h2><span class="muted small">Weekly · Tuesdays</span></div>' +
            '<div class="payouts">' + payouts.slice().reverse().map(function (p) {
              var st = { paid: ['Paid', 'muted'], in_transit: ['In transit', 'ok'], scheduled: ['Scheduled', 'warn'] }[p.status];
              return '<div class="po-row"><div><strong>' + (p.status === 'scheduled' ? 'Est. ' : '') + U.money2(p.amount) + '</strong><span class="muted small">' + U.fmtDate(p.date, true) + ' · ' + esc(p.method) + '</span></div><span class="pill pill-' + st[1] + '">' + st[0] + '</span></div>';
            }).join('') + '</div>' +
            '<div class="po-foot"><span class="muted small">' + I.icon('lock') + 'Payout account verified (mock)</span><button class="btn btn-ghost btn-sm" id="instant">Instant payout</button></div></div>' +
          '<div class="panel tip-panel"><h3>' + I.icon('info') + 'Host tip</h3><p>Hosts who allow tailgating and "leave anytime" earn about 30% more per event. Clear exit lanes make that possible.</p><button class="link small" id="host-report">' + I.icon('flag') + 'Report a problem with a driver</button></div>' +
        '</div>' +
      '</div></section>';

    return {
      html: html, title: 'Host dashboard',
      mount: function (root) {
        var page = U.$('.host-dash', root);
        var resEl = U.$('#ci-result', root), input = U.$('#ci-q', root);

        function lookup(qv) {
          var n = norm(qv);
          if (!n) { resEl.innerHTML = ''; return; }
          var all = S.hostBookings();
          var hits = all.filter(function (b) { return norm(b.code) === n || norm(b.code) === 'PS' + n || norm(b.driver.plate) === n; });
          hits.sort(function (a, b) { return (a.status === 'confirmed' ? 0 : 1) - (b.status === 'confirmed' ? 0 : 1) || a.date.localeCompare(b.date); });
          var b = hits[0];
          if (!b) { resEl.innerHTML = '<div class="ci-card bad">' + I.icon('warn') + '<div><strong>No booking matches "' + esc(qv) + '"</strong><p>Check the code on the driver\'s pass, or ask them to open it in My bookings. If someone parked without booking, you can report it.</p></div></div>'; return; }
          var l = S.listing(b.listingId), w = PS.bookingWhen(b);
          var today = b.date === C.TODAY;
          var state = b.status === 'checked-in' ? 'go' : b.status === 'cancelled' ? 'bad' : 'ok';
          resEl.innerHTML = '<div class="ci-card ' + state + '">' + I.icon(state === 'bad' ? 'warn' : 'check') +
            '<div class="ci-body"><strong>' + esc(b.driver.name) + ' · <span class="mono">' + esc(b.driver.plate) + '</span></strong>' +
            '<p>' + esc(b.driver.vehicle || '') + ' · ' + esc(w.title) + ', ' + esc(w.sub) + '<br>' + esc(l.title) + ' · <span class="mono">' + b.code + '</span> · pays you ' + U.money2(b.hostPayout) + '</p>' +
            (b.status === 'cancelled' ? '<p><b>This booking was cancelled.</b> Ask the driver to rebook.</p>' :
              b.status === 'checked-in' ? '<p><b>Already checked in</b>' + (b.checkedInAt ? ' at ' + new Date(b.checkedInAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '') + '.</p>' :
              (today ? '' : '<p class="muted small">Heads up: this booking is for ' + U.fmtDate(b.date) + '. In the demo you can check in early.</p>') + '<button class="btn btn-primary" id="ci-do">' + I.icon('check') + 'Confirm check-in</button>') +
            '</div></div>';
          var btn = U.$('#ci-do', resEl);
          if (btn) btn.addEventListener('click', function () {
            b.status = 'checked-in'; b.checkedInAt = new Date().toISOString(); S.save();
            UI.toast(esc(b.driver.name) + ' checked in. Enjoy the game!');
            R.render();
          });
        }

        U.$('#ci-form', root).addEventListener('submit', function (e) { e.preventDefault(); lookup(input.value); });
        U.$$('[data-try]', root).forEach(function (t) { t.addEventListener('click', function () { input.value = t.getAttribute('data-try'); lookup(input.value); }); });
        U.$('#ci-scan', root).addEventListener('click', function () {
          var next = S.hostBookings().filter(function (b) { return b.status === 'confirmed' && b.date >= C.TODAY; }).sort(function (a, b) { return a.date.localeCompare(b.date); })[0];
          var mod = UI.modal({
            title: 'Scan driver pass', cls: 'modal-scan', focus: false,
            body: '<div class="scanner"><div class="scan-feed">' + (next ? '<div class="scan-qr">' + I.qr(next.code, 150) + '</div>' : '') + '<div class="scan-frame"></div><div class="scan-laser"></div></div>' +
              '<p class="muted small center">Camera preview is simulated in this demo. Tap "Simulate scan" to read the pass in view.</p>',
            actions: [{ label: 'Cancel' }, { label: 'Simulate scan', cls: 'btn-primary', onClick: function (el) {
              if (!next) { UI.toast('No upcoming passes to scan.', 'warn'); return; }
              U.$('.scan-feed', el).classList.add('hit');
              setTimeout(function () {
                mod.close();
                input.value = next.code; lookup(next.code);
                U.$('#checkin', root).scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 650);
              return false;
            } }]
          });
        });
        page.addEventListener('click', function (e) {
          var c = e.target.closest('[data-checkin]');
          if (c) { var b = S.booking(c.getAttribute('data-checkin')); input.value = b.code; lookup(b.code); U.$('#checkin', root).scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        });
        U.$$('[data-toggle]', root).forEach(function (t) {
          t.addEventListener('change', function () {
            var l = S.listing(t.getAttribute('data-toggle')); l.active = t.checked; S.save();
            UI.toast(l.active ? 'Listing is live and accepting bookings.' : 'Listing paused. Existing bookings are kept.');
          });
        });
        U.$('#instant', root).addEventListener('click', function () { UI.toast('Instant payout requested (demo). Funds would arrive in about 30 minutes for a 1.5% fee.'); });
        U.$('#host-report', root).addEventListener('click', function () { UI.report('Host issue'); });
      }
    };
  });

  /* ---------- LIST YOUR SPOT WIZARD ---------- */
  var WZ_KEY = 'parkshare.wizard';
  var STEPS = ['Host type', 'Address', 'The space', 'Photos', 'Availability', 'Pricing', 'House rules', 'Attest & publish'];
  var DEF_SPOT = { home: 'driveway', business: 'business', church: 'church', school: 'school' };
  var DESC = {
    driveway: 'A private driveway at a single-family home, with clearly marked spaces.',
    yard: 'Level, mowed grass parking with staked and numbered spaces.',
    church: 'A paved church lot with painted stalls. Proceeds support our community programs.',
    business: 'A paved business lot available after hours and on event days.',
    school: 'A paved school lot with painted stalls. Proceeds support student activities.'
  };
  var RULES = [
    ['leave', 'Leave anytime: drivers won\'t be blocked in'],
    ['tailgate', 'Tailgating allowed (no open flames near buildings)'],
    ['noalcohol', 'No alcohol on the property'],
    ['nooversize', 'Standard vehicles only (no trailers or RVs)'],
    ['quiet', 'Quiet after 10 PM'],
    ['trash', 'Take your trash with you'],
    ['noovernight', 'No overnight parking (except monthly)']
  ];

  function freshWizard() {
    return {
      step: 0, hostType: '', address: '', city: '', venueId: '', lat: null, lng: null,
      spots: 2, spotType: '', amen: { ev: false, oversize: false, covered: false, tailgate: false, leave: true }, title: '', desc: '',
      photos: 0, eventIds: null, hourly: { on: false, days: [6, 0], from: '08:00', to: '20:00' }, monthly: false, eventOn: true,
      price: { event: null, hourly: null, monthly: null },
      rules: { leave: true, trash: true, noovernight: true }, customRule: '', cancel: 'moderate', arrival: '',
      attest: false, terms: false
    };
  }
  function loadWz() { try { var w = JSON.parse(sessionStorage.getItem(WZ_KEY)); if (w && typeof w.step === 'number') return w; } catch (e) {} return freshWizard(); }
  function saveWz(w) { try { sessionStorage.setItem(WZ_KEY, JSON.stringify(w)); } catch (e) {} }

  function draftListing(w) {
    var v = S.venue(w.venueId) || D.venues[0];
    var seed = 0, k = (w.address || 'x') + w.spots; for (var i = 0; i < k.length; i++) seed = (seed * 31 + k.charCodeAt(i)) >>> 0;
    return {
      id: 'draft', venueId: v.id, title: w.title || 'Your spot', street: w.address, city: w.city || v.city, state: v.state,
      host: { id: 'me', name: 'Jordan R.', type: w.hostType || 'home', verified: false, since: 2026, responseMins: 5 },
      spotType: w.spotType || 'driveway', lat: w.lat || v.lat, lng: w.lng || v.lng, spots: w.spots,
      price: { event: w.eventOn && w.eventIds && w.eventIds.length ? +w.price.event : null, hourly: w.hourly.on ? +w.price.hourly : null, monthly: w.monthly ? +w.price.monthly : null },
      amenities: Object.assign({}, w.amen, { leave: !!w.rules.leave, tailgate: !!w.rules.tailgate, oversize: w.amen.oversize && !w.rules.nooversize }),
      rating: 0, reviewCount: 0, cancel: w.cancel, photoSeed: seed || 11, active: true
    };
  }

  function placeNear(w) {
    var v = S.venue(w.venueId); if (!v) return;
    var h = 0, s = w.address + '|' + w.venueId; for (var i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
    var ang = (h % 360) * Math.PI / 180, r = 0.005 + (h % 7) * 0.001;
    w.lat = +(v.lat + Math.sin(ang) * r).toFixed(6); w.lng = +(v.lng + Math.cos(ang) * r * 1.25).toFixed(6);
  }

  R.add(/^\/host\/new$/, function (_, q) {
    if (q.restart) { sessionStorage.removeItem(WZ_KEY); return { redirect: '#/host/new' }; }
    var w = loadWz();
    var html = '<section class="wrap wizard"><div class="wz-head"><a class="back" href="#/host">' + I.icon('back') + 'Dashboard</a><button class="link small" id="wz-restart">Start over</button></div>' +
      '<div class="wz-progress"><div class="wz-bar"><span id="wz-fill"></span></div><div class="wz-steps" id="wz-steps"></div></div>' +
      '<div class="wz-body" id="wz-body"></div>' +
      '<div class="wz-nav"><button class="btn btn-ghost" id="wz-back">' + I.icon('back') + 'Back</button><button class="btn btn-primary" id="wz-next">Next ' + I.icon('arrow') + '</button></div></section>';

    return {
      html: html, title: 'List your spot',
      mount: function (root) {
        var body = U.$('#wz-body', root);
        var wzMap = null;
        R.onLeave(function () { if (wzMap) wzMap.destroy(); });

        function chips(name, items, sel) {
          return items.map(function (it) { return '<button type="button" class="chip ' + (sel(it[0]) ? 'on' : '') + '" data-' + name + '="' + it[0] + '">' + it[1] + '</button>'; }).join('');
        }

        var views = [
          // 0 host type
          function () {
            var opts = [['home', 'Homeowner', 'Driveway, yard or garage at your home', 'home'], ['business', 'Business', 'Your lot after hours and on event days', 'biz'], ['church', 'Church', 'Raise funds from your lot on game days', 'church'], ['school', 'School', 'Booster clubs and PTOs, weekends and events', 'school']];
            return '<h1>Who\'s hosting?</h1><p class="lead">Hosts near stadiums earn the most on event days. Pick the option that fits your property.</p>' +
              '<div class="opt-grid">' + opts.map(function (o) { return '<button type="button" class="opt ' + (w.hostType === o[0] ? 'on' : '') + '" data-host="' + o[0] + '">' + I.icon(o[3]) + '<strong>' + o[1] + '</strong><span>' + o[2] + '</span></button>'; }).join('') + '</div>';
          },
          // 1 address
          function () {
            var v = S.venue(w.venueId);
            return '<h1>Where is your spot?</h1><p class="lead">Drivers see your street and walking time. Your exact address is only shared after they book.</p>' +
              '<div class="form-grid"><label class="field span2"><span>Street address</span><input id="wz-addr" value="' + esc(w.address) + '" placeholder="e.g. 1210 E Randol Mill Rd"></label>' +
              '<label class="field"><span>City</span><input id="wz-city" value="' + esc(w.city) + '" placeholder="e.g. Arlington"></label>' +
              '<label class="field"><span>Nearest venue</span><select id="wz-venue"><option value="">Choose a venue…</option>' + D.venues.map(function (x) { return '<option value="' + x.id + '"' + (w.venueId === x.id ? ' selected' : '') + '>' + esc(x.name) + ' (' + esc(x.city) + ')</option>'; }).join('') + '</select></label></div>' +
              '<p class="muted small" id="wz-detect">' + (v ? I.icon('check') + 'Matched to ' + esc(v.name) + '.' : 'Type your city and we\'ll match the nearest venue.') + '</p>' +
              (v ? '<div class="map map-sm" id="wz-map"></div><p class="muted small">Demo: your pin is placed near the venue. Real geocoding would put it at your address.</p>' + CMP.rulesBanner(v) : '');
          },
          // 2 the space
          function () {
            var st = w.spotType || DEF_SPOT[w.hostType] || 'driveway';
            w.spotType = st;
            return '<h1>Tell drivers about the space</h1>' +
              '<div class="field"><span>Spot type</span><div class="chips" id="wz-stype">' + chips('stype', Object.keys(L.spot).map(function (k) { return [k, L.spot[k]]; }), function (k) { return k === st; }) + '</div></div>' +
              '<div class="field"><span>How many cars fit?</span><div class="stepper"><button type="button" id="sp-minus" aria-label="Fewer">−</button><b id="sp-n">' + w.spots + '</b><button type="button" id="sp-plus" aria-label="More">+</button></div></div>' +
              '<div class="field"><span>Amenities</span><div class="chips" id="wz-amen">' + ['ev', 'oversize', 'covered'].map(function (k) { return '<button type="button" class="chip ' + (w.amen[k] ? 'on' : '') + '" data-am="' + k + '">' + I.icon(L.amenIcon[k]) + L.amen[k] + '</button>'; }).join('') + '</div><small class="muted">You\'ll set tailgating and "leave anytime" in House rules.</small></div>' +
              '<label class="field"><span>Listing title</span><input id="wz-title" maxlength="60" value="' + esc(w.title) + '" placeholder="' + esc(suggestTitle()) + '"></label>' +
              '<label class="field"><span>Description</span><textarea id="wz-desc" rows="3" placeholder="' + esc(DESC[st]) + '">' + esc(w.desc) + '</textarea></label>';
          },
          // 3 photos
          function () {
            var d = draftListing(w);
            return '<h1>Add photos</h1><p class="lead">Show the entrance, the space and the walk to the venue. Listings with 3 photos get twice the bookings.</p>' +
              '<div class="photo-grid">' + [0, 1, 2].map(function (i) {
                return i < w.photos ? '<div class="ph-tile filled">' + I.photo(d, i, { key: 'w' + i }) + '<button type="button" class="ph-x" data-rm="' + i + '" aria-label="Remove photo">' + I.icon('x') + '</button></div>'
                  : '<button type="button" class="ph-tile" data-add="' + i + '">' + I.icon('camera') + '<span>' + ['Entrance / street view', 'The space', 'Walk to venue'][i] + '</span><small>Tap to add</small></button>';
              }).join('') + '</div><p class="muted small">Demo: "uploads" use generated illustrations instead of real photos.</p>';
          },
          // 4 availability
          function () {
            var evs = S.upcomingEvents(w.venueId);
            if (w.eventIds === null) w.eventIds = evs.map(function (e) { return e.id; });
            var days = [['1', 'Mon'], ['2', 'Tue'], ['3', 'Wed'], ['4', 'Thu'], ['5', 'Fri'], ['6', 'Sat'], ['0', 'Sun']];
            return '<h1>When can drivers park?</h1><p class="lead">Turn on any mix of event days, hourly windows and monthly parking.</p>' +
              '<div class="avail-block"><label class="avail-head"><span class="switch"><input type="checkbox" id="av-event"' + (w.eventOn ? ' checked' : '') + '><span></span></span><div><strong>Event days</strong><small class="muted">Auto-suggested from events near ' + esc(S.venue(w.venueId).name) + '</small></div></label>' +
                (w.eventOn ? (evs.length ? '<div class="ev-checks">' + evs.map(function (e) {
                  var md = U.monthDay(e.date);
                  return '<label class="ev-opt"><input type="checkbox" data-ev="' + e.id + '"' + (w.eventIds.indexOf(e.id) > -1 ? ' checked' : '') + '><span class="ev-mini"><span>' + md.m + '</span><b>' + md.d + '</b></span><span class="ev-o-txt"><strong>' + esc(e.name) + '</strong><small>' + md.w + ' · ' + U.fmtTime(e.time) + ' · ' + esc(e.cat) + '</small></span><span class="sugg">Suggested</span></label>';
                }).join('') + '</div>' : '<p class="muted">No upcoming events found for this venue.</p>') : '') + '</div>' +
              '<div class="avail-block"><label class="avail-head"><span class="switch"><input type="checkbox" id="av-hourly"' + (w.hourly.on ? ' checked' : '') + '><span></span></span><div><strong>Hourly</strong><small class="muted">Commuters, shoppers and nights out</small></div></label>' +
                (w.hourly.on ? '<div class="chips" id="av-days">' + chips('day', days, function (d) { return w.hourly.days.indexOf(+d) > -1; }) + '</div>' +
                  '<div class="form-grid"><label class="field"><span>From</span><select id="av-from">' + timeOpts(w.hourly.from) + '</select></label><label class="field"><span>To</span><select id="av-to">' + timeOpts(w.hourly.to) + '</select></label></div>' : '') + '</div>' +
              '<div class="avail-block"><label class="avail-head"><span class="switch"><input type="checkbox" id="av-monthly"' + (w.monthly ? ' checked' : '') + '><span></span></span><div><strong>Monthly</strong><small class="muted">One driver, 24/7 access, steady income</small></div></label></div>';
          },
          // 5 pricing
          function () {
            var v = S.venue(w.venueId), h = '<h1>Set your price</h1>';
            var types = [];
            if (w.eventOn && w.eventIds && w.eventIds.length) types.push('event');
            if (w.hourly.on) types.push('hourly');
            if (w.monthly) types.push('monthly');
            types.forEach(function (t) {
              var c = S.comps(w.venueId, t) || { low: t === 'hourly' ? 5 : t === 'monthly' ? 150 : 25, high: t === 'hourly' ? 10 : t === 'monthly' ? 250 : 40, median: t === 'hourly' ? 7 : t === 'monthly' ? 200 : 30, n: 0 };
              if (w.price[t] == null) w.price[t] = c.median;
              var sfx = { event: 'per event', hourly: 'per hour', monthly: 'per month' }[t];
              h += '<div class="price-block"><div class="suggest-banner">' + I.icon('dollar') + '<span>Similar spots near <b>' + esc(v.name) + '</b> go for <b>$' + c.low + '–' + c.high + '</b> ' + sfx + '.' + (c.n ? ' <span class="muted">Based on ' + c.n + ' nearby listings.</span>' : '') + '</span></div>' +
                '<label class="field price-field"><span>' + L.type[t] + ' price</span><div class="money-in"><span>$</span><input type="number" min="1" step="1" data-price="' + t + '" value="' + w.price[t] + '"><em>' + sfx + '</em></div></label>' +
                '<p class="muted small" data-earn="' + t + '"></p></div>';
            });
            return h + '<p class="muted small">Drivers pay a separate ' + Math.round(C.DRIVER_FEE_RATE * 100) + '% service fee. You keep ' + Math.round((1 - C.HOST_FEE_RATE) * 100) + '% of your price.</p>';
          },
          // 6 rules
          function () {
            if (!w.arrival) w.arrival = '';
            return '<h1>House rules</h1><p class="lead">Clear rules mean fewer surprises on game day.</p>' +
              '<div class="check-list">' + RULES.map(function (r) { return '<label class="check-row"><input type="checkbox" data-rule="' + r[0] + '"' + (w.rules[r[0]] ? ' checked' : '') + '><span>' + esc(r[1]) + '</span></label>'; }).join('') + '</div>' +
              '<label class="field"><span>Anything else?</span><input id="wz-custom" value="' + esc(w.customRule) + '" placeholder="e.g. Please don\'t park on the grass strip"></label>' +
              '<div class="field"><span>Cancellation policy</span><div class="opt-grid g3">' + Object.keys(L.cancel).map(function (k) {
                return '<button type="button" class="opt sm ' + (w.cancel === k ? 'on' : '') + '" data-cancel="' + k + '"><strong>' + L.cancel[k].name + '</strong><span>' + L.cancel[k].text + '</span></button>';
              }).join('') + '</div></div>' +
              '<label class="field"><span>Arrival instructions</span><textarea id="wz-arrival" rows="3" placeholder="e.g. Pull all the way up to the orange cone. I\'ll be on the porch with a sign.">' + esc(w.arrival) + '</textarea></label>';
          },
          // 7 attest + review
          function () {
            var d = draftListing(w), v = S.venue(w.venueId);
            d.title = w.title.trim() || suggestTitle();
            var priceTxt = ['event', 'hourly', 'monthly'].filter(function (t) { return d.price[t]; }).map(function (t) { return U.money(d.price[t]) + ' ' + L.unit[t]; }).join(' · ');
            return '<h1>Review and publish</h1>' +
              '<div class="review-grid"><div class="preview">' + CMP.card(d, { type: ['event', 'hourly', 'monthly'].filter(function (t) { return d.price[t]; })[0] }).replace('<a class="lcard"', '<div class="lcard"').replace(/<\/a>$/, '</div>') + '</div>' +
              '<dl class="summary">' +
                '<div><dt>Host</dt><dd>' + L.host[w.hostType] + '</dd></div>' +
                '<div><dt>Address</dt><dd>' + esc(w.address) + ', ' + esc(w.city || v.city) + '</dd></div>' +
                '<div><dt>Near</dt><dd>' + esc(v.name) + ' · ' + S.walk(d).mins + ' min walk</dd></div>' +
                '<div><dt>Space</dt><dd>' + w.spots + ' × ' + L.spot[w.spotType] + '</dd></div>' +
                '<div><dt>Availability</dt><dd>' + [w.eventOn && w.eventIds.length ? w.eventIds.length + ' event days' : '', w.hourly.on ? 'Hourly ' + U.fmtTime(w.hourly.from) + '–' + U.fmtTime(w.hourly.to) : '', w.monthly ? 'Monthly' : ''].filter(Boolean).join(' · ') + '</dd></div>' +
                '<div><dt>Price</dt><dd>' + priceTxt + '</dd></div>' +
                '<div><dt>Cancellation</dt><dd>' + L.cancel[w.cancel].name + '</dd></div>' +
              '</dl></div>' +
              CMP.rulesBanner(v) +
              '<div class="attest ' + (w.attest ? 'done' : '') + '">' +
                '<label class="check-row big"><input type="checkbox" id="wz-attest"' + (w.attest ? ' checked' : '') + '><span><strong>I have the right to rent this space (HOA/lease/city rules).</strong><small>I own or control this property, my HOA, lease or landlord allows paid parking, and I\'ll follow local parking and event-day rules. False attestations remove the listing. <span class="req">Required</span></small></span></label>' +
                '<label class="check-row"><input type="checkbox" id="wz-terms"' + (w.terms ? ' checked' : '') + '><span>I agree to the Host Terms and the host guarantee (demo). <span class="req">Required</span></span></label>' +
              '</div>' +
              '<p class="muted small">' + I.icon('shield') + 'After publishing we verify your ID and address. Your listing shows "Verification pending" until that\'s done.</p>';
          }
        ];

        function suggestTitle() {
          var v = S.venue(w.venueId), st = w.spotType || DEF_SPOT[w.hostType] || 'driveway';
          var near = v ? ' near ' + v.name.replace('GEHA Field at ', '').replace('Downtown Austin — ', '') : '';
          return ({ driveway: 'Driveway', yard: 'Yard parking', church: 'Church lot', business: 'Business lot', school: 'School lot' })[st] + near;
        }
        function timeOpts(sel) {
          var o = ''; for (var h = 5; h <= 23; h++) { var t = String(h).padStart(2, '0') + ':00'; o += '<option value="' + t + '"' + (t === sel ? ' selected' : '') + '>' + U.fmtTime(t) + '</option>'; }
          return o;
        }

        function validate() {
          switch (w.step) {
            case 0: return w.hostType ? '' : 'Pick who\'s hosting.';
            case 1: return w.address.trim().length < 4 ? 'Enter your street address.' : !w.venueId ? 'Choose the nearest venue.' : '';
            case 3: return w.photos < 1 ? 'Add at least one photo.' : '';
            case 4: return (w.eventOn && w.eventIds.length) || w.hourly.on || w.monthly ? (w.hourly.on && !w.hourly.days.length ? 'Pick at least one day for hourly parking.' : '') : 'Turn on at least one way to book.';
            case 5:
              var bad = ['event', 'hourly', 'monthly'].filter(function (t) { return ((t === 'event' && w.eventOn && w.eventIds.length) || (t === 'hourly' && w.hourly.on) || (t === 'monthly' && w.monthly)) && !(+w.price[t] > 0); });
              return bad.length ? 'Enter a price for ' + L.type[bad[0]].toLowerCase() + ' parking.' : '';
            case 7: return !w.attest ? 'Please confirm you have the right to rent this space.' : !w.terms ? 'Please accept the Host Terms.' : '';
          }
          return '';
        }

        function draw() {
          saveWz(w);
          U.$('#wz-fill', root).style.width = ((w.step + 1) / STEPS.length * 100) + '%';
          U.$('#wz-steps', root).innerHTML = '<span>Step ' + (w.step + 1) + ' of ' + STEPS.length + '</span><b>' + STEPS[w.step] + '</b>';
          body.innerHTML = views[w.step]();
          U.$('#wz-back', root).style.visibility = w.step ? 'visible' : 'hidden';
          var next = U.$('#wz-next', root);
          next.innerHTML = w.step === STEPS.length - 1 ? I.icon('check') + 'Publish listing' : 'Next ' + I.icon('arrow');
          next.disabled = w.step === STEPS.length - 1 && !(w.attest && w.terms);
          bind();
        }

        function bind() {
          if (wzMap) { wzMap.destroy(); wzMap = null; }
          U.$$('[data-host]', body).forEach(function (b) { b.addEventListener('click', function () { if (w.hostType !== b.getAttribute('data-host')) { w.hostType = b.getAttribute('data-host'); w.spotType = ''; } draw(); }); });
          // address
          var addr = U.$('#wz-addr', body), city = U.$('#wz-city', body), ven = U.$('#wz-venue', body);
          if (addr) {
            var detect = function () {
              w.address = addr.value; w.city = city.value;
              var hits = PS.matchVenues(city.value) || [];
              if (!hits.length) hits = PS.matchVenues(addr.value) || [];
              if (hits.length === 1 && w.venueId !== hits[0].id) {
                w.venueId = hits[0].id; w.eventIds = null; w.price = { event: null, hourly: null, monthly: null }; placeNear(w);
                var activeId = document.activeElement === city ? '#wz-city' : '#wz-addr';
                draw();
                var el = U.$(activeId, body); el.focus();
                try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {}
              }
              saveWz(w);
            };
            addr.addEventListener('input', detect); city.addEventListener('input', detect);
            addr.addEventListener('change', function () { placeNear(w); saveWz(w); });
            ven.addEventListener('change', function () { w.venueId = ven.value; w.eventIds = null; w.price = { event: null, hourly: null, monthly: null }; placeNear(w); draw(); });
            var mEl = U.$('#wz-map', body);
            if (mEl) {
              if (w.lat == null) placeNear(w);
              var v = S.venue(w.venueId);
              wzMap = PS.map.create(mEl, [{ id: 'new', lat: w.lat, lng: w.lng, label: 'Your spot', kind: 'new' }, { id: 'venue-' + v.id, lat: v.lat, lng: v.lng, label: v.name.replace('GEHA Field at ', '').replace('Downtown Austin — ', ''), kind: 'venue' }], { line: [[w.lat, w.lng], [v.lat, v.lng]] });
            }
          }
          // space
          U.$$('[data-stype]', body).forEach(function (b) { b.addEventListener('click', function () { w.spotType = b.getAttribute('data-stype'); draw(); }); });
          var minus = U.$('#sp-minus', body);
          if (minus) {
            minus.addEventListener('click', function () { w.spots = Math.max(1, w.spots - 1); U.$('#sp-n', body).textContent = w.spots; saveWz(w); });
            U.$('#sp-plus', body).addEventListener('click', function () { w.spots = Math.min(200, w.spots + 1); U.$('#sp-n', body).textContent = w.spots; saveWz(w); });
            U.$('#wz-title', body).addEventListener('input', function (e) { w.title = e.target.value; saveWz(w); });
            U.$('#wz-desc', body).addEventListener('input', function (e) { w.desc = e.target.value; saveWz(w); });
          }
          U.$$('[data-am]', body).forEach(function (b) { b.addEventListener('click', function () { var k = b.getAttribute('data-am'); w.amen[k] = !w.amen[k]; b.classList.toggle('on'); saveWz(w); }); });
          // photos
          U.$$('[data-add]', body).forEach(function (b) {
            b.addEventListener('click', function () {
              b.innerHTML = '<span class="spinner dark"></span><span>Uploading…</span>';
              setTimeout(function () { w.photos = Math.min(3, w.photos + 1); draw(); }, 500);
            });
          });
          U.$$('[data-rm]', body).forEach(function (b) { b.addEventListener('click', function () { w.photos = Math.max(0, w.photos - 1); draw(); }); });
          // availability
          var avE = U.$('#av-event', body);
          if (avE) {
            avE.addEventListener('change', function () { w.eventOn = avE.checked; draw(); });
            U.$('#av-hourly', body).addEventListener('change', function (e) { w.hourly.on = e.target.checked; draw(); });
            U.$('#av-monthly', body).addEventListener('change', function (e) { w.monthly = e.target.checked; saveWz(w); });
            U.$$('[data-ev]', body).forEach(function (c) { c.addEventListener('change', function () { var id = c.getAttribute('data-ev'), i = w.eventIds.indexOf(id); if (c.checked && i < 0) w.eventIds.push(id); if (!c.checked && i > -1) w.eventIds.splice(i, 1); saveWz(w); }); });
            U.$$('[data-day]', body).forEach(function (b) { b.addEventListener('click', function () { var d = +b.getAttribute('data-day'), i = w.hourly.days.indexOf(d); if (i > -1) w.hourly.days.splice(i, 1); else w.hourly.days.push(d); b.classList.toggle('on'); saveWz(w); }); });
            var f = U.$('#av-from', body); if (f) { f.addEventListener('change', function () { w.hourly.from = f.value; saveWz(w); }); U.$('#av-to', body).addEventListener('change', function (e) { w.hourly.to = e.target.value; saveWz(w); }); }
          }
          // pricing
          function earn() {
            U.$$('[data-earn]', body).forEach(function (p) {
              var t = p.getAttribute('data-earn'), pr = +w.price[t] || 0, net = pr * (1 - C.HOST_FEE_RATE);
              p.innerHTML = t === 'event' ? 'You earn <b>' + U.money2(net) + '</b> per car. If all ' + w.spots + ' space' + (w.spots > 1 ? 's' : '') + ' fill for your ' + w.eventIds.length + ' event day' + (w.eventIds.length === 1 ? '' : 's') + ': <b>' + U.money(Math.round(net * w.spots * w.eventIds.length)) + '</b>.'
                : t === 'hourly' ? 'You earn <b>' + U.money2(net) + '</b> per hour per space.' : 'You earn <b>' + U.money2(net) + '</b> per month per space.';
            });
          }
          U.$$('[data-price]', body).forEach(function (i) { i.addEventListener('input', function () { w.price[i.getAttribute('data-price')] = i.value === '' ? '' : +i.value; earn(); saveWz(w); }); });
          earn();
          // rules
          U.$$('[data-rule]', body).forEach(function (c) { c.addEventListener('change', function () { w.rules[c.getAttribute('data-rule')] = c.checked; saveWz(w); }); });
          var cr = U.$('#wz-custom', body); if (cr) cr.addEventListener('input', function () { w.customRule = cr.value; saveWz(w); });
          U.$$('[data-cancel]', body).forEach(function (b) { b.addEventListener('click', function () { w.cancel = b.getAttribute('data-cancel'); draw(); }); });
          var ar = U.$('#wz-arrival', body); if (ar) ar.addEventListener('input', function () { w.arrival = ar.value; saveWz(w); });
          // attest
          var at = U.$('#wz-attest', body);
          if (at) {
            var upd = function () { w.attest = at.checked; w.terms = U.$('#wz-terms', body).checked; U.$('.attest', body).classList.toggle('done', w.attest); U.$('#wz-next', root).disabled = !(w.attest && w.terms); saveWz(w); };
            at.addEventListener('change', upd); U.$('#wz-terms', body).addEventListener('change', upd);
          }
        }

        function publish() {
          var d = draftListing(w);
          var rules = RULES.filter(function (r) { return w.rules[r[0]]; }).map(function (r) { return r[1].replace('drivers won\'t', 'you won\'t') + '.'; });
          if (!w.rules.tailgate) rules.push('No tailgating or grills on the property.');
          if (w.customRule.trim()) rules.push(w.customRule.trim());
          var l = Object.assign(d, {
            id: 'my-' + S.rand(5).toLowerCase(),
            title: w.title.trim() || suggestTitle(),
            description: w.desc.trim() || DESC[w.spotType],
            arrival: w.arrival.trim() || 'Pull in and park in an open numbered space. Show your QR pass or tell the host your plate.',
            rules: rules,
            hourlyWindow: w.hourly.on ? { days: w.hourly.days, from: w.hourly.from, to: w.hourly.to } : null,
            eventIds: w.eventOn ? w.eventIds.slice() : [],
            createdBy: 'me', createdAt: new Date().toISOString()
          });
          S.addListing(l);
          sessionStorage.removeItem(WZ_KEY);
          UI.toast('Listing published. Verification is pending (demo).');
          R.go('#/spot/' + l.id + '?created=1');
        }

        U.$('#wz-next', root).addEventListener('click', function () {
          var err = validate();
          if (err) { UI.toast(err, 'warn'); return; }
          if (w.step === STEPS.length - 1) return publish();
          w.step++; draw(); window.scrollTo(0, 0);
        });
        U.$('#wz-back', root).addEventListener('click', function () { if (w.step) { w.step--; draw(); window.scrollTo(0, 0); } });
        U.$('#wz-restart', root).addEventListener('click', function () { w = freshWizard(); sessionStorage.removeItem(WZ_KEY); draw(); });
        draw();
      }
    };
  });
})();
