/*
 * Page-local seed for the companion-app showcase (guest view `mobile`).
 *
 * The Mobile comp is a separate native design, not a breakpoint of the web
 * app, so it carries its own copy: five tabs, its own promo board, its own
 * account list. None of it belongs in the shared seam — nothing else in the
 * product renders a phone.
 *
 * Anything the seam already owns (services, categories, staff) is *not*
 * duplicated here; the screen reads those through `data`.
 */

export type MobileTabKey = "home" | "book" | "visits" | "offers" | "you";

export interface MobileTab {
  key: MobileTabKey;
  label: string;
  icon: string;
}

/** The five-tab bar, in order. `home` is Lucide's `house` in the comp. */
export const MOBILE_TABS: readonly MobileTab[] = [
  { key: "home", label: "Home", icon: "home" },
  { key: "book", label: "Book", icon: "calendar-plus" },
  { key: "visits", label: "Visits", icon: "calendar-check" },
  { key: "offers", label: "Offers", icon: "tag" },
  { key: "you", label: "You", icon: "user-round" },
];

/** Header title per tab; `home` shows a time-of-day greeting instead. */
export const TAB_TITLES: Record<MobileTabKey, string> = {
  home: "",
  book: "Book a visit",
  visits: "Your visits",
  offers: "Seasonal offers",
  you: "You",
};

export interface QuickChip {
  icon: string;
  label: string;
  /** Tab this chip jumps to, or `null` when it opened a comp-only sub-route. */
  tab: MobileTabKey | null;
}

/**
 * The scrolling shortcut row on Home. The comp pushed five of these into
 * sub-routes (team, shelf, gift cards, reviews, wait list) that live outside
 * the five tabs; here they fall back to the comp's own "demo only" toast.
 */
export const QUICK_CHIPS: readonly QuickChip[] = [
  { icon: "calendar-plus", label: "Book", tab: "book" },
  { icon: "users", label: "Team", tab: null },
  { icon: "shopping-bag", label: "Shop", tab: null },
  { icon: "tag", label: "Offers", tab: "offers" },
  { icon: "gift", label: "Gift card", tab: null },
  { icon: "star", label: "Reviews", tab: null },
  { icon: "bell-plus", label: "Wait list", tab: null },
];

/** "Book again" carousel — seam service ids. */
export const HOME_SERVICE_IDS: readonly string[] = [
  "gloss",
  "facial",
  "gel",
  "reformer",
];

/** The journal teaser under the loyalty card. */
export const JOURNAL_TEASER = {
  kicker: "Journal · Hair",
  title: "Making balayage last through summer",
  byline: "Selma · 5 min read",
  /** Per-record tint — the one place a raw hex is allowed. */
  tint: "#b58a6a",
} as const;

export interface PhoneVisit {
  code: string;
  /** Seam service id. */
  svc: string;
  price: number;
}

export interface UpcomingVisit extends PhoneVisit {
  /** Index into the rolling week, so the demo never shows a stale date. */
  dayIdx: number;
  /** Start time, minutes from midnight. */
  time: number;
}

export interface PastVisit extends PhoneVisit {
  /** Historic fiction — a fixed label, not a date the demo can recompute. */
  date: string;
}

export const UPCOMING_VISITS: readonly UpcomingVisit[] = [
  { code: "LMN-1039", svc: "gloss", dayIdx: 0, time: 840, price: 60 },
  { code: "LMN-1041", svc: "reformer", dayIdx: 0, time: 1020, price: 40 },
];

export const PAST_VISITS: readonly PastVisit[] = [
  { code: "P-2291", svc: "balayage", date: "Jul 14", price: 190 },
  { code: "P-2264", svc: "facial", date: "Jun 30", price: 110 },
  { code: "P-2251", svc: "gel", date: "Jun 2", price: 58 },
];

