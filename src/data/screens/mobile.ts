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

import type { MessageKey } from "../../i18n/index.tsx";

export type MobileTabKey = "home" | "book" | "visits" | "offers" | "you";

export interface MobileTab {
  key: MobileTabKey;
  labelKey: MessageKey;
  icon: string;
}

/** The five-tab bar, in order. `home` is Lucide's `house` in the comp. */
export const MOBILE_TABS: readonly MobileTab[] = [
  { key: "home", labelKey: "data.mobile.tabHome", icon: "home" },
  { key: "book", labelKey: "data.mobile.tabBook", icon: "calendar-plus" },
  { key: "visits", labelKey: "data.mobile.tabVisits", icon: "calendar-check" },
  { key: "offers", labelKey: "data.mobile.tabOffers", icon: "tag" },
  { key: "you", labelKey: "data.mobile.tabYou", icon: "user-round" },
];

/**
 * Header title per tab. `home` is `null` rather than `""` — it shows a
 * time-of-day greeting instead, and a null says that on purpose where an
 * empty string would read as an untranslated key.
 */
export const TAB_TITLE_KEYS: Record<MobileTabKey, MessageKey | null> = {
  home: null,
  book: "data.mobile.titleBook",
  visits: "data.mobile.titleVisits",
  offers: "data.mobile.titleOffers",
  you: "data.mobile.titleYou",
};

export interface QuickChip {
  icon: string;
  labelKey: MessageKey;
  /** Tab this chip jumps to, or `null` when it opened a comp-only sub-route. */
  tab: MobileTabKey | null;
}

/**
 * The scrolling shortcut row on Home. The comp pushed five of these into
 * sub-routes (team, shelf, gift cards, reviews, wait list) that live outside
 * the five tabs; here they fall back to the comp's own "demo only" toast.
 */
export const QUICK_CHIPS: readonly QuickChip[] = [
  { icon: "calendar-plus", labelKey: "data.mobile.chipBook", tab: "book" },
  { icon: "users", labelKey: "data.mobile.chipTeam", tab: null },
  { icon: "shopping-bag", labelKey: "data.mobile.chipShop", tab: null },
  { icon: "tag", labelKey: "data.mobile.chipOffers", tab: "offers" },
  { icon: "gift", labelKey: "data.mobile.chipGiftCard", tab: null },
  { icon: "star", labelKey: "data.mobile.chipReviews", tab: null },
  { icon: "bell-plus", labelKey: "data.mobile.chipWaitlist", tab: null },
];

/** "Book again" carousel — seam service ids. */
export const HOME_SERVICE_IDS: readonly string[] = [
  "gloss",
  "facial",
  "gel",
  "reformer",
];

/**
 * The journal teaser under the loyalty card.
 *
 * The post's title is the salon's own writing and stays as written; the
 * kicker, the reading time and the word joining the byline are chrome, so the
 * screen builds them from `kickerKey`, `author` and `readMin`.
 */
export const JOURNAL_TEASER = {
  kickerKey: "data.mobile.journalKicker",
  /** Journal section id — `JOURNAL_CATEGORY_KEY` spells it into `{category}`. */
  cat: "hair",
  title: "Making balayage last through summer",
  /** Staff id — the byline name comes from the seam, never spelled here. */
  author: "elin",
  readMin: 5,
  /** Per-record tint — the one place a raw hex is allowed. */
  tint: "#b58a6a",
} as const satisfies {
  kickerKey: MessageKey;
  cat: string;
  title: string;
  author: string;
  readMin: number;
  tint: string;
};

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
  /** Historic fiction, pinned rather than recomputed — but still a date, so it
   *  is stored as `YYYY-MM-DD` and spelled at render. */
  dateISO: string;
}

export const UPCOMING_VISITS: readonly UpcomingVisit[] = [
  { code: "LMN-1039", svc: "gloss", dayIdx: 0, time: 840, price: 60 },
  { code: "LMN-1041", svc: "reformer", dayIdx: 0, time: 1020, price: 40 },
];

