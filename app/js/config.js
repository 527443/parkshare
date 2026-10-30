/* ParkShare demo — global config.
   To rename the product, change APP_NAME (and optionally TAGLINE) here. Everything else reads from it. */
window.PS = window.PS || {};

PS.config = {
  APP_NAME: 'ParkShare',
  TAGLINE: "Park in a neighbor's driveway, steps from the gate.",
  TODAY: '2026-10-29',              // demo "today"; all dates are relative to this
  STORAGE_KEY: 'parkshare.demo.v1',
  DRIVER_FEE_RATE: 0.12,            // driver service fee (% of spot price)
  DRIVER_FEE_MIN: 1.99,
  HOST_FEE_RATE: 0.10,              // platform fee taken from host payout
  CURRENT_USER: {
    id: 'me',
    name: 'Jordan Rivera',
    first: 'Jordan',
    email: 'jordan.rivera@example.com',
    plate: 'TXK 4821',
    vehicle: 'Gray Honda CR-V'
  }
};
