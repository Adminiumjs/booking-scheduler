/*
 * Domain types for the booking scheduler.
 *
 * Every screen talks to these through `src/data/source.ts`; nothing imports
 * `demo.ts` directly. Minutes are always "minutes from local midnight"
 * (540 = 09:00, 840 = 14:00, 1200 = 20:00) and dates are always the local
 * ISO day string `YYYY-MM-DD` — parse them with `parseISO()` from
 * `src/lib/format.ts`, never with `new Date(iso)`.
 */

/* ------------------------------------------------------------------ *
 * Catalogue
 * ------------------------------------------------------------------ */

/** Category slugs used by the service catalogue. */
export type CategorySlug = "hair" | "spa" | "nails" | "move";

/** `'all'` is the "no filter" pseudo-category used by the chip rows. */
export type CategoryFilter = CategorySlug | "all";

export interface Category {
  slug: CategorySlug;
  name: string;
  /** Lucide icon name (kebab-case), see `IconName` in `components/Icon.tsx`. */
  icon: string;
}

export interface Service {
  id: string;
  name: string;
  cat: CategorySlug;
  /** Duration in minutes. */
  dur: number;
  /** Price in whole dollars; render through `money()`. */
  price: number;
  /** Ids of the staff who perform this service, in "first available" order. */
  staff: string[];
  icon: string;
  /** Placeholder-tile tint (hex). Not a token — part of the entity palette. */
  tint: string;
  blurb: string;
  /** Fake filename shown in the placeholder tile's corner chip. */
  fname: string;
}

/* ------------------------------------------------------------------ *
 * Staff & availability
 * ------------------------------------------------------------------ */

/** `Date.getDay()` — 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** A half-open availability window `[startMinute, endMinute)`. */
export type TimeWindow = readonly [number, number];

/** Per-weekday availability windows. A missing weekday means "not in". */
export type StaffHours = Partial<Record<Weekday, readonly TimeWindow[]>>;

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  cat: CategorySlug;
  initials: string;
  tint: string;
  bio: string;
  hours: StaffHours;
}

/**
 * Who a booking draft is for: a concrete staff id, the literal `'first'`
 * (first-available across every specialist who offers the service), or `null`
 * when nothing has been picked yet.
 */
export type StaffSelection = string | "first" | null;

/* ------------------------------------------------------------------ *
 * Appointments & bookings
 * ------------------------------------------------------------------ */

/**
 * An occupied interval on one staff member's calendar. This is what the slot
 * engine checks against — real interval overlap, not a start-minute map.
 *
 * `bookingCode` is set when the appointment belongs to a booking the user can
 * see and manage; it is what a reschedule excludes from its own overlap check.
 */
export interface Appointment {
  staffId: string;
  dateISO: string;
  /** Start, minutes from midnight. */
  start: number;
  /** Duration in minutes; the interval is `[start, start + dur)`. */
  dur: number;
  bookingCode: string | null;
}

export type BookingStatus = "confirmed" | "cancelled";

/** When reminders go out. */
export type ReminderWhen = "24h" | "2h" | "both";

/** Recurrence cadence: weekly / fortnightly / every four weeks. */
export type RecurFreq = "1w" | "2w" | "4w";

export interface Booking {
  code: string;
  /** Service id. */
  svc: string;
  /** Staff id (never `'first'` — it is resolved at confirmation time). */
  staff: string;
  dateISO: string;
  /** Start, minutes from midnight. */
  time: number;
  dur: number;
  price: number;
  name: string;
  email: string;
  phone: string;
  note: string;
  status: BookingStatus;
  remEmail: boolean;
  remSms: boolean;
  remWhen: ReminderWhen;
  recurOn: boolean;
  recurFreq: RecurFreq;
  recurCount: number;
  /** Every date in the series, oldest first. Length 1 when not recurring. */
  series: string[];
}

/* ------------------------------------------------------------------ *
 * Waitlist
 * ------------------------------------------------------------------ */

export interface WaitlistEntry {
  /** `${iso}|${staff}` — the store keys `waitlist` by this. */
  key: string;
  /** Staff id, or the literal `'first'`. */
  staff: string;
  /** Service id. */
  svc: string;
  iso: string;
}

/* ------------------------------------------------------------------ *
 * Gift cards
 * ------------------------------------------------------------------ */

export type GiftStatus = "sent" | "redeemed";

