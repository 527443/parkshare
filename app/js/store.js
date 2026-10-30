/* localStorage-backed state + domain helpers. */
(function () {
  var C = PS.config, D = PS.data;
  var state = null;

  function load() {
    try {
      var raw = localStorage.getItem(C.STORAGE_KEY);
      if (raw) { state = JSON.parse(raw); if (state && state.version === 1) return; }
    } catch (e) { /* storage unavailable or corrupt: fall through to seed */ }
    state = PS.seed();
    save();
  }
  function save() {
    try { localStorage.setItem(C.STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* private mode: keep in memory */ }
  }
  function reset() {
    try { localStorage.removeItem(C.STORAGE_KEY); } catch (e) {}
    state = PS.seed();
    save();
  }

  function rand(n) {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
    for (var i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function haversine(lat1, lng1, lat2, lng2) {
    var R = 6371000, toR = Math.PI / 180;
    var dLat = (lat2 - lat1) * toR, dLng = (lng2 - lng1) * toR;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  var S = PS.store = {
    load: load, save: save, reset: reset, rand: rand,
    get state() { return state; },

    venue: function (id) { return D.venueById[id]; },
    event: function (id) { return D.events.filter(function (e) { return e.id === id; })[0]; },
    listing: function (id) { return state.listings.filter(function (l) { return l.id === id; })[0]; },
    booking: function (id) { return state.bookings.filter(function (b) { return b.id === id; })[0]; },

    upcomingEvents: function (venueId) {
      return D.events.filter(function (e) { return e.date >= C.TODAY && (!venueId || e.venue === venueId); })
        .sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });
    },

    // Walking distance (straight line x 1.25 street factor, 80 m/min pace)
    walk: function (l) {
      var v = D.venueById[l.venueId];
      var m = haversine(l.lat, l.lng, v.lat, v.lng) * 1.25;
      return { miles: m / 1609.34, mins: Math.max(2, Math.round(m / 80)) };
    },
    haversine: haversine,

    spotsLeft: function (l, eventId) {
      var used = state.bookings.filter(function (b) { return b.listingId === l.id && b.eventId === eventId && b.status !== 'cancelled'; }).length;
      // Seeded "already sold" demand so popular spots feel real
      var demand = eventId ? (l.photoSeed + eventId.charCodeAt(4)) % Math.max(1, Math.ceil(l.spots * 0.6)) : 0;
      if (l.createdBy !== 'seed') demand = 0;
      return Math.max(0, l.spots - used - demand);
    },

    reviews: function (listingId) { return state.reviews[listingId] || []; },

    fee: function (price) { return Math.max(C.DRIVER_FEE_MIN, +(price * C.DRIVER_FEE_RATE).toFixed(2)); },

    quote: function (l, opts) {
      var price = 0, label = '';
      if (opts.type === 'event') { price = l.price.event; label = 'Event-day parking'; }
      else if (opts.type === 'hourly') { price = l.price.hourly * (opts.hours || 1); label = '$' + l.price.hourly + ' × ' + (opts.hours || 1) + ' hr'; }
      else if (opts.type === 'monthly') { price = l.price.monthly; label = 'Monthly parking (30 days)'; }
      price = +price.toFixed(2);
      var fee = S.fee(price);
      return { price: price, label: label, fee: fee, total: +(price + fee).toFixed(2), hostPayout: +(price * (1 - C.HOST_FEE_RATE)).toFixed(2) };
    },

    createBooking: function (l, opts, driver) {
      var q = S.quote(l, opts);
      var bk = {
        id: 'bk-' + Date.now().toString(36), code: 'PS-' + rand(5), listingId: l.id,
        type: opts.type, eventId: opts.type === 'event' ? opts.eventId : null,
        date: opts.date, start: opts.start, hours: opts.hours || null,
        price: q.price, fee: q.fee, total: q.total, hostPayout: q.hostPayout,
        status: 'confirmed', mine: true, reviewed: false, createdAt: new Date().toISOString(),
        driver: driver
      };
      state.bookings.unshift(bk);
      save();
      return bk;
    },

    // Refund according to the listing's cancellation policy, relative to demo "today"
    refundFor: function (bk) {
      var l = S.listing(bk.listingId);
      var days = PS.util.daysBetween(C.TODAY, bk.date);
      var pct = 1;
      if (l.cancel === 'flexible') pct = days >= 1 ? 1 : 0.5;
      else if (l.cancel === 'moderate') pct = days >= 3 ? 1 : 0.5;
      else if (l.cancel === 'strict') pct = days >= 7 ? 0.5 : 0;
      return { pct: pct, amount: +(bk.total * pct).toFixed(2) };
    },

    hostListings: function () { return state.listings.filter(function (l) { return l.host.id === 'me'; }); },
    hostBookings: function () {
      var ids = S.hostListings().map(function (l) { return l.id; });
      return state.bookings.filter(function (b) { return ids.indexOf(b.listingId) > -1; });
    },

    addReview: function (listingId, review) {
      (state.reviews[listingId] = state.reviews[listingId] || []).unshift(review);
      var l = S.listing(listingId);
      if (l) { l.rating = +(((l.rating * l.reviewCount) + review.rating) / (l.reviewCount + 1)).toFixed(2); l.reviewCount++; }
      save();
    },

    addReport: function (r) {
      r.id = 'R-' + rand(4);
      r.createdAt = new Date().toISOString();
      state.reports.unshift(r);
      save();
      return r;
    },

    addListing: function (l) { state.listings.unshift(l); state.reviews[l.id] = []; save(); return l; },

    // Price comps near a venue for the host pricing step
    comps: function (venueId, type) {
      var arr = state.listings.filter(function (l) { return l.venueId === venueId && l.price[type]; })
        .map(function (l) { return l.price[type]; }).sort(function (a, b) { return a - b; });
      if (!arr.length) return null;
      function pct(p) { return arr[Math.min(arr.length - 1, Math.floor(p * (arr.length - 1) + 0.5))]; }
      var step = type === 'hourly' ? 1 : 5;
      function r(x) { return Math.round(x / step) * step; }
      return { low: r(pct(0.2)), high: r(pct(0.8)), median: r(pct(0.5)), n: arr.length };
    }
  };
})();
