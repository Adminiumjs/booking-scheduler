/*
 * Page-local seed for the Seasonal offers screen (guest view `offers`).
 *
 * Promo codes exist nowhere else in the app, so they live with the screen
 * that shows them. `svc` is a seam service id — "Book" opens the booking
 * flow already pointed at the thing the offer is about.
 */

import type { MessageKey } from "../../i18n/index.tsx";

export interface SeasonalOffer {
  code: string;
  title: string;
  /** The headline saving, e.g. `'20% off before noon'`. */
  deal: string;
  /** Last day the code works, `YYYY-MM-DD` — the screen spells the date. */
  endsISO: string;
  /** Scarcity line — claimed count, remaining count, or an audience. */
  leftKey: MessageKey;
  /** Fills `{count}` in the scarcity line, where it has one. */
  leftCount?: number;
  icon: string;
  /** Per-record tint — the one place a raw hex is allowed. */
  tint: string;
  svc: string;
  blurb: string;
}

/** The banner offer at the top of the screen; it has no card of its own. */
export const FEATURED_OFFER = {
  code: "PAIRUP25",
  endsISO: "2026-11-02",
  title: "Two treatments, one afternoon, 25% off",
  blurb:
    "Pair any hair service with a spa treatment on the same day and take a quarter off the second one.",
} as const;

export const OFFERS: readonly SeasonalOffer[] = [
  {
    code: "MORNING20",
    title: "Midweek mornings",
    deal: "20% off before noon",
    endsISO: "2026-10-31",
    leftKey: "data.offer.claimed",
    leftCount: 18,
    icon: "sunrise",
    tint: "#b58a6a",
    svc: "cut",
    blurb:
      "Tuesday to Thursday, anything booked before 12 PM comes with a fifth off. The calmest hours in the studio.",
  },
  {
    code: "DUONAILS",
    title: "Bring a friend",
    deal: "Second manicure half price",
    endsISO: "2026-11-15",
    leftKey: "data.offer.claimed",
    leftCount: 32,
    icon: "users",
    tint: "#c08a6a",
    svc: "gel",
    blurb:
      "Book two manicures back to back and the second one is 50% off. Same day, same chairs, side by side.",
  },
  {
    code: "SKIN3FOR2",
    title: "Autumn skin reset",
    deal: "Three facials for two",
    endsISO: "2026-12-20",
    leftKey: "data.offer.left",
    leftCount: 9,
    icon: "flower-2",
    tint: "#6f8bb0",
    svc: "facial",
    blurb:
      "Skin changes when the heating goes on. Three signature facials across the season, priced as two.",
  },
  {
    code: "MOVEFIRST",
    title: "Movement starter",
    deal: "First reformer free",
    endsISO: "2026-09-30",
    leftKey: "data.offer.newGuests",
    icon: "activity",
    tint: "#7d9166",
    svc: "reformer",
    blurb:
      "Never used a reformer? Your first forty-five minutes with Marco are on us, no strings attached.",
  },
];

/** How long the "Copied" state on a code button lasts, in ms. */
export const COPIED_MS = 2200;