export interface GiftCard {
  code: string;
  amount: number;
  to: string;
  toEmail: string;
  status: GiftStatus;
  /** Human date string, e.g. `'Jul 12, 2026'` or `'Just now'`. */
  date: string;
}

export interface GiftTheme {
  id: string;
  name: string;
  tint: string;
}

/** Which gift-card step the flow is on. */
export type GiftStep = "design" | "details" | "pay" | "done";

/** A preset amount, or the literal `'custom'`. */
export type GiftAmount = number | "custom";

/** Gift delivery mode. */
export type GiftSend = "now" | "schedule";

/* ------------------------------------------------------------------ *
 * Loyalty & membership
 * ------------------------------------------------------------------ */

export interface LoyaltyReward {
  label: string;
  cost: number;
  icon: string;
  tint: string;
}

export interface MembershipPlan {
  name: string;
  /** Pre-formatted, e.g. `'$39'`. */
  price: string;
  /** e.g. `'/mo'`. */
  cadence: string;
  featured: boolean;
  perks: string[];
}

export interface LoyaltyHistoryRow {
  label: string;
  date: string;
  /** Signed points delta. */
  delta: number;
}

/** A history row with its running balance *after* the row was applied. */
export interface LoyaltyLedgerRow extends LoyaltyHistoryRow {
  balance: number;
}

/* ------------------------------------------------------------------ *
 * Reviews & referral
 * ------------------------------------------------------------------ */

export interface Review {
  name: string;
  initials: string;
  tint: string;
  rating: number;
  /** Service *name* (display copy), not an id. */
  svc: string;
  date: string;
  quote: string;
}

export interface ReviewSummary {
  /** Computed mean of the seeded ratings (e.g. 4.75). */
  average: number;
  /** `average.toFixed(1)` — what the big mono figure shows. */
  averageLabel: string;
  /** Number of seeded reviews. */
  count: number;
  /** Marketing copy for the caption, e.g. `'480+ visits'`. */
  countLabel: string;
}

export interface ReferralStep {
  icon: string;
  label: string;
}

export interface ReferralInvite {
  name: string;
  /** Derived from `name` — the comp printed the full name in the avatar. */
  initials: string;
  status: string;
  done: boolean;
}

export interface ReferralData {
  code: string;
  steps: ReferralStep[];
  invites: ReferralInvite[];
}

/* ------------------------------------------------------------------ *
 * Intake
 * ------------------------------------------------------------------ */

export type IntakePressure = "light" | "medium" | "firm";

export interface IntakeOption {
  id: IntakePressure;
  label: string;
}

export interface IntakeState {
  concerns: Record<string, boolean>;
  allergies: string;
  pressure: IntakePressure;
  consent: boolean;
}

/* ------------------------------------------------------------------ *
 * Studio
 * ------------------------------------------------------------------ */

export interface StudioHoursRow {
  /** `'Monday'` … `'Sunday'` — Monday-first, matching `getTodayHoursIndex()`. */
  day: string;
  /** `'9:00 AM – 6:00 PM'` or `'Closed'`. */
  value: string;
  closed: boolean;
}

export interface StudioLocation {
  name: string;
  /**
   * The header wordmark — the studio's name without its suffix, short enough
   * to sit next to the logo badge. The header used to hard-code this while the
   * footer read `name` from the DataSource; both go through here now, so the
   * brand has exactly one source of truth.
   */
  shortName: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  transit: string;
  /** From-address used in the confirmation email mock. */
  email: string;
  /** Footer URL badge. */
  url: string;
}

/* ------------------------------------------------------------------ *
 * Group booking
 * ------------------------------------------------------------------ */

export interface GroupGuest {
  name: string;
  /** Service id. */
  svc: string;
}

/* ------------------------------------------------------------------ *
 * Chrome
 * ------------------------------------------------------------------ */

/** Every routable view. Anything not in this union renders the 404 screen. */
export type View =
  | "home"
  | "services"
  | "booking"
  | "confirm"
  | "manage"
  | "loyalty"
  | "giftcards"
  | "group"
  | "visits"
  | "waitliststatus"
  | "mygifts"
  | "policy"
  | "refer"
  | "intake"
  | "lhistory"
  | "notfound";

export type Theme = "light" | "dark";

export type ToastKind = "ok" | "warn";

export interface Toast {
  /** Monotonic id — use it as the React key so re-toasts re-animate. */
  id: number;
  msg: string;
  kind: ToastKind;
}