/** The ten start times the phone's slot grid offers. */
export const SLOT_MINUTES: readonly number[] = [
  540, 600, 630, 690, 750, 810, 870, 930, 990, 1050,
];

/**
 * Which of those are free, per day. The comp's demo availability, kept
 * verbatim so the grid looks the same: deterministic, never all-open.
 */
export function isSlotOpen(dayIdx: number, slotIdx: number): boolean {
  return (dayIdx * 7 + slotIdx * 3) % 10 > 2;
}

export interface PhoneOffer {
  code: string;
  title: string;
  deal: string;
  blurb: string;
  ends: string;
  icon: string;
  /** Per-record tint — the one place a raw hex is allowed. */
  tint: string;
  /** Seam service id the "Book" button opens. */
  svc: string;
}

export const FEATURED_OFFER = {
  code: "PAIRUP25",
  ends: "Ends Nov 2",
  title: "Two treatments, one afternoon, 25% off",
  blurb: "Pair any hair service with a spa treatment the same day.",
} as const;

export const PHONE_OFFERS: readonly PhoneOffer[] = [
  {
    code: "MORNING20",
    title: "Midweek mornings",
    deal: "20% off before noon",
    blurb: "Tuesday to Thursday, anything before 12 PM is a fifth off.",
    ends: "Ends Oct 31 · 18 claimed",
    icon: "sunrise",
    tint: "#b58a6a",
    svc: "cut",
  },
  {
    code: "DUONAILS",
    title: "Bring a friend",
    deal: "Second manicure half price",
    blurb: "Two manicures back to back — the second one is 50% off.",
    ends: "Ends Nov 15 · 32 claimed",
    icon: "users",
    tint: "#c08a6a",
    svc: "gel",
  },
  {
    code: "SKIN3FOR2",
    title: "Autumn skin reset",
    deal: "Three facials for two",
    blurb: "Three signature facials across the season, priced as two.",
    ends: "Ends Dec 20 · 9 left",
    icon: "flower-2",
    tint: "#6f8bb0",
    svc: "facial",
  },
  {
    code: "MOVEFIRST",
    title: "Movement starter",
    deal: "First reformer free",
    blurb: "Your first forty-five minutes with Marco are on us.",
    ends: "Ends Sep 30 · new guests",
    icon: "activity",
    tint: "#7d9166",
    svc: "reformer",
  },
];

export interface AccountRow {
  icon: string;
  label: string;
  detail: string;
}

/** The You tab's list. Every one of these was a comp-only sub-route. */
export const ACCOUNT_ROWS: readonly AccountRow[] = [
  { icon: "user", label: "Account settings", detail: "" },
  { icon: "bell-plus", label: "Wait list", detail: "0" },
  { icon: "gift", label: "Gift cards", detail: "2 sent" },
  { icon: "shopping-bag", label: "The shelf", detail: "" },
  { icon: "star", label: "Reviews & ratings", detail: "4.8" },
  { icon: "receipt", label: "Order history", detail: "$973" },
  { icon: "file-down", label: "Export history", detail: "" },
  { icon: "briefcase", label: "Careers", detail: "4 open" },
  { icon: "life-buoy", label: "Help & FAQ", detail: "" },
];

/** The two stat tiles that sit beside the live points count. */
export const YOU_STATS: readonly { value: string; label: string }[] = [
  { value: "3", label: "Sessions left" },
  { value: "12", label: "Visits in 2026" },
];

/** Loyalty seed. The phone keeps its own balance — see the screen's header. */
export const START_POINTS = 340;
export const POINTS_GOAL = 500;
export const REWARD_LABEL = "$25 reward";

/** Avatar tint for the signed-in guest — a per-record tint, not a token. */
export const PROFILE_TINT = "#b07d9a";

export const APP_VERSION = "v2.4.0 · demo build";

/** In-device toast lifetime, and how long a copied code stays flipped (ms). */
export const PHONE_TOAST_MS = 2200;
export const COPIED_MS = 2000;
