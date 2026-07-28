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

/**
 * The guest-facing views — what a client of the studio sees.
 *
 * The first sixteen shipped with the original comp; the rest arrived with the
 * 2026-07-28 revision, which grew the comp from 16 screens to 37 without
 * changing a single one of the originals.
 */
export type GuestView =
  /* --- the original sixteen --- */
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
  | "notfound"
  /* --- the twenty-one added by the revised comp --- */
  | "account"
  | "blog"
  | "careers"
  | "checkout"
  | "dash"
  | "event"
  | "export"
  | "help"
  | "join"
  | "location"
  | "notifprefs"
  | "offers"
  | "orders"
  | "packages"
  | "post"
  | "reviews"
  | "rewards"
  | "shop"
  | "signin"
  | "staff"
  | "waitlist"
  /* --- the native-app design, shown as a device-framed showcase --- */
  | "mobile";

/**
 * The studio-facing views — what the people who run the salon see.
 *
 * Every id is `admin-` prefixed on purpose. Four of them (`services`,
 * `reviews`, `settings`, `reports`) would otherwise collide with a guest view
 * of the same name, and the prefix also makes `personaOf()` a string test
 * rather than a lookup table that can drift.
 */
export type AdminView =
  | "admin-today"
  | "admin-cal"
  | "admin-pos"
  | "admin-clients"
  | "admin-services"
  | "admin-team"
  | "admin-stock"
  | "admin-marketing"
  | "admin-payroll"
  | "admin-reviews"
  | "admin-reports"
  | "admin-settings";

/** Every routable view. Anything not in this union renders the 404 screen. */
export type View = GuestView | AdminView;

/**
 * Which half of the product a screen belongs to.
 *
 * The studio half exists because the 2026-07-28 Admin comp designed one. It
 * refines the 19 D4 "portal-only" ruling the same way 20 D4 did for the LMS:
 * the app owns the surfaces someone works in all day, the dashboard Adminium
 * generates still owns the records behind them.
 */
export type Persona = "guest" | "studio";

/* ------------------------------------------------------------------ *
 * Added by the 2026-07-28 comp revision
 * ------------------------------------------------------------------ */

/** The signed-in client's own details, editable on the account screen. */
export interface AccountProfile {
  name: string;
  email: string;
  phone: string;
  /** Birthday as a display string — the studio only wants day + month. */
  bday: string;
  /** Preferred specialist id, or "any". */
  pref: string;
  /** Preferred contact channel. */
  contact: string;
  twofa: boolean;
}

/** Notification preferences, one screen's worth. */
export interface NotifPrefs {
  email: boolean;
  sms: boolean;
  push: boolean;
  /** How long before an appointment the reminder goes out. */
  when: string;
  quiet: boolean;
  quietWin: string;
  /** Per-category opt-ins: reminders, waitlist, loyalty, packages, journal, offers. */
  cat: Record<string, boolean>;
}

/** The passwordless sign-in is two steps: ask for the email, then the code. */
export type SignInStep = "email" | "code";

/** A package the client has bought, and how much of it they have used. */
export interface OwnedPackage {
  id: string;
  used: number;
}

/**
 * A prepaid bundle of sessions.
 *
 * Contract data, not page copy — a studio owner edits their packages the same
 * way they edit services — so it lives behind the `DataSource` seam and is
 * defined once. Both the dashboard tile and the packages screen read it; the
 * dashboard simply ignores the marketing fields.
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
  /** Per-record tint — the one place a raw hex belongs. */
  tint: string;
  blurb: string;
}

export type Theme = "light" | "dark";

export type ToastKind = "ok" | "warn";

export interface Toast {
  /** Monotonic id — use it as the React key so re-toasts re-animate. */
  id: number;
  msg: string;
  kind: ToastKind;
}
