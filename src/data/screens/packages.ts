/*
 * Page-local seed for the Packages screen (guest view `packages`).
 *
 * Prepaid bundles are not part of the DataSource seam — nothing else in the
 * app reads them, and the only trace a purchase leaves is the `pkgOwned`
 * entry on the store. `svc` is a real service id from the seam so that
 * "Book a session" can hand it straight to `startBooking`; `null` means the
 * bundle spans the whole studio and lands on the services list instead.
 *
 * Every `was` figure is the seam's real per-visit price times `qty`, so the
 * "Save $X" badge is arithmetic rather than decoration.
 */

export interface PackageDeal {
  id: string;
  name: string;
  /** Service id the sessions are spent on, or `null` for anything we do. */
  svc: string | null;
  qty: number;
  /** What the same sessions cost bought one at a time. */
  was: number;
  now: number;
  featured?: boolean;
  icon: string;
  /** Per-record tint — the one place a raw hex is allowed. */
  tint: string;
  blurb: string;
}

export const PACKAGES: readonly PackageDeal[] = [
  {
    id: "glow5",
    name: "Glow Five",
    svc: "facial",
    qty: 5,
    was: 550,
    now: 475,
    icon: "flower-2",
    tint: "#6f8bb0",
    blurb: "Five signature facials, spaced however your skin likes them.",
  },
  {
    id: "color3",
    name: "Color Care Trio",
    svc: "root",
    qty: 3,
    was: 405,
    now: 355,
    icon: "paintbrush",
    tint: "#a06f96",
    blurb: "Three root touch-ups, booked whenever the line shows up.",
  },
  {
    id: "nail6",
    name: "Nail Club",
    svc: "gel",
    qty: 6,
    was: 348,
    now: 290,
    icon: "sparkles",
    tint: "#c08a6a",
    blurb: "Six gel sets — roughly half a year of very good hands.",
  },
  {
    id: "move10",
    name: "Movement Ten",
    svc: "reformer",
    qty: 10,
    was: 400,
    now: 320,
    featured: true,
    icon: "activity",
    tint: "#7d9166",
    blurb: "Ten reformer sessions with Marco. The habit-builder.",
  },
  {
    id: "aroma3",
    name: "Slow Sundays",
    svc: "aroma",
    qty: 3,
    was: 465,
    now: 399,
    icon: "leaf",
    tint: "#7d9179",
    blurb: "Three ninety-minute aromatherapy rituals, no rushing.",
  },
  {
    id: "sampler",
    name: "Studio Sampler",
    svc: null,
    qty: 3,
    was: 233,
    now: 199,
    icon: "gift",
    tint: "#b07d9a",
    blurb: "One cut, one facial, one manicure — try the whole studio.",
  },
];

/** Sessions stay valid for twelve months, counted from the day you buy. */
export const PACKAGE_VALID_LABEL = "12 months";