export const PAST_VISITS: readonly PastVisit[] = [
  { code: "P-2291", svc: "balayage", dateISO: "2026-07-14", price: 190 },
  { code: "P-2264", svc: "facial", dateISO: "2026-06-30", price: 110 },
  { code: "P-2251", svc: "gel", dateISO: "2026-06-02", price: 58 },
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

/**
 * A promotion on the phone.
 *
 * The salon wrote `title`, `deal` and `blurb`, so those stay as written. When
 * it runs out and how many are left are the product speaking, and both carry a
 * number a locale spells its own way — so they are a date and a count with a
 * key over them.
 */
export interface PhoneOffer {
  code: string;
  title: string;
  deal: string;
  blurb: string;
  /** Last day the code works, `YYYY-MM-DD`. */
  endsISO: string;
  /** Scarcity line: how many are claimed or left, or who it is for. */
  leftKey: MessageKey;
  /** Fills `{count}` in the scarcity line, where it has one. */
  leftCount?: number;
  icon: string;
  /** Per-record tint — the one place a raw hex is allowed. */
  tint: string;
  /** Seam service id the "Book" button opens. */
  svc: string;
}

export const FEATURED_OFFER = {
  code: "PAIRUP25",
  endsISO: "2026-11-02",
  title: "Two treatments, one afternoon, 25% off",
  blurb: "Pair any hair service with a spa treatment the same day.",
} as const;

export const PHONE_OFFERS: readonly PhoneOffer[] = [
  {
    code: "MORNING20",
    title: "Midweek mornings",
    deal: "20% off before noon",
    blurb: "Tuesday to Thursday, anything before 12 PM is a fifth off.",
    endsISO: "2026-10-31",
    leftKey: "data.offer.claimed",
    leftCount: 18,
    icon: "sunrise",
    tint: "#b58a6a",
    svc: "cut",
  },
  {
    code: "DUONAILS",
    title: "Bring a friend",
    deal: "Second manicure half price",
    blurb: "Two manicures back to back — the second one is 50% off.",
    endsISO: "2026-11-15",
    leftKey: "data.offer.claimed",
    leftCount: 32,
    icon: "users",
    tint: "#c08a6a",
    svc: "gel",
  },
  {
    code: "SKIN3FOR2",
    title: "Autumn skin reset",
    deal: "Three facials for two",
    blurb: "Three signature facials across the season, priced as two.",
    endsISO: "2026-12-20",
    leftKey: "data.offer.left",
    leftCount: 9,
    icon: "flower-2",
    tint: "#6f8bb0",
    svc: "facial",
  },
  {
    code: "MOVEFIRST",
    title: "Movement starter",
    deal: "First reformer free",
    blurb: "Your first forty-five minutes with Marco are on us.",
    endsISO: "2026-09-30",
    leftKey: "data.offer.newGuests",
    icon: "activity",
    tint: "#7d9166",
    svc: "reformer",
  },
];

/** How a row's trailing detail should be spelled. */
export type DetailKind = "none" | "count" | "money" | "rating" | "sent" | "open";

export interface AccountRow {
  icon: string;
  labelKey: MessageKey;
  /** The trailing grey figure. `'none'` draws nothing. */
  detail: DetailKind;
  /** The figure itself — grouped, rounded and signed by `Intl` at render. */
  value?: number;
}

/** The two detail kinds that carry a word as well as a figure. */
export const DETAIL_KEY: Partial<Record<DetailKind, MessageKey>> = {
  sent: "data.mobile.detailSent",
  open: "data.mobile.detailOpen",
};

/** The You tab's list. Every one of these was a comp-only sub-route. */
export const ACCOUNT_ROWS: readonly AccountRow[] = [
  { icon: "user", labelKey: "data.mobile.rowAccount", detail: "none" },
  { icon: "bell-plus", labelKey: "data.mobile.rowWaitlist", detail: "count", value: 0 },
  { icon: "gift", labelKey: "data.mobile.rowGiftCards", detail: "sent", value: 2 },
  { icon: "shopping-bag", labelKey: "data.mobile.rowShelf", detail: "none" },
  { icon: "star", labelKey: "data.mobile.rowReviews", detail: "rating", value: 4.8 },
  { icon: "receipt", labelKey: "data.mobile.rowOrders", detail: "money", value: 973 },
  { icon: "file-down", labelKey: "data.mobile.rowExports", detail: "none" },
  { icon: "briefcase", labelKey: "data.mobile.rowCareers", detail: "open", value: 4 },
  { icon: "life-buoy", labelKey: "data.mobile.rowHelp", detail: "none" },
];

/**
 * The two stat tiles beside the live points count. `value` is a number and
 * `{year}` is filled from `STATS_YEAR`, so neither the digits nor the date
 * arrive pre-spelled in English.
 */
export const YOU_STATS: readonly {
  value: number;
  labelKey: MessageKey;
  year?: number;
}[] = [
  { value: 3, labelKey: "data.mobile.statSessionsLeft" },
  { value: 12, labelKey: "data.mobile.statVisitsInYear", year: 2026 },
];

/** Loyalty seed. The phone keeps its own balance — see the screen's header. */
export const START_POINTS = 340;
export const POINTS_GOAL = 500;

/** What the goal unlocks, whole dollars — filled into `{amount}`. */
export const REWARD_AMOUNT = 25;

/** `t(REWARD_LABEL_KEY, { amount: money(REWARD_AMOUNT) })`. */
export const REWARD_LABEL_KEY: MessageKey = "data.mobile.rewardLabel";

/** Avatar tint for the signed-in guest — a per-record tint, not a token. */
export const PROFILE_TINT = "#b07d9a";

/**
 * The build string in the You tab's footer. The version is a machine token;
 * the words after it are not, so they live in `data.mobile.buildLine`.
 */
export const APP_VERSION = "v2.4.0";

/** The footer line around it: `t(APP_BUILD_KEY, { version: APP_VERSION })`. */
export const APP_BUILD_KEY: MessageKey = "data.mobile.buildLine";

/** In-device toast lifetime, and how long a copied code stays flipped (ms). */
export const PHONE_TOAST_MS = 2200;
export const COPIED_MS = 2000;
