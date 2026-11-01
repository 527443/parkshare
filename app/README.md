# ParkShare: peer-to-peer event parking (clickable demo)

This is a working front-end demo of a US parking marketplace. Homeowners, businesses, churches and schools near stadiums and downtowns list their driveways, yards and lots. Drivers book a spot for a specific game or concert, by the hour, or by the month.

It uses plain HTML, CSS and JavaScript with no build step. All data is sample data stored in your browser's `localStorage`. **There are no real payments**: the checkout is a mock Stripe-style form marked "demo, no charge".

## Run it

Either:

- **Open the file directly.** Double-click `index.html`. It uses classic scripts, so it works over `file://`.
- **Or serve the folder** (recommended, because OpenStreetMap tiles load more reliably over http):
  ```
  npx serve .
  # or
  python -m http.server 8080
  ```
  Then open the printed URL, for example http://localhost:8080.

You need an internet connection for the Leaflet map library, the OpenStreetMap tiles and the Google Fonts. Offline, the app still runs: it falls back to a schematic map and system fonts.

The demo "today" is **Oct 29, 2026**. Seeded events run from Nov to Dec 2026.

## Renaming the product

The name lives in one place: `APP_NAME` in `js/config.js`. The header, footer, page titles, passes and calendar files all read it from there. The only other copy is the static `<title>` fallback in `index.html`, which JavaScript overwrites on load.

## Screens

Use the **Driver / Host** switch in the header to change roles. **Reset demo** restores the original sample data.

### Driver
| Screen | Route | What it does |
|---|---|---|
| Home | `#/` | Hero search by venue, city or address (with suggestions), an Event/Hourly/Monthly toggle, a Lyft-style **"You are here" map** right below the search (your location as a blue dot, using browser location or a demo spot in Arlington, TX, with every bookable spot as a zoomable price pin, a tap-a-pin spot card, a re-center button and a live "N spots in view" count), an upcoming-events strip, popular venues, top-rated spots, how it works, trust features, and a call to action for hosts. |
| Search results | `#/search` | Results as a list next to a Leaflet map (on mobile, a Map/List toggle). Each card shows price pins, walking distance and time to the venue, spot type, host rating, verified badge and amenities. Filters cover booking type, max price, amenities (EV, oversize, covered, tailgating, leave anytime), spot type and sort order. Picking an event shows how many spaces are left. Each city gets an "allowed / check local rules" banner. |
| Spot detail | `#/spot/:id` | Illustrated photo gallery, walking time, amenities, description, host card with verified badge, house rules, cancellation policy, city rules banner, a location map with a walking line to the venue, reviews, and a report-a-problem button. The booking widget covers event-day (choose the game), hourly (date, start time, duration) and monthly bookings, with a live price breakdown (spot price + driver service fee). |
| Checkout | `#/checkout/:id` | Vehicle, contact and a mock card form (test card prefilled), with validation and an order summary. The pay button is labelled "demo, no charge". |
| Confirmation | `#/confirm/:bookingId` | Parking pass with a QR-style code, booking code, plate and space number, Google Maps driving directions and a walking route to the venue, an .ics "Add to calendar" download, arrival instructions, message host and report a problem. |
| My bookings | `#/bookings` | Upcoming, Past and Cancelled tabs. You can view a pass, get directions, cancel (the refund follows the listing's policy), leave a review on past bookings, and report a problem. |

### Host
| Screen | Route | What it does |
|---|---|---|
| Dashboard | `#/host` | Stats, **check-in** by typing a booking code or plate (try `PS-7K3Q9` or `RKX 5512`) or with a simulated **Scan QR** camera. Also shows upcoming bookings grouped by event, an SVG earnings chart (paid months plus booked Nov–Dec), mock payout status, and your listings with a live/paused toggle. |
| List your spot | `#/host/new` | An 8-step wizard: host type (homeowner, business, church or school), address (auto-matches the nearest venue and shows a map preview and local-rules banner), the space (type, count, amenities, title), photos (placeholder "uploads"), availability (event days auto-suggested from nearby events, hourly windows and monthly), pricing (for example "Similar spots near AT&T Stadium go for $25–40 per event", computed from nearby listings, with an earnings estimate), house rules and cancellation policy, then review. The **required attestation** step ("I have the right to rent this space (HOA/lease/city rules)") must be checked before you can publish. Published listings appear in search right away with "Verification pending". The wizard saves your progress in sessionStorage. |

### Trust features
Reviews (and a review form after you park), verified-host and pending-verification badges, a per-city "commonly allowed / check local rules" banner, and report-a-problem in the spot page, confirmation, My bookings, host dashboard and footer. Reports are saved to localStorage.

## Sample data
- 8 venues: AT&T Stadium, Lambeau Field, GEHA Field at Arrowhead, Wrigley Field, Rose Bowl, Madison Square Garden, Ohio Stadium and Downtown Austin (6th St).
- 12 events from Nov 7 to Dec 31, 2026.
- 40 listings with coordinates near each venue and realistic event, hourly and monthly prices, plus seeded reviews.
- The demo user, "Jordan Rivera", is both a driver (2 seeded bookings) and a host (3 listings with upcoming bookings, earnings history and payouts).

## Files
```
index.html        App shell; loads Leaflet from CDN, then the scripts in order
css/styles.css    Design system and all component styles (mobile-first)
js/config.js      App name, demo date, fees, demo user  <- rename here
js/data.js        Venues, events, 40 listings, reviews, bookings, payouts (seed)
js/store.js       localStorage state, pricing/fees, refunds, comps, distance math
js/illus.js       SVG "photo" illustrations, QR-style pass code, icon set
js/core.js        Utilities, router, modal/toast, shared components, map helper
js/driver.js      Home, search, spot detail, checkout, confirmation, my bookings
js/host.js        Host dashboard (check-in, chart, payouts) and listing wizard
js/main.js        Header (role switcher, reset), footer, boot
```

## Known limitations
- The QR code is a convincing visual placeholder generated from the booking code. It cannot be scanned. Host check-in works by typing the code or plate, or with the simulated scanner.
- Address search only matches seeded venues, cities, aliases and listing streets. There is no real geocoding, and new listings are placed near the chosen venue.
- Walking distance is a straight-line distance times 1.25, at about 80 m per minute. It is not routed.
- Photos are generated SVG illustrations. Photo "upload" in the wizard is simulated.
- Payments, payouts, emails, messaging, ID verification and camera scanning are all mocked.
- City rule banners are illustrative and not legal advice.
- OpenStreetMap's tile servers may rate-limit or block heavy use. Over `file://`, tiles occasionally fail to load, so serve the folder over http if that happens.
