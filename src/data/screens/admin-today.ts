/*
 * The studio floor: what is on the book today, and how the day is drawn.
 *
 * Both screens that render the day — Today and Calendar — read this one
 * module, so a booking can never say 2:00 PM on one screen and 2:30 PM on the
 * other. If a third studio screen needs the book it should move up into
 * `src/data/source.ts`.
 *
 * Services and specialists are deliberately NOT re-seeded here: every row
 * points at a `data.getService()` / `data.getStaffMember()` id, so the studio
 * half and the guest half cannot disagree about a price, a duration or a
 * tint. The comp's stylist "Selma" is `elin` in the shipped app — same tint,
 * same role; Selma Okonjo is the owner, not the colourist.
 */

import type { StaffMember, Weekday } from "../types.ts";
import type { MessageKey } from "../../i18n/index.tsx";
import { minutesToTime, wholeMoney } from "../../lib/format.ts";

/** Where an appointment is in its life, front-desk vocabulary. */
export type ApptStatus =
  | "confirmed"
  | "arrived"
  | "done"
  | "pending"
  | "cancelled";

export interface StudioAppt {
  id: string;
  /** `data.getStaffMember()` id. */
  staff: string;
  /** `data.getService()` id. */
  svc: string;
  client: string;
  /** Avatar initials — the client list is fiction, so they are seeded. */
  ci: string;
  /** Start, minutes from midnight. */
  start: number;
  status: ApptStatus;
  /** Front-desk note; most rows have none. */
  note: string;
}

/** One Tuesday in the diary. Demo fiction, verbatim from the comp. */
export const STUDIO_BOOK: readonly StudioAppt[] = [
  { id: "A1", staff: "elin", svc: "balayage", client: "Priya Sharma", ci: "PS", start: 540, status: "done", note: "" },
  { id: "A2", staff: "elin", svc: "cut", client: "Owen Byrne", ci: "OB", start: 660, status: "arrived", note: "" },
  { id: "A3", staff: "elin", svc: "gloss", client: "Ava Reyes", ci: "AR", start: 840, status: "confirmed", note: "Texted that she may be ten minutes late." },
  { id: "A4", staff: "elin", svc: "cut", client: "Jonah Pike", ci: "JP", start: 960, status: "pending", note: "New guest — needs an intake form." },
  { id: "A5", staff: "noor", svc: "facial", client: "Hannah Wills", ci: "HW", start: 570, status: "done", note: "" },
  { id: "A6", staff: "noor", svc: "deep", client: "Marcus Lund", ci: "ML", start: 690, status: "arrived", note: "Shoulder still tender on the left." },
  { id: "A7", staff: "ivy", svc: "gel", client: "Dana Rivas", ci: "DR", start: 630, status: "done", note: "" },
  { id: "A8", staff: "ivy", svc: "pedi", client: "Lucia Moss", ci: "LM", start: 780, status: "confirmed", note: "" },
  { id: "A9", staff: "ivy", svc: "gel", client: "Robin Alvarez", ci: "RA", start: 900, status: "confirmed", note: "Paying with a gift card." },
  { id: "A10", staff: "marco", svc: "reformer", client: "Theo Kim", ci: "TK", start: 750, status: "confirmed", note: "" },
  { id: "A11", staff: "marco", svc: "reformer", client: "Ava Reyes", ci: "AR", start: 1020, status: "confirmed", note: "" },
  { id: "A12", staff: "noor", svc: "facial", client: "Sam Doyle", ci: "SD", start: 810, status: "cancelled", note: "Cancelled this morning — slot open." },
];

/* ------------------------------------------------------------------ *
 * Diary geometry
 * ------------------------------------------------------------------ */

/** First bookable minute (9:00 AM). */
export const DAY_START = 540;
/** Last bookable minute (8:00 PM). */
export const DAY_END = 1200;
/** Pixels per half hour in the calendar grid — the unit a drag snaps to. */
export const ROW = 44;

/* ------------------------------------------------------------------ *
 * Status
 * ------------------------------------------------------------------ */

export type StatusTone = "info" | "pos" | "muted" | "warn" | "danger";

