/* Illustration placeholders (SVG "photos"), QR-style pass code, and icon set. No external images. */
(function () {
  var SKIES = [
    ['#BFE3F2', '#F3EFE4'],   // day
    ['#33406B', '#F4A261'],   // dusk
    ['#FCD9A8', '#F6F0E2']    // golden hour
  ];
  var HOUSE = ['#E9D8C4', '#C9D6DF', '#E4C9B0', '#D8E2D0', '#EAD6D6', '#D6D2E8'];
  var ROOF = ['#5B4A42', '#3D4A5C', '#7A4B3A', '#4A5A4A'];
  var CARS = ['#C0392B', '#2E86DE', '#F5F5F5', '#2D3436', '#16A085', '#F0B429', '#8E44AD', '#95A5A6'];

  function pick(arr, n) { return arr[Math.abs(n) % arr.length]; }

  function car(x, y, c, s) {
    s = s || 1;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
      '<path d="M0 18 Q2 8 14 7 L22 0 H48 L58 7 Q70 8 72 18 V24 H0Z" fill="' + c + '" stroke="rgba(0,0,0,.25)" stroke-width="1"/>' +
      '<path d="M25 3 H46 L53 8 H19Z" fill="#cfe3ee" opacity=".9"/>' +
      '<circle cx="16" cy="24" r="6" fill="#1b1f24"/><circle cx="56" cy="24" r="6" fill="#1b1f24"/>' +
      '<circle cx="16" cy="24" r="2.5" fill="#9aa3ad"/><circle cx="56" cy="24" r="2.5" fill="#9aa3ad"/></g>';
  }
  function carTop(x, y, c, rot) {
    return '<g transform="translate(' + x + ',' + y + ') rotate(' + (rot || 0) + ')">' +
      '<rect x="-14" y="-26" width="28" height="52" rx="8" fill="' + c + '" stroke="rgba(0,0,0,.3)"/>' +
      '<rect x="-11" y="-14" width="22" height="10" rx="3" fill="#cfe3ee"/>' +
      '<rect x="-11" y="10" width="22" height="7" rx="3" fill="#cfe3ee" opacity=".8"/></g>';
  }
  function stadium(x, y, w, col) {
    var h = w * 0.28;
    return '<g opacity=".55">' +
      '<path d="M' + x + ' ' + (y + h) + ' Q' + (x + w / 2) + ' ' + (y - h * 0.4) + ' ' + (x + w) + ' ' + (y + h) + 'Z" fill="' + col + '"/>' +
      '<rect x="' + (x + w * 0.08) + '" y="' + (y - h * 0.9) + '" width="3" height="' + h * 1.6 + '" fill="' + col + '"/>' +
      '<rect x="' + (x + w * 0.88) + '" y="' + (y - h * 0.9) + '" width="3" height="' + h * 1.6 + '" fill="' + col + '"/>' +
      '<rect x="' + (x + w * 0.08 - 6) + '" y="' + (y - h * 0.9 - 4) + '" width="15" height="6" rx="1" fill="#fff6c9"/>' +
      '<rect x="' + (x + w * 0.88 - 6) + '" y="' + (y - h * 0.9 - 4) + '" width="15" height="6" rx="1" fill="#fff6c9"/></g>';
  }
  function house(x, y, body, roof) {
    return '<g transform="translate(' + x + ',' + y + ')">' +
      '<rect x="0" y="40" width="150" height="80" fill="' + body + '"/>' +
      '<path d="M-10 44 L75 0 L160 44Z" fill="' + roof + '"/>' +
      '<rect x="18" y="62" width="26" height="22" fill="#FFF3C4" stroke="#fff" stroke-width="3"/>' +
      '<rect x="56" y="74" width="20" height="46" fill="' + roof + '"/>' +
      '<rect x="92" y="66" width="52" height="54" fill="#EDEDED" stroke="#bbb"/>' +
      '<path d="M92 78 H144 M92 90 H144 M92 102 H144" stroke="#c9c9c9" stroke-width="2"/></g>';
  }
  function church(x, y, body, roof) {
    return '<g transform="translate(' + x + ',' + y + ')">' +
      '<rect x="0" y="50" width="170" height="70" fill="' + body + '"/>' +
      '<path d="M-6 54 L85 18 L176 54Z" fill="' + roof + '"/>' +
      '<rect x="66" y="-10" width="38" height="64" fill="' + body + '"/>' +
      '<path d="M62 -8 L85 -46 L108 -8Z" fill="' + roof + '"/>' +
      '<rect x="83" y="-62" width="4" height="18" fill="' + roof + '"/><rect x="77" y="-56" width="16" height="4" fill="' + roof + '"/>' +
      '<circle cx="85" cy="14" r="9" fill="#F7D774" stroke="#fff" stroke-width="2"/>' +
      '<path d="M20 110 V76 a10 10 0 0 1 20 0 V110Z M130 110 V76 a10 10 0 0 1 20 0 V110Z" fill="#9CC3E6"/>' +
      '<path d="M72 120 V84 a13 13 0 0 1 26 0 V120Z" fill="' + roof + '"/></g>';
  }
  function business(x, y, body, roof) {
    return '<g transform="translate(' + x + ',' + y + ')">' +
      '<rect x="0" y="30" width="190" height="90" fill="' + body + '"/>' +
      '<rect x="0" y="22" width="190" height="14" fill="' + roof + '"/>' +
      '<rect x="14" y="44" width="162" height="18" rx="2" fill="#13212E"/>' +
      '<text x="95" y="57" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="#FFB81C" text-anchor="middle" letter-spacing="2">EVENT PARKING</text>' +
      '<rect x="14" y="72" width="70" height="48" fill="#A7C7DC"/><rect x="106" y="72" width="70" height="38" fill="#A7C7DC"/>' +
      '<path d="M49 72 V120" stroke="#fff" stroke-width="2"/></g>';
  }
  function school(x, y, body, roof) {
    var w = '';
    for (var i = 0; i < 6; i++) w += '<rect x="' + (14 + i * 34) + '" y="66" width="20" height="18" fill="#FFF3C4"/>';
    return '<g transform="translate(' + x + ',' + y + ')">' +
      '<rect x="0" y="40" width="220" height="80" fill="#B4553F"/>' +
      '<rect x="0" y="34" width="220" height="10" fill="' + roof + '"/>' + w +
      '<rect x="96" y="92" width="28" height="28" fill="' + roof + '"/>' +
      '<circle cx="110" cy="22" r="10" fill="#fff" stroke="' + roof + '" stroke-width="3"/>' +
      '<rect x="240" y="-10" width="3" height="130" fill="#888"/><rect x="243" y="-8" width="26" height="16" fill="#B22234"/>' +
      '<rect x="243" y="-8" width="11" height="9" fill="#3C3B6E"/></g>';
  }
  function cone(x, y) {
    return '<g transform="translate(' + x + ',' + y + ')"><path d="M-7 0 L0 -22 L7 0Z" fill="#F26B1D"/><rect x="-4" y="-13" width="8" height="3" fill="#fff"/><rect x="-10" y="0" width="20" height="3" fill="#F26B1D"/></g>';
  }

  /* variant 0: wide shot, 1: top-down stalls, 2: entrance with sign */
  function photo(l, variant, opts) {
    opts = opts || {};
    var seed = l.photoSeed || 7;
    var v = variant || 0;
    var sky = SKIES[(seed + v) % 3];
    var body = pick(HOUSE, seed >> 2), roof = pick(ROOF, seed >> 4);
    var id = 'g' + l.id.replace(/[^a-z0-9]/gi, '') + v + (opts.key || '');
    var price = l.price.event || l.price.hourly || l.price.monthly;
    var s = '<svg class="illus" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration of ' + l.spotType + ' parking">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sky[0] + '"/><stop offset="1" stop-color="' + sky[1] + '"/></linearGradient></defs>';
    var lot = l.spotType === 'church' || l.spotType === 'business' || l.spotType === 'school';

    if (v === 1) {
      // top-down: stalls with one highlighted "your space"
      var ground = l.spotType === 'yard' ? '#6FA35A' : (l.spotType === 'driveway' ? '#B9B4AA' : '#3B4350');
      s += '<rect width="400" height="260" fill="' + ground + '"/>';
      if (l.spotType === 'yard') for (var k = 0; k < 8; k++) s += '<rect x="' + (k * 50) + '" y="0" width="25" height="260" fill="#7DB067" opacity=".55"/>';
      var line = l.spotType === 'yard' ? '#fff' : (lot ? '#F5F1E8' : '#8f8a80');
      var mine = seed % 5;
      for (var i = 0; i < 6; i++) {
        var x = 20 + i * 62;
        s += '<path d="M' + x + ' 40 V150" stroke="' + line + '" stroke-width="3" ' + (l.spotType === 'yard' ? 'stroke-dasharray="6 6"' : '') + '/>';
        if (i < 5) {
          if (i === mine) {
            s += '<rect x="' + (x + 4) + '" y="44" width="54" height="104" fill="#FFB81C" opacity=".9" rx="4"/>' +
              '<text x="' + (x + 31) + '" y="108" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="#13212E" text-anchor="middle">' + (i + 1) + '</text>';
          } else if ((seed >> i) & 1) {
            s += carTop(x + 31, 95, pick(CARS, seed + i * 3));
          } else {
            s += '<text x="' + (x + 31) + '" y="108" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="' + line + '" opacity=".7" text-anchor="middle">' + (i + 1) + '</text>';
          }
        }
      }
      s += '<rect x="0" y="180" width="400" height="80" fill="' + (lot ? '#2F3640' : '#A9A397') + '"/>' +
        '<path d="M0 220 H400" stroke="#FFB81C" stroke-width="4" stroke-dasharray="24 18"/>' +
        '<path d="M0 176 H400" stroke="#E6E1D6" stroke-width="5"/>';
    } else if (v === 2) {
      // entrance: sign + cones
      s += '<rect width="400" height="260" fill="url(#' + id + ')"/>' + stadium(250, 120, 140, '#5c6675');
      s += '<rect x="0" y="150" width="400" height="110" fill="' + (l.spotType === 'yard' ? '#79A866' : (lot ? '#3B4350' : '#B9B4AA')) + '"/>';
      for (var f = 0; f < 14; f++) s += '<rect x="' + (f * 30) + '" y="120" width="6" height="40" fill="#E9E2D2"/>';
      s += '<rect x="0" y="128" width="400" height="5" fill="#E9E2D2"/><rect x="0" y="146" width="400" height="5" fill="#E9E2D2"/>';
      s += '<g transform="translate(150,150)"><path d="M0 70 L20 0 H90 L110 70" fill="none" stroke="#13212E" stroke-width="5"/>' +
        '<rect x="12" y="-6" width="86" height="58" rx="6" fill="#FFB81C" stroke="#13212E" stroke-width="4"/>' +
        '<text x="55" y="16" font-family="Arial, sans-serif" font-size="13" font-weight="800" fill="#13212E" text-anchor="middle" letter-spacing="1.5">PARK</text>' +
        '<text x="55" y="42" font-family="Arial, sans-serif" font-size="24" font-weight="800" fill="#13212E" text-anchor="middle">$' + price + '</text></g>';
      s += cone(70, 236) + cone(110, 236) + cone(300, 236) + cone(340, 236);
      s += car(10, 176, pick(CARS, seed + 5), 0.9);
    } else {
      // wide shot of the property
      s += '<rect width="400" height="260" fill="url(#' + id + ')"/>' + stadium(20 + (seed % 120), 100, 170, '#6b7482');
      if (sky[0] === '#33406B') s += '<circle cx="330" cy="40" r="2" fill="#fff"/><circle cx="280" cy="28" r="1.5" fill="#fff"/><circle cx="360" cy="70" r="1.5" fill="#fff"/>';
      s += '<rect x="0" y="170" width="400" height="90" fill="' + (l.spotType === 'yard' ? '#79A866' : '#8FB57A') + '"/>';
      if (l.spotType === 'driveway') {
        s += house(150, 52, body, roof) + '<path d="M242 172 H294 L340 260 H200Z" fill="#CFC9BD"/>' + car(232, 190, pick(CARS, seed), 1.1) + cone(330, 246);
      } else if (l.spotType === 'yard') {
        s += house(210, 52, body, roof);
        for (var m = 0; m < 6; m++) s += '<rect x="' + (m * 66) + '" y="170" width="33" height="90" fill="#88B575" opacity=".6"/>';
        s += car(20, 196, pick(CARS, seed), 1) + car(110, 214, pick(CARS, seed + 2), 1.05);
        if (l.amenities.tailgate) s += '<g transform="translate(260,190)"><path d="M0 18 L28 0 L56 18Z" fill="#E63946"/><rect x="4" y="18" width="2" height="26" fill="#555"/><rect x="50" y="18" width="2" height="26" fill="#555"/></g>';
        s += cone(372, 248);
      } else {
        var b = l.spotType === 'church' ? church(40, 52, body, roof) : l.spotType === 'school' ? school(30, 52, body, roof) : business(30, 52, body, roof);
        s += b + '<rect x="0" y="172" width="400" height="88" fill="#3B4350"/>';
        for (var n = 0; n < 8; n++) s += '<path d="M' + (20 + n * 52) + ' 200 l18 60" stroke="#F5F1E8" stroke-width="3"/>';
        s += car(48, 214, pick(CARS, seed), 0.95) + car(204, 214, pick(CARS, seed + 3), 0.95);
        if (l.amenities.covered) s += '<rect x="250" y="160" width="150" height="10" fill="#A4ADB8"/><rect x="262" y="170" width="4" height="60" fill="#A4ADB8"/><rect x="384" y="170" width="4" height="60" fill="#A4ADB8"/>';
        if (l.amenities.ev) s += '<g transform="translate(360,200)"><rect width="16" height="34" rx="3" fill="#12805C"/><path d="M9 6 L4 16 H9 L6 26 L13 13 H8Z" fill="#fff"/></g>';
      }
    }
    return s + '</svg>';
  }

  /* QR-style pass (visual placeholder seeded by booking code; not a scannable QR). */
  function qr(text, size) {
    var N = 29, cells = [], h = 2166136261;
    for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    function rnd() { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; }
    for (var y = 0; y < N; y++) { cells[y] = []; for (var x = 0; x < N; x++) cells[y][x] = rnd() < 0.48; }
    function finder(ox, oy) {
      for (var dy = -1; dy <= 7; dy++) for (var dx = -1; dx <= 7; dx++) {
        var X = ox + dx, Y = oy + dy;
        if (X < 0 || Y < 0 || X >= N || Y >= N) continue;
        var on = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6 && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
        cells[Y][X] = on;
      }
    }
    finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
    for (var t = 8; t < N - 8; t++) { cells[6][t] = t % 2 === 0; cells[t][6] = t % 2 === 0; }
    for (var ay = -2; ay <= 2; ay++) for (var ax = -2; ax <= 2; ax++) cells[22 + ay][22 + ax] = Math.max(Math.abs(ax), Math.abs(ay)) !== 1;
    var r = '';
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) if (cells[y][x]) r += 'M' + (x + 2) + ' ' + (y + 2) + 'h1v1h-1z';
    return '<svg class="qr" width="' + (size || 220) + '" height="' + (size || 220) + '" viewBox="0 0 ' + (N + 4) + ' ' + (N + 4) + '" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Parking pass code ' + text + '"><rect width="100%" height="100%" fill="#fff"/><path d="' + r + '" fill="#13212E"/></svg>';
  }

  var P = {
    ev: '<path d="M13 2 L5 14 H11 L10 22 L19 9 H13Z"/>',
    oversize: '<path d="M2 16 V9 H13 V16 M13 11 H18 L21 14 V16 M2 16 H22"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    covered: '<path d="M2 10 L12 4 L22 10 M5 9 V20 M19 9 V20"/><path d="M8 17 H16"/>',
    tailgate: '<path d="M4 11 H20 L18 20 H6Z"/><path d="M8 7 Q9 5 8 3 M12 7 Q13 5 12 3 M16 7 Q17 5 16 3"/>',
    leave: '<path d="M4 12 H18 M13 6 L19 12 L13 18"/>',
    star: '<path d="M12 2.8 L14.8 8.6 L21.1 9.4 L16.5 13.8 L17.6 20.1 L12 17.1 L6.4 20.1 L7.5 13.8 L2.9 9.4 L9.2 8.6Z"/>',
    shield: '<path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5Z"/><path d="M8.5 12 L11 14.5 L15.5 9.5"/>',
    walk: '<circle cx="13" cy="4" r="2"/><path d="M10 22 L12 15 L15 18 V22 M8 12 L11 8 L15 10 L17 13 M11 8 L10 14"/>',
    pin: '<path d="M12 22 C12 22 5 14.5 5 9.5 A7 7 0 0 1 19 9.5 C19 14.5 12 22 12 22Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    flag: '<path d="M5 22 V3 M5 4 H17 L15 8 L17 12 H5"/>',
    check: '<path d="M4 12.5 L9.5 18 L20 6"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10 H21 M8 3 V7 M16 3 V7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7 V12 L15 14"/>',
    car: '<path d="M3 16 V12 L5.5 7 H18.5 L21 12 V16Z M3 12 H21"/><circle cx="7" cy="16.5" r="1.8"/><circle cx="17" cy="16.5" r="1.8"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M16 16 L21 21"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11 V17 M12 7.5 V8"/>',
    warn: '<path d="M12 3 L22 20 H2Z"/><path d="M12 10 V14 M12 17 V17.5"/>',
    home: '<path d="M3 11 L12 4 L21 11 V20 H3Z"/><path d="M9 20 V14 H15 V20"/>',
    church: '<path d="M12 2 V6 M10 4 H14 M7 10 L12 6 L17 10 V21 H7Z M3 21 H21 M10.5 21 V16 H13.5 V21"/>',
    biz: '<path d="M3 9 L5 4 H19 L21 9 Z M4 9 V20 H20 V9 M9 20 V14 H15 V20"/>',
    school: '<path d="M2 9 L12 4 L22 9 L12 14Z M6 11 V17 C9 19 15 19 18 17 V11"/>',
    scan: '<path d="M3 8 V4 H7 M17 4 H21 V8 M21 16 V20 H17 M7 20 H3 V16 M7 12 H17"/>',
    x: '<path d="M6 6 L18 18 M18 6 L6 18"/>',
    arrow: '<path d="M5 12 H19 M13 6 L19 12 L13 18"/>',
    back: '<path d="M19 12 H5 M11 6 L5 12 L11 18"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11 V7 A4 4 0 0 1 16 7 V11"/>',
    camera: '<path d="M3 8 H7 L9 5 H15 L17 8 H21 V19 H3Z"/><circle cx="12" cy="13" r="3.5"/>',
    plus: '<path d="M12 5 V19 M5 12 H19"/>',
    locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.6"/><path d="M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22"/>',
    map: '<path d="M3 6 L9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20Z M9 4 V18 M15 6 V20"/>',
    list: '<path d="M8 6 H21 M8 12 H21 M8 18 H21"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    reset: '<path d="M4 12 A8 8 0 1 0 7 5.8 M4 4 V9 H9"/>',
    dollar: '<path d="M12 3 V21 M16.5 7 C15.5 5.5 14 5 12 5 C9.5 5 8 6.3 8 8.2 C8 12.5 16.5 10.5 16.5 15.5 C16.5 17.6 14.6 19 12 19 C9.8 19 8.2 18.2 7.3 16.6"/>'
  };
  function icon(name, cls) {
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || '') + '</svg>';
  }

  PS.illus = { photo: photo, qr: qr, icon: icon };
})();
