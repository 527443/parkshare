/* Seed data: venues, events, ~40 listings, reviews, bookings, payouts.
   All data is fictional sample data. Venue coordinates are approximate real locations. */
(function () {
  var C = PS.config;

  var venues = [
    { id: 'att', name: 'AT&T Stadium', city: 'Arlington', state: 'TX', lat: 32.7473, lng: -97.0945, kind: 'Stadium',
      aliases: ['att', 'at&t', 'cowboys', 'arlington', 'dallas', 'dfw', 'texas', 'tx'],
      rules: { level: 'check', text: 'Arlington restricts selling yard parking and tows from event-day street zones. Church, school and business lots are the safest listings here; homeowners should confirm City of Arlington code and their HOA before listing.' } },
    { id: 'lam', name: 'Lambeau Field', city: 'Green Bay', state: 'WI', lat: 44.5013, lng: -88.0622, kind: 'Stadium',
      aliases: ['lambeau', 'packers', 'green bay', 'wisconsin', 'wi'],
      rules: { level: 'ok', text: 'Yard and driveway parking near Lambeau is a long-standing game-day tradition. Keep sidewalks clear and follow posted village/city game-day rules.' } },
    { id: 'arr', name: 'GEHA Field at Arrowhead', city: 'Kansas City', state: 'MO', lat: 39.0489, lng: -94.4839, kind: 'Stadium',
      aliases: ['arrowhead', 'chiefs', 'kansas city', 'kc', 'missouri', 'mo', 'geha'],
      rules: { level: 'ok', text: 'Private-lot and residential parking is common around the Truman Sports Complex. Note that stadium lots require a separate stadium pass; this spot is off-complex.' } },
    { id: 'wri', name: 'Wrigley Field', city: 'Chicago', state: 'IL', lat: 41.9484, lng: -87.6553, kind: 'Ballpark',
      aliases: ['wrigley', 'cubs', 'chicago', 'wrigleyville', 'lakeview', 'illinois', 'il'],
      rules: { level: 'check', text: 'Much of Lakeview is in residential permit zones on event days. Off-street spaces are fine to share, but check Chicago rules and your condo/HOA bylaws.' } },
    { id: 'rose', name: 'Rose Bowl', city: 'Pasadena', state: 'CA', lat: 34.1613, lng: -118.1676, kind: 'Stadium',
      aliases: ['rose bowl', 'rose', 'pasadena', 'ucla', 'los angeles', 'la', 'california', 'ca'],
      rules: { level: 'check', text: 'Pasadena enforces event-day traffic and parking restrictions around the Arroyo Seco. Residential hosting is common, but confirm local rules for your street.' } },
    { id: 'msg', name: 'Madison Square Garden', city: 'New York', state: 'NY', lat: 40.7505, lng: -73.9934, kind: 'Arena',
      aliases: ['msg', 'madison square garden', 'garden', 'knicks', 'rangers', 'new york', 'nyc', 'manhattan', 'ny'],
      rules: { level: 'check', text: 'NYC requires licenses for commercial garages and lots. Spaces here are offered by licensed operators and institutions; individuals should check NYC rules first.' } },
    { id: 'osu', name: 'Ohio Stadium', city: 'Columbus', state: 'OH', lat: 40.0017, lng: -83.0197, kind: 'Stadium',
      aliases: ['ohio stadium', 'the shoe', 'shoe', 'buckeyes', 'ohio state', 'osu', 'columbus', 'ohio', 'oh'],
      rules: { level: 'ok', text: 'Driveway and yard parking around campus is common on game days. Keep vehicles off tree lawns where posted and follow City of Columbus event rules.' } },
    { id: 'atx', name: 'Downtown Austin — 6th Street', city: 'Austin', state: 'TX', lat: 30.2671, lng: -97.7397, kind: 'Downtown',
      aliases: ['austin', '6th street', 'sixth street', '6th st', 'dirty sixth', 'downtown austin', 'red river', 'texas', 'tx'],
      rules: { level: 'check', text: 'Austin has residential parking permit areas near downtown. Off-street spaces can usually be shared, but check City of Austin rules and your lease.' } }
  ];

  var events = [
    { id: 'ev-10', venue: 'atx', name: 'Live on 6th: Saturday Night', cat: 'Live music', date: '2026-11-07', time: '20:00' },
    { id: 'ev-04', venue: 'arr', name: 'Chiefs vs. Raiders', cat: 'NFL', date: '2026-11-15', time: '12:00' },
    { id: 'ev-07', venue: 'msg', name: 'Knicks vs. Celtics', cat: 'NBA', date: '2026-11-20', time: '19:30' },
    { id: 'ev-06', venue: 'rose', name: 'UCLA vs. USC', cat: 'College football', date: '2026-11-21', time: '12:30' },
    { id: 'ev-12', venue: 'lam', name: 'Packers vs. Vikings', cat: 'NFL', date: '2026-11-22', time: '15:25' },
    { id: 'ev-01', venue: 'att', name: 'Cowboys vs. Commanders', cat: 'NFL · Thanksgiving', date: '2026-11-26', time: '15:30' },
    { id: 'ev-09', venue: 'osu', name: 'Ohio State vs. Michigan', cat: 'College football', date: '2026-11-28', time: '12:00' },
    { id: 'ev-02', venue: 'att', name: 'Big 12 Championship', cat: 'College football', date: '2026-12-05', time: '11:00' },
    { id: 'ev-05', venue: 'wri', name: 'Wrigleyville Winter Market', cat: 'Festival', date: '2026-12-12', time: '16:00' },
    { id: 'ev-03', venue: 'lam', name: 'Packers vs. Bears', cat: 'NFL', date: '2026-12-13', time: '12:00' },
    { id: 'ev-08', venue: 'msg', name: "New Year's Eve Concert", cat: 'Concert', date: '2026-12-31', time: '20:00' },
    { id: 'ev-11', venue: 'atx', name: "New Year's Eve on 6th", cat: 'Street party', date: '2026-12-31', time: '21:00' }
  ];

  // [id, venue, title, street, hostName, hostType, spotType, dLat, dLng, spots, event$, hourly$, monthly$, amenities, rating, reviewCount, verified, cancel]
  // amenities: E=EV charging, O=oversize OK, C=covered, T=tailgating allowed, L=leave anytime (not blocked in)
  var rows = [
    ['att-01', 'att', 'Wide driveway off Randol Mill', '1100 block E Randol Mill Rd', 'Maria G.', 'home', 'driveway', 0.0085, 0.0030, 3, 35, null, null, 'TL', 4.9, 128, 1, 'moderate'],
    ['att-02', 'att', 'Corner-lot driveway, 2 cars', '1300 block Baird Farm Rd', 'Jordan R.', 'home', 'driveway', 0.0110, -0.0040, 2, 30, 6, null, 'L', 4.8, 42, 1, 'flexible'],
    ['att-03', 'att', 'Shady yard parking + tailgate space', '700 block N Collins St', 'Darnell W.', 'home', 'yard', -0.0060, 0.0095, 8, 25, null, null, 'TOL', 4.7, 211, 1, 'moderate'],
    ['att-04', 'att', 'Grace Fellowship church lot', '1500 block Stadium Dr', 'Grace Fellowship', 'church', 'church', -0.0095, -0.0080, 40, 30, null, 120, 'OLT', 4.8, 356, 1, 'flexible'],
    ['att-05', 'att', 'Gated lot behind auto shop', '600 block Lamar Blvd', 'Lone Star Tire & Auto', 'business', 'business', 0.0050, -0.0110, 12, 40, 8, 180, 'EOL', 4.6, 77, 1, 'moderate'],
    ['att-06', 'att', 'Backyard lawn, room for trucks', '900 block E Abram St', 'Jordan R.', 'home', 'yard', -0.0120, 0.0020, 6, 25, null, null, 'OT', 4.9, 18, 1, 'flexible'],
    ['att-07', 'att', 'Covered carport with EV charger', '1600 block Ballpark Way', 'Priya S.', 'home', 'driveway', 0.0130, 0.0105, 1, 45, 9, null, 'ECL', 5.0, 23, 1, 'strict'],
    ['att-08', 'att', 'Westside Booster Club school lot', '2000 block W Division St', 'Westside Booster Club', 'school', 'school', -0.0035, -0.0150, 60, 28, null, null, 'OLT', 4.5, 94, 1, 'flexible'],

    ['lam-01', 'lam', 'Front-yard parking on Oneida', '1300 block S Oneida St', 'Karen & Dale B.', 'home', 'yard', 0.0040, 0.0060, 10, 40, null, null, 'TOL', 4.9, 412, 1, 'moderate'],
    ['lam-02', 'lam', 'Driveway two blocks from the Atrium', '1200 block Shadow Ln', 'Tom K.', 'home', 'driveway', -0.0050, 0.0045, 2, 50, null, null, 'TL', 4.8, 96, 1, 'moderate'],
    ['lam-03', 'lam', 'St. Agnes parish lot', '1400 block Ridge Rd', 'St. Agnes Parish', 'church', 'church', 0.0095, -0.0060, 50, 35, null, null, 'TOL', 4.8, 289, 1, 'flexible'],
    ['lam-04', 'lam', 'Big backyard, RVs welcome', '1700 block Valley View Rd', 'Gary P.', 'home', 'yard', -0.0110, -0.0070, 8, 45, null, null, 'TO', 4.6, 133, 0, 'moderate'],
    ['lam-05', 'lam', 'Frozen Tundra Tap lot', '1800 block Lombardi Ave', 'Frozen Tundra Tap', 'business', 'business', 0.0020, -0.0115, 25, 40, null, null, 'TOL', 4.7, 198, 1, 'strict'],
    ['lam-06', 'lam', 'Covered garage stall', '1100 block Marlee Ln', 'Linda M.', 'home', 'driveway', 0.0130, 0.0110, 1, 60, null, null, 'CL', 5.0, 31, 1, 'strict'],

    ['arr-01', 'arr', 'Business lot on Blue Ridge Cutoff', '4000 block Blue Ridge Cutoff', 'Heartland Equipment Rental', 'business', 'business', 0.0060, 0.0085, 30, 30, null, null, 'TOL', 4.6, 141, 1, 'moderate'],
    ['arr-02', 'arr', 'Church lot, tailgating welcome', '8800 block E 40th St', 'Raytown Hills Community Church', 'church', 'church', -0.0080, 0.0110, 45, 25, null, null, 'TOL', 4.8, 203, 1, 'flexible'],
    ['arr-03', 'arr', 'Driveway with an easy exit to I-70', '3600 block Lee\'s Summit Rd', 'Marcus J.', 'home', 'driveway', 0.0105, -0.0060, 2, 35, null, null, 'L', 4.7, 58, 1, 'moderate'],
    ['arr-04', 'arr', 'Grass yard, oversize OK', '4300 block Sterling Ave', 'Debbie H.', 'home', 'yard', -0.0120, -0.0090, 6, 25, null, null, 'OT', 4.5, 87, 0, 'flexible'],
    ['arr-05', 'arr', 'Covered spot + Level 2 EV', '3900 block Ozark Rd', 'Andre T.', 'home', 'driveway', 0.0150, 0.0040, 1, 40, null, null, 'ECL', 4.9, 19, 1, 'strict'],

    ['wri-01', 'wri', 'Alley garage pad on Kenmore', '3700 block N Kenmore Ave', 'Erin O.', 'home', 'driveway', 0.0035, -0.0030, 1, 65, 12, 320, 'L', 4.9, 176, 1, 'moderate'],
    ['wri-02', 'wri', 'Two-car pad off Seminary', '3500 block N Seminary Ave', 'Mike D.', 'home', 'driveway', -0.0045, -0.0060, 2, 55, 10, 280, '', 4.7, 88, 1, 'moderate'],
    ['wri-03', 'wri', 'Addison Street Fellowship lot', '900 block W Addison St', 'Addison Street Fellowship', 'church', 'church', -0.0070, 0.0045, 20, 45, 8, null, 'OL', 4.8, 154, 1, 'flexible'],
    ['wri-04', 'wri', 'Heated garage with EV charging', '3800 block N Clark St', 'Clark St. Auto Spa', 'business', 'business', 0.0080, 0.0035, 8, 75, 14, 450, 'ECL', 4.8, 63, 1, 'strict'],
    ['wri-05', 'wri', 'Lakeview Academy lot (game days)', '4000 block N Sheffield Ave', 'Lakeview Academy PTO', 'school', 'school', 0.0120, -0.0085, 35, 40, null, null, 'OL', 4.6, 101, 1, 'flexible'],

    ['rose-01', 'rose', 'Arroyo-view driveway', '1000 block Arroyo Blvd', 'Helen C.', 'home', 'driveway', 0.0090, 0.0080, 2, 50, null, null, 'L', 4.9, 64, 1, 'moderate'],
    ['rose-02', 'rose', 'Linda Vista front yard', '800 block Linda Vista Ave', 'Rafael M.', 'home', 'yard', -0.0060, -0.0070, 5, 40, null, null, 'TO', 4.7, 110, 1, 'moderate'],
    ['rose-03', 'rose', 'Church lot near Seco St', '1100 block Seco St', 'Arroyo Seco Community Church', 'church', 'church', 0.0130, 0.0020, 30, 35, null, null, 'OTL', 4.8, 177, 1, 'flexible'],
    ['rose-04', 'rose', 'Covered driveway with EV', '600 block Rosemont Ave', 'Grace L.', 'home', 'driveway', -0.0100, 0.0110, 1, 60, null, null, 'ECL', 5.0, 22, 1, 'strict'],
    ['rose-05', 'rose', 'Linda Vista Prep school lot', '1200 block W Washington Blvd', 'Linda Vista Prep Boosters', 'school', 'school', 0.0160, -0.0050, 50, 45, null, null, 'OL', 4.6, 88, 1, 'flexible'],

    ['msg-01', 'msg', 'Reserved garage space on 31st St', '300 block W 31st St', 'Midtown Park & Lock', 'business', 'business', 0.0025, 0.0030, 15, 55, 18, 595, 'CEL', 4.6, 302, 1, 'strict'],
    ['msg-02', 'msg', 'Chelsea Hope Church courtyard lot', '300 block W 28th St', 'Chelsea Hope Church', 'church', 'church', -0.0045, -0.0040, 6, 45, 15, null, 'L', 4.8, 71, 1, 'moderate'],
    ['msg-03', 'msg', 'Covered spot at the Hudson Yards edge', '500 block W 33rd St', 'Hudson Yard Garage Co.', 'business', 'business', 0.0040, -0.0075, 10, 50, 16, 525, 'COL', 4.5, 138, 1, 'moderate'],

    ['osu-01', 'osu', 'Lane Ave driveway, short walk to the Shoe', '200 block W Lane Ave', 'Beth A.', 'home', 'driveway', 0.0070, 0.0050, 3, 45, null, null, 'TL', 4.8, 167, 1, 'moderate'],
    ['osu-02', 'osu', 'Tuttle Park yard parking', '2300 block Tuttle Park Pl', 'Jordan R.', 'home', 'yard', -0.0030, -0.0085, 6, 40, null, null, 'TO', 4.7, 51, 1, 'flexible'],
    ['osu-03', 'osu', 'Neil Avenue Fellowship lot', '2100 block Neil Ave', 'Neil Avenue Fellowship', 'church', 'church', -0.0085, 0.0095, 35, 35, null, null, 'TOL', 4.9, 238, 1, 'flexible'],
    ['osu-04', 'osu', 'Gated business lot on Kinnear Rd', '1200 block Kinnear Rd', 'Buckeye Print & Ship', 'business', 'business', 0.0050, -0.0140, 40, 30, 6, 160, 'OLE', 4.5, 95, 1, 'moderate'],
    ['osu-05', 'osu', 'Student-house driveway', '100 block E Woodruff Ave', 'Tyler & roommates', 'home', 'driveway', -0.0110, 0.0040, 2, 50, null, null, '', 4.4, 39, 0, 'moderate'],

    ['atx-01', 'atx', 'Gated lot off Red River', '700 block Red River St', 'Red River Print Shop', 'business', 'business', 0.0020, 0.0045, 20, 25, 7, 210, 'OLE', 4.6, 188, 1, 'moderate'],
    ['atx-02', 'atx', 'East 7th driveway, walk to 6th', '1100 block E 7th St', 'Sofia R.', 'home', 'driveway', 0.0035, 0.0090, 2, 20, 5, 150, 'L', 4.8, 57, 1, 'flexible'],
    ['atx-03', 'atx', 'Congress Avenue Fellowship lot', '400 block E 8th St', 'Congress Avenue Fellowship', 'church', 'church', 0.0060, -0.0030, 25, 22, 6, null, 'L', 4.7, 99, 1, 'flexible']
  ];

  var SPOT_DESC = {
    driveway: 'A private driveway at a single-family home. Your spot is marked with a numbered cone; the host is usually outside on event days to wave you in.',
    yard: 'Mowed, level grass parking in a fenced yard. Spaces are staked and numbered, with room to open a tailgate where allowed.',
    church: 'A paved church parking lot with painted stalls and lighting. Volunteers staff the entrance on event days; proceeds support the congregation\'s community programs.',
    business: 'A paved business lot available after hours and on event days. Gated or attended, with painted stalls and security lighting.',
    school: 'A paved school lot with painted stalls, open on weekends and event days only. Proceeds support the booster club and student activities.'
  };

  var ARRIVAL = {
    driveway: 'Pull all the way up the driveway to the cone with your space number. If the host isn\'t outside, text them through the app and park in the numbered space.',
    yard: 'Enter through the open gate and follow the orange flags. A host will check your QR code or plate and point you to a staked space.',
    church: 'Use the main lot entrance and show your QR code to the volunteer at the gate. Park in any open stall in the guest section.',
    business: 'Pull up to the gate and show your QR code or say your plate number. Park in any open stall marked "ParkShare / Event".',
    school: 'Enter from the side street, not the bus loop. Show your QR code to the booster volunteer and park in any open painted stall.'
  };

  function amenSet(s) {
    return { ev: s.indexOf('E') > -1, oversize: s.indexOf('O') > -1, covered: s.indexOf('C') > -1, tailgate: s.indexOf('T') > -1, leave: s.indexOf('L') > -1 };
  }

  function rulesFor(spotType, am) {
    var r = [];
    r.push(am.leave ? 'Leave anytime: you won\'t be blocked in.' : 'Stacked parking: plan to stay until the host releases the row (usually 30 min after the event).');
    r.push(am.tailgate ? 'Tailgating allowed in your space. Grills must stay 10 ft from buildings.' : 'No tailgating or grills on the property.');
    if (spotType === 'church' || spotType === 'school') r.push('No alcohol on church/school property.');
    r.push('No overnight parking unless you booked a monthly spot.');
    if (!am.oversize) r.push('Standard vehicles only (no dually trucks, trailers or RVs).');
    r.push('Take your trash with you. Bags are provided at the entrance.');
    return r;
  }

  var venueById = {};
  venues.forEach(function (v) { venueById[v.id] = v; });

  function buildListing(r) {
    var v = venueById[r[1]];
    var am = amenSet(r[13]);
    return {
      id: r[0], venueId: r[1], title: r[2], street: r[3], city: v.city, state: v.state,
      host: { id: r[4] === 'Jordan R.' ? 'me' : 'h-' + r[0], name: r[4], type: r[5], verified: !!r[16], since: 2019 + (r[15] % 6), responseMins: 5 + (r[15] % 25) },
      spotType: r[6],
      lat: +(v.lat + r[7]).toFixed(6), lng: +(v.lng + r[8]).toFixed(6),
      spots: r[9],
      price: { event: r[10], hourly: r[11], monthly: r[12] },
      amenities: am,
      rating: r[14], reviewCount: r[15],
      cancel: r[17],
      description: SPOT_DESC[r[6]],
      arrival: ARRIVAL[r[6]],
      rules: rulesFor(r[6], am),
      hourlyWindow: r[11] ? { days: [1, 2, 3, 4, 5, 6, 0], from: '07:00', to: '23:00' } : null,
      active: true,
      photoSeed: (function (s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; })(r[0]),
      createdBy: 'seed'
    };
  }

  var REVIEW_NAMES = ['Chris P.', 'Ashley M.', 'Devon K.', 'Brianna T.', 'Luis R.', 'Megan W.', 'Hank S.', 'Nora L.', 'Ty B.', 'Kelsey J.', 'Omar F.', 'Paige D.', 'Reggie C.', 'Sam V.', 'Wendy H.'];
  var REVIEW_TEXT = {
    5: ['Easy in, easy out. Host had cones out and waved us right in. Way better than the official lots.',
        'Ten-minute walk to the gate and we were on the highway 15 minutes after the final whistle. Booking again.',
        'Super friendly host, even offered us water. Spot was exactly as described.',
        'Perfect for game day. The QR check-in took two seconds.',
        'Clean, well-lit and the walk was easy with kids. Five stars.'],
    4: ['Good spot and a fair price. It was a bit tight pulling in with a truck, but the host helped.',
        'Walk was a little longer than I expected, but leaving was painless.',
        'Solid option. The host was busy but the spaces were clearly numbered.'],
    3: ['Fine overall. We were stacked in and waited about 25 minutes after the game.']
  };

  function seedReviews(listings) {
    var out = {};
    listings.forEach(function (l, idx) {
      var n = 3 + (l.photoSeed % 2);
      var list = [];
      for (var i = 0; i < n; i++) {
        var h = (l.photoSeed >>> (i * 3)) + i * 7 + idx;
        var stars = l.rating >= 4.8 ? 5 : (i === 1 ? 4 : 5);
        if (l.rating < 4.5 && i === 2) stars = 3;
        var pool = REVIEW_TEXT[stars];
        var month = 10 - (i % 3); // Oct, Sep, Aug
        var day = 3 + (h % 24);
        list.push({ name: REVIEW_NAMES[h % REVIEW_NAMES.length], rating: stars, text: pool[h % pool.length], date: '2026-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0') });
      }
      out[l.id] = list;
    });
    return out;
  }

  function seedBookings() {
    var me = C.CURRENT_USER;
    function b(o) {
      var price = o.price, fee = Math.max(C.DRIVER_FEE_MIN, +(price * C.DRIVER_FEE_RATE).toFixed(2));
      return Object.assign({
        createdAt: '2026-10-20T15:00:00', fee: fee, total: +(price + fee).toFixed(2),
        hostPayout: +(price * (1 - C.HOST_FEE_RATE)).toFixed(2), reviewed: false, mine: false
      }, o);
    }
    return [
      // Host-side bookings on Jordan's listings (att-02, att-06, osu-02)
      b({ id: 'bk-1001', code: 'PS-7K3Q9', listingId: 'att-02', type: 'event', eventId: 'ev-01', date: '2026-11-26', start: '11:30', price: 30, status: 'confirmed', driver: { name: 'Chris Patel', plate: 'LMN 2210', vehicle: 'White Ford F-150' } }),
      b({ id: 'bk-1002', code: 'PS-4HW2M', listingId: 'att-02', type: 'event', eventId: 'ev-01', date: '2026-11-26', start: '11:30', price: 30, status: 'confirmed', driver: { name: 'Ashley Moore', plate: 'GHT 9043', vehicle: 'Blue Toyota RAV4' } }),
      b({ id: 'bk-1003', code: 'PS-9PZ5D', listingId: 'att-06', type: 'event', eventId: 'ev-01', date: '2026-11-26', start: '11:30', price: 25, status: 'confirmed', driver: { name: 'Devon King', plate: 'RKX 5512', vehicle: 'Black Chevy Tahoe' } }),
      b({ id: 'bk-1004', code: 'PS-2MV8T', listingId: 'att-06', type: 'event', eventId: 'ev-02', date: '2026-12-05', start: '07:00', price: 25, status: 'confirmed', driver: { name: 'Luis Ramos', plate: 'DFW 7781', vehicle: 'Red Jeep Wrangler' } }),
      b({ id: 'bk-1005', code: 'PS-6CJ4R', listingId: 'osu-02', type: 'event', eventId: 'ev-09', date: '2026-11-28', start: '08:00', price: 40, status: 'confirmed', driver: { name: 'Megan Walsh', plate: 'OHB 3390', vehicle: 'Silver Subaru Outback' } }),
      b({ id: 'bk-1006', code: 'PS-8NB1X', listingId: 'att-02', type: 'hourly', date: '2026-11-03', start: '17:00', hours: 3, price: 18, status: 'confirmed', driver: { name: 'Hank Simmons', plate: 'TXR 6620', vehicle: 'Gray Nissan Altima' } }),
      // Past, completed host bookings (feed the earnings history)
      b({ id: 'bk-0901', code: 'PS-3TY7K', listingId: 'att-02', type: 'event', eventId: null, eventName: 'Cowboys vs. Giants', date: '2026-10-18', start: '12:00', price: 30, status: 'completed', driver: { name: 'Nora Lee', plate: 'BCD 4410', vehicle: 'Green Kia Soul' } }),
      b({ id: 'bk-0902', code: 'PS-5RQ2W', listingId: 'att-06', type: 'event', eventId: null, eventName: 'Cowboys vs. Giants', date: '2026-10-18', start: '12:00', price: 25, status: 'completed', driver: { name: 'Ty Brooks', plate: 'KLM 1188', vehicle: 'White Ram 1500' } }),
      // Driver-side bookings for the current user
      b({ id: 'bk-2001', code: 'PS-K4D8F', listingId: 'arr-02', type: 'event', eventId: 'ev-04', date: '2026-11-15', start: '08:00', price: 25, status: 'confirmed', mine: true, driver: { name: me.name, plate: me.plate, vehicle: me.vehicle } }),
      b({ id: 'bk-2002', code: 'PS-Z8L3N', listingId: 'atx-02', type: 'hourly', date: '2026-10-10', start: '19:00', hours: 4, price: 20, status: 'completed', mine: true, driver: { name: me.name, plate: me.plate, vehicle: me.vehicle } })
    ];
  }

  PS.seed = function () {
    var listings = rows.map(buildListing);
    return {
      version: 1,
      role: 'driver',
      listings: listings,
      reviews: seedReviews(listings),
      bookings: seedBookings(),
      reports: [],
      // Monthly host earnings history (net, after host fee) for the earnings chart
      earnings: [
        { month: '2026-05', amount: 96 }, { month: '2026-06', amount: 142 }, { month: '2026-07', amount: 118 },
        { month: '2026-08', amount: 205 }, { month: '2026-09', amount: 486 }, { month: '2026-10', amount: 612 }
      ],
      payouts: [
        { id: 'po-0309', date: '2026-09-29', amount: 271.80, status: 'paid', method: 'Bank •••• 6789' },
        { id: 'po-0310', date: '2026-10-13', amount: 318.60, status: 'paid', method: 'Bank •••• 6789' },
        { id: 'po-0311', date: '2026-10-27', amount: 293.40, status: 'in_transit', method: 'Bank •••• 6789' },
        { id: 'po-0312', date: '2026-11-10', amount: 0, status: 'scheduled', method: 'Bank •••• 6789' }
      ]
    };
  };

  PS.data = { venues: venues, events: events, venueById: venueById };
})();