export interface StatusMeta {
  /**
   * Message key, not display text. A status name is product chrome, so it has
   * to survive a locale switch — the screen resolves this through `t()`. The
   * field is deliberately not called `label`: anything that renders it raw is
   * then a visible key rather than English that quietly looks translated.
   */
  labelKey: MessageKey;
  /** Drives a `data-tone` attribute; the colour itself lives in CSS. */
  tone: StatusTone;
}

export const STATUS_META: Record<ApptStatus, StatusMeta> = {
  confirmed: { labelKey: "screensA.today.statusConfirmed", tone: "info" },
  arrived: { labelKey: "screensA.today.statusArrived", tone: "pos" },
  done: { labelKey: "screensA.today.statusDone", tone: "muted" },
  pending: { labelKey: "screensA.today.statusPending", tone: "warn" },
  cancelled: { labelKey: "screensA.today.statusCancelled", tone: "danger" },
};

/** What the primary action on a row does next, given where it is now. */
export const NEXT_STATUS: Record<ApptStatus, ApptStatus> = {
  confirmed: "arrived",
  arrived: "done",
  pending: "confirmed",
  done: "confirmed",
  cancelled: "confirmed",
};

/**
 * The primary action's label + glyph in the Calendar's appointment panel,
 * keyed by the status it acts on.
 */
export const PANEL_ACTION: Record<
  ApptStatus,
  { labelKey: MessageKey; icon: string }
> = {
  confirmed: { labelKey: "screensA.today.panelCheckIn", icon: "log-in" },
  arrived: { labelKey: "screensA.today.panelMarkComplete", icon: "check" },
  pending: { labelKey: "screensA.today.panelConfirmBooking", icon: "check" },
  done: { labelKey: "screensA.today.panelReopen", icon: "rotate-ccw" },
  cancelled: { labelKey: "screensA.today.panelReopen", icon: "rotate-ccw" },
};

/**
 * The same action, abbreviated for the narrow button on a Today row. Keys, not
 * text — the abbreviation is per-language, so a locale is free to shorten
 * differently (or not at all) rather than inherit English's clipping.
 */
export const ROW_ACTION_KEY: Record<ApptStatus, MessageKey> = {
  confirmed: "screensA.today.rowCheckIn",
  arrived: "screensA.today.rowComplete",
  pending: "screensA.today.rowConfirm",
  done: "screensA.today.rowReopen",
  cancelled: "screensA.today.rowReopen",
};

function isStatus(v: string | undefined): v is ApptStatus {
  return v !== undefined && v in STATUS_META;
}

/** The seeded status, unless the front desk has moved it this session. */
export function apptStatus(
  a: StudioAppt,
  overrides: Record<string, string>,
): ApptStatus {
  const moved = overrides[a.id];
  return isStatus(moved) ? moved : a.status;
}

/** The seeded start, unless the block has been dragged this session. */
export function effStart(a: StudioAppt, moved: Record<string, number>): number {
  const t = moved[a.id];
  return t == null ? a.start : t;
}

/**
 * Whole-dollar money. The studio half prices in round numbers on tiles and
 * blocks — `money()` from `lib/format` is the guest-facing two-decimal form
 * and stays that way for receipts. Both run through `Intl` now, so the symbol
 * lands on the side the reader's locale puts it on.
 */
export function dollars(n: number): string {
  return wholeMoney(n);
}

/** Minutes from midnight, clamped into the trading day. */
export function clampedNow(now = new Date()): number {
  const m = now.getHours() * 60 + now.getMinutes();
  return Math.max(DAY_START, Math.min(DAY_END, m));
}

/**
 * "9:00 AM – 6:00 PM" for the given weekday, from the specialist's real
 * availability windows rather than a second hardcoded string — so a column
 * header cannot claim hours the booking engine will not honour.
 */
export function hoursLabel(staff: StaffMember, weekday: Weekday): string {
  const windows = staff.hours[weekday];
  if (!windows || windows.length === 0) return "Not in today";
  const open = Math.min(...windows.map((w) => w[0]));
  const close = Math.max(...windows.map((w) => w[1]));
  return `${minutesToTime(open)} – ${minutesToTime(close)}`;
}

/* ------------------------------------------------------------------ *
 * Today-only seed
 * ------------------------------------------------------------------ */

export interface KpiSeed {
  labelKey: MessageKey;
  icon: string;
  /** Per-record tint; `var(--accent)` for the headline tile. */
  tint: string;
  /**
   * Period-on-period movement, or `null` when the tile shows none.
   *
   * A signed number rather than `'+18%'`: the sign glyph, the grouping and the
   * digits are all the reader's — Arabic writes `٪١٨+` — and the screen has to
   * read the sign anyway to colour the chip, which `startsWith('+')` only ever
   * did correctly for a string English had already formatted.
   */
  delta: number | null;
  /** `true` when `delta` is a rate to spell as a percentage, not a count. */
  deltaPercent: boolean;
}

/**
 * The four tiles across the top. Values are computed from the book at render
 * time; only the copy and the trend live here.
 */
export const KPI_SEED: readonly KpiSeed[] = [
  {
    labelKey: "screensA.today.kpiBookings",
    icon: "calendar-check",
    tint: "var(--accent)",
    delta: 3,
    deltaPercent: false,
  },
  {
    labelKey: "screensA.today.kpiTaken",
    icon: "banknote",
    tint: "#7d9166",
    delta: 0.18,
    deltaPercent: true,
  },
  {
    labelKey: "screensA.today.kpiUtil",
    icon: "gauge",
    tint: "#6f8bb0",
    delta: -0.04,
    deltaPercent: true,
  },
  {
    labelKey: "screensA.today.kpiGaps",
    icon: "triangle-alert",
    tint: "#c08a6a",
    delta: null,
    deltaPercent: false,
  },
];

/**
 * Counts owned by screens this one only links to. Today quotes them in its
 * alert list, so they are seeded here rather than reaching into another
 * screen's module: Stock and Reviews are ported separately, and a cross-screen
 * import would couple the two together. The review count matches the badge
 * the studio sidebar already shows.
 */
export const LOW_STOCK_COUNT = 3;
export const REVIEWS_TODO_COUNT = 2;

/** Which handler the screen wires to an alert's button. */
export type AlertAction = "waitlist" | "stock" | "intake" | "reviews";

export interface AlertSeed {
  action: AlertAction;
  icon: string;
  tint: string;
  titleKey: MessageKey;
  subKey: MessageKey;
  ctaKey: MessageKey;
  /** Drives the title's plural where it counts something. */
  titleCount?: number;
  /** Drives the sub's plural where it counts something. */
  subCount?: number;
  /**
   * Demo fiction the sub interpolates — guest, specialist and product names.
   * These stay literal on purpose: the salon's own people are not chrome.
   */
  subParams?: Record<string, string>;
  /** Minutes from midnight; the screen clocks it for the reader's locale. */
  subTime?: number;
}

/** "Needs a decision" — the four things worth interrupting someone for. */
export const ALERT_SEED: readonly AlertSeed[] = [
  {
    action: "waitlist",
    icon: "bell-plus",
    tint: "#c08a6a",
    titleKey: "screensA.today.alertWaitlistTitle",
    titleCount: 2,
    subKey: "screensA.today.alertWaitlistSub",
    subParams: { client: "Sam Doyle", staff: "Noor" },
    subTime: 810,
    ctaKey: "screensA.today.alertWaitlistCta",
  },
  {
    action: "stock",
    icon: "package",
    tint: "#b58a6a",
    titleKey: "screensA.today.alertStockTitle",
    titleCount: LOW_STOCK_COUNT,
    subKey: "screensA.today.alertStockSub",
    subParams: { product: "Barrier Repair Cream" },
    subCount: 2,
    ctaKey: "screensA.today.alertStockCta",
  },
  {
    action: "intake",
    icon: "user-plus",
    tint: "#7d9166",
    titleKey: "screensA.today.alertIntakeTitle",
    subParams: { client: "Jonah Pike", staff: "Elin" },
    subKey: "screensA.today.alertIntakeSub",
    subTime: 960,
    ctaKey: "screensA.today.alertIntakeCta",
  },
  {
    action: "reviews",
    icon: "star",
    tint: "#6f8bb0",
    titleKey: "screensA.today.alertReviewsTitle",
    titleCount: REVIEWS_TODO_COUNT,
    subKey: "screensA.today.alertReviewsSub",
    subParams: { client: "Sam Doyle" },
    ctaKey: "screensA.today.alertReviewsCta",
  },
];

/** Avatar tint for a booking whose specialist has left the roster. */
export const FALLBACK_TINT = "#b07d9a";
