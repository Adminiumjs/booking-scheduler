/**
 * Lumen Studio's tables, as the manifest asks Adminium to make them
 * (plan 78 §6, as ruled in §0.2).
 *
 * Who decides each column:
 *   Adminium  a copy, a formula, a total, a stamp, a running number, the
 *             booking guard;
 *   staff     through a role's lists (`roles.ts`);
 *   the guest through a public door's `writable` (`public.ts`);
 *   the sync  `calendar_busy` alone: written by the engine, closed to every role.
 *
 * What a booking is:
 *   - it takes a person for its own minutes plus the service's buffer. Two
 *     counted bookings of one person never overlap, and neither touches their
 *     time off or their calendar's busy times. A no-show frees its time (cQ5);
 *   - its price, how it is paid and its deposit are copied when it is made and
 *     never follow a later change of the price list (MON-2);
 *   - an offer to someone on the waiting list is a booking that does not hold
 *     the time yet (`offered`), opened by that booking's own link. "Book it" is
 *     a move, judged like a new booking by `placedFrom` (the shape T12 settled:
 *     ACC-4 over MOD-8's third key);
 *   - a late cancel is a customer's only, and is the flag `late_cancel`. The
 *     formula `gives_back` turns 1 on a free cancel or a time let go, and the
 *     pack use's reverse watches it, so a late cancel or a no-show keeps the
 *     use (MON-10, cQ31).
 */
import { l, type Labels } from "./labels.ts";

type Tone = "pos" | "warn" | "danger" | "info" | "neutral" | "accent";

export interface Column {
  ref: string;
  type: "int" | "text" | "decimal" | "money" | "bool" | "enum" | "date" | "timestamptz" | "fk" | "json";
  role?: "pk" | "created_at";
  semantic?: "name" | "email" | "image" | "money";
  nullable?: true;
  enum?: string[];
  references?: string;
  default?: string | number | boolean | Record<string, unknown>;
  maxLength?: number;
  unique?: true;
  index?: true;
  scale?: number | "currency";
  rules?: Record<string, unknown>;
  label?: Labels | Record<string, string>;
}

export interface Table {
  ref: string;
  label: Labels | Record<string, string>;
  labelPlural: Labels | Record<string, string>;
  keyField?: string;
  private?: true;
  unique?: string[][];
  states?: Record<string, unknown>;
  booking?: Record<string, unknown>;
  adjust?: Record<string, unknown>;
  postings?: Record<string, unknown>[];
  review?: Record<string, unknown>;
  belongs?: Record<string, unknown>[];
  indexes?: string[][];
  keep?: { law: "tax" | "health" | "contract" | "safety" };
  columns: Column[];
}

const KEPT_FOR_TAX = { law: "tax" } as const;

// ── column makers ───────────────────────────────────────────────────────────

const id: Column = { ref: "id", type: "int", role: "pk" };
const opt = { nullable: true } as const;

function text(ref: string, maxLength: number, label: string, more: Partial<Column> = {}): Column {
  return { ref, type: "text", maxLength, label: l(label), ...more };
}
function int(ref: string, label: string, more: Partial<Column> = {}): Column {
  return { ref, type: "int", label: l(label), ...more };
}
function bool(ref: string, label: string, value: boolean): Column {
  return { ref, type: "bool", default: value, label: l(label) };
}
function fk(ref: string, references: string, label: string, more: Partial<Column> = {}): Column {
  return { ref, type: "fk", references, label: l(label), ...more };
}
function date(ref: string, label: string, more: Partial<Column> = {}): Column {
  return { ref, type: "date", label: l(label), ...more };
}
function at(ref: string, label: string, more: Partial<Column> = {}): Column {
  return { ref, type: "timestamptz", label: l(label), ...more };
}
/** A price somebody types. */
function price(ref: string, label: string, more: Partial<Column> = {}): Column {
  return { ref, type: "decimal", scale: "currency", label: l(label), ...more };
}
/** Money Adminium works out: empty until it has what it needs. */
function money(ref: string, label: string, rules: Record<string, unknown>): Column {
  return { ref, type: "decimal", scale: "currency", nullable: true, label: l(label), rules };
}
/** Money somebody else decides (an add-on's answer, a payment's balance). */
function amount(ref: string, label: string): Column {
  return { ref, type: "decimal", scale: "currency", nullable: true, label: l(label) };
}
/** An enum, each value labelled, with tones where a list shows it as a chip. */
function choice(ref: string, label: string, values: Record<string, string>, more: Partial<Column> & { tones?: Record<string, Tone> } = {}): Column {
  const { tones, rules, ...rest } = more;
  return {
    ref,
    type: "enum",
    enum: Object.keys(values),
    label: l(label),
    ...rest,
    rules: {
      ...rules,
      enumLabels: {
        labels: Object.fromEntries(Object.entries(values).map(([value, word]) => [value, l(word)])),
        ...(tones === undefined ? {} : { tones }),
      },
    },
  };
}
/** A time of day, as the booking rule reads it. */
const hhmm = (ref: string, label: string, more: Partial<Column> = {}): Column => text(ref, 5, label, more);
/** A row of an add-on's table: no database link, because the add-on may be away. */
function addOnLink(ref: string, addOn: string, table: string, label: string): Column {
  return { ref, type: "int", nullable: true, label: l(label), rules: { addOnLink: { addOn, table } } };
}
/** A copy taken once, when the link is set, and kept as it was. */
const frozen = (via: string, from: string) => ({ copy: { via, from, mode: "always" } });
const stamp = (set: unknown, on: unknown) => ({ stamp: { set, on } });
const onState = (column: string, ...values: string[]) => ({ column, values });
export const setting = (column: string) => ({ table: "settings", column });
const c0 = (column: string) => ({ coalesce: [column, 0] });
/** The deposit or the whole price, by how the service is paid, less what a code or a pack covered. */
const ASKED = {
  max: [0, { sub: [{ if: [{ eq: ["pay_mode", "full"] }, c0("price"), { if: [{ eq: ["pay_mode", "deposit"] }, c0("deposit"), 0] }] }, c0("discount")] }],
};

// ── the words the tables share ──────────────────────────────────────────────

export const LANGUAGES: Record<string, string> = {
  "en-US": "English",
  "de-DE": "Deutsch",
  "fr-FR": "Français",
  "da-DK": "Dansk",
  "cs-CZ": "Čeština",
  "ar-EG": "العربية",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
};

function language(ref: string): Column {
  return {
    ref,
    type: "text",
    maxLength: 16,
    nullable: true,
    label: l("Language"),
    rules: { options: { values: Object.entries(LANGUAGES).map(([value, label]) => ({ value, label })) } },
  };
}

const WEEKDAYS = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };
const weekday = (more: Partial<Column> = {}): Column => choice("weekday", "Day", WEEKDAYS, more);

export const BOOKING_STATES: Record<string, string> = {
  offered: "Offered",
  paying: "Being paid",
  booked: "Booked",
  arrived: "Arrived",
  done: "Done",
  no_show: "No-show",
  cancelled: "Cancelled",
  lapsed: "Let go",
};
/** The states that hold a person's time (cQ5: a no-show frees it). */
export const HOLDS_TIME = ["paying", "booked", "arrived", "done"];
/** What a signed-in customer's limit of upcoming bookings counts (cQ4). */
export const OPEN_STATES = ["booked", "paying"];

export const PAY_MODES: Record<string, string> = { none: "At the studio", deposit: "Deposit online", full: "In full online" };
export const CHANNELS: Record<string, string> = { page: "Booking page", embed: "Your website", desk: "Front desk" };

/** Who may undo a step taken by mistake: never a specialist (`roles.ts`). */
const DESK = ["owner", "front-desk"];

// ── a booking's life ────────────────────────────────────────────────────────

const BOOKING_LIFE = {
  column: "state",
  initial: "booked",
  starts: ["paying", "offered"],
  strict: true,
  // The door must fit how the service is paid (MON-4). Here, not as a door's `agrees`: those also bind every staff create.
  create: { requires: { where: [{ column: "door_fits", eq: 1 }] } },
  moves: {
    // An offer: taken as it is when nothing is due, or through paying when the service asks for money.
    offered: [
      { to: "booked", requires: { where: [{ column: "pay_due", lte: 0 }] } },
      { to: "paying", requires: { where: [{ column: "pay_due", gt: 0 }] } },
      "lapsed",
    ],
    // The payment moves it to booked; so does a card or a pack that left nothing due (MON-3). No cancel while paying.
    paying: [{ to: "booked", requires: { where: [{ column: "pay_due", lte: 0 }] } }, { to: "lapsed", requires: { noPaymentInFlight: true } }],
    booked: [
      // Only on the visit's own day.
      { to: "arrived", requires: { time: { after: { column: "starts_at", time: "00:00" }, before: { column: "starts_at", time: "00:00", plus: { days: 1 } } } } },
      { to: "no_show", requires: { time: { after: { column: "starts_at" } } } },
      // Whoever cancels says so in the same write: the guest's door writes "customer", the desk "studio". Not a stamp: the
      // late rule below is decided before stamps are written, and would read it empty.
      { to: "cancelled", requires: { where: [{ column: "cancelled_by", isNull: false }] } },
    ],
    arrived: ["done", { to: "booked", roles: DESK, undo: true }],
    done: [{ to: "arrived", roles: DESK, undo: true }],
    no_show: [{ to: "booked", roles: DESK, undo: true }],
    cancelled: [],
    lapsed: [],
  },
  // A customer's cancel inside the window is late; the studio's never is (MON-9).
  late: [
    {
      to: "cancelled",
      from: ["booked"],
      moment: { column: "starts_at" },
      within: { hours: setting("cancel_hours") },
      mode: "flag",
      flag: "late_cancel",
      where: [{ column: "cancelled_by", eq: "customer" }],
    },
  ],
  timed: [
    // Not paid in time: the usual minutes once Pay is pressed, else the longer hold every move to paying is stamped with (R5).
    // So no row can sit in paying with no moment to let it go.
    { from: "paying", to: "lapsed", at: { column: "pay_until", or: [{ column: "link_until" }] }, set: { lapsed_by: "time" }, waitsForPayment: true },
    // An offer nobody took.
    { from: "offered", to: "lapsed", at: { column: "offer_until" }, set: { lapsed_by: "time" } },
  ],
  // The waiting-list row follows its offer: booked when it is taken, waiting again when it lapses.
  effects: [
    { on: { to: "booked" }, via: "waitlist_id", set: { state: "booked" } },
    { on: { to: "lapsed" }, via: "waitlist_id", set: { state: "waiting" } },
  ],
  lock: {
    when: ["cancelled", "lapsed"],
    except: ["link_stopped", "staff_note", "cancel_reason"],
  },
  children: {
    booking_codes: { via: "booking_id", lock: true },
  },
};

const WAITLIST_LIFE = {
  column: "state",
  initial: "waiting",
  strict: true,
  moves: {
    waiting: ["offered", "closed"],
    // An offer is withdrawn first (it lapses, and this row is waiting again); only then is the entry closed.
    offered: ["booked", "waiting"],
    booked: ["closed"],
    closed: [],
  },
  // The desk's offer is a new booking on this row, and moves it.
  children: { bookings: { via: "waitlist_id", createIn: ["waiting"], moveOnCreate: "offered" } },
};

const PURCHASE_LIFE = {
  column: "state",
  initial: "paying",
  strict: true,
  moves: {
    paying: [{ to: "paid", requires: { where: [{ column: "due", lte: 0 }] } }, { to: "lapsed", requires: { noPaymentInFlight: true } }],
    paid: [{ to: "cancelled", roles: ["owner"] }],
    cancelled: [],
    lapsed: [],
  },
  timed: [{ from: "paying", to: "lapsed", at: { column: "pay_until" }, waitsForPayment: true }],
  lock: { when: ["cancelled", "lapsed"], except: ["staff_note"] },
  children: {
    purchase_lines: { via: "purchase_id", lock: true },
  },
};

// ── the tables ──────────────────────────────────────────────────────────────

export const TABLES: Table[] = [
  {
    // One row, written at install. No time zone (the clock is the connection's, MOD-4) and no review hour (fixed in the outbox).
    ref: "settings",
    label: l("Studio settings"),
    labelPlural: l("Studio settings"),
    keyField: "studio_name",
    columns: [
      id,
      // Empty until the studio names itself: a sample's row fills only what is empty (MOD-5).
      text("studio_name", 80, "Studio name", { ...opt, rules: { personal: false } }),
      text("tagline", 120, "A line about the studio", { ...opt, rules: { personal: false } }),
      text("address_line1", 120, "Address", { ...opt, rules: { personal: false } }),
      text("city", 80, "City", { ...opt, rules: { personal: false } }),
      text("region", 40, "State", { ...opt, rules: { personal: false } }),
      text("zip", 12, "ZIP code", { ...opt, rules: { personal: false } }),
      // Where a reply to any of the studio's e-mails goes (FIL-10).
      text("email", 254, "Studio e-mail", { ...opt, semantic: "email", rules: { personal: false, validation: { format: "email" } } }),
      text("website", 200, "Website", { ...opt, rules: { personal: false, validation: { format: "url" } } }),
      // A booking's code is this, then its number. A studio's own letters, never Lumen's (MOD-15).
      text("code_prefix", 12, "Booking code starts with", opt),
            int("grid_min", "Times start every (minutes)", { default: 15, rules: { validation: { min: 5, max: 120 } } }),
      int("notice_min", "Guests book at least (minutes ahead)", { default: 120, rules: { validation: { min: 0, max: 20160 } } }),
      int("window_days", "Guests book up to (working days ahead)", { default: 30, rules: { validation: { min: 1, max: 365 } } }),
      int("cancel_hours", "Free to cancel until (hours before)", { default: 24, rules: { validation: { min: 0, max: 720 } } }),
      int("hold_min", "A time is held while paying for (minutes)", { default: 15, rules: { validation: { min: 5, max: 60 } } }),
      int("link_hold_hours", "A deposit link holds the time for (hours)", { default: 24, rules: { validation: { min: 1, max: 168 } } }),
      int("offer_hours", "A waiting-list offer lasts (hours)", { default: 24, rules: { validation: { min: 1, max: 168 } } }),
      bool("online_booking", "Online booking is on", true),
      // The owner's own switch (cQ32): off, every service is paid at the studio. On, a deposit service is booked only
      // while payments answer, so a pause of the payment service never hands out free holds.
      choice("online_payments", "Take deposits online", { off: "No: paid at the studio", on: "Yes" }, { default: "off" }),
      bool("reviews_on", "Ask for reviews", true),
      int("review_reminder_days", "Remind about a review after (days)", { default: 4, rules: { validation: { min: 1, max: 14 } } }),
      text("google_review_link", 300, "Google review link", { ...opt, rules: { validation: { format: "url" } } }),
      // What a booking's event says in a person's own calendar (cQ19).
      choice("event_detail", "Calendar events show", { first_initial: "First name and initial", service: "The service only" }, { default: "first_initial" }),
    ],
  },
  {
    ref: "opening_hours",
    label: l("Opening hours"),
    labelPlural: l("Opening hours"),
    keyField: "weekday",
    columns: [id, weekday({ unique: true }), hhmm("opens", "Opens", { default: "09:00", rules: { notAfter: { column: "closes" } } }), hhmm("closes", "Closes", { default: "18:00" }), bool("open", "Open", true)],
  },
  {
    // The studio's closures (no person) and each person's days off (a person), one table the booking rule reads (cT11).
    ref: "closures",
    label: l("Closure"),
    labelPlural: l("Closures"),
    keyField: "name",
    belongs: [{ column: "team_id", person: "user_id" }],
    columns: [
      id,
      fk("team_id", "team", "Who is away (empty: the whole studio)", opt),
      date("from_date", "From"),
      date("to_date", "To", { rules: { notBefore: { column: "from_date" } } }),
      text("name", 80, "Name"),
      bool("active", "Closed", true),
      // 1 for the whole studio: what the public read filters on, so a person's day off is never served.
      { ref: "studio_wide", type: "int", nullable: true, label: l("The whole studio"), rules: { formula: { if: [{ isNull: "team_id" }, 1, 0] } } },
      // The day Holiday calendars brought in, when it did (MON-14).
      addOnLink("holiday_id", "holiday-calendars", "holidays", "Public holiday"),
    ],
  },
  {
    ref: "categories",
    label: l("Category"),
    labelPlural: l("Categories"),
    keyField: "name",
    columns: [id, text("name", 60, "Name", { semantic: "name" }), text("icon", 40, "Icon", { default: "sparkles" }), int("position", "Position", { default: 0 })],
  },
  {
    ref: "services",
    label: l("Service"),
    labelPlural: l("Services"),
    keyField: "name",
    columns: [
      id,
      text("name", 80, "Name", { semantic: "name" }),
      fk("category_id", "categories", "Category"),
      text("blurb", 200, "A line about it", opt),
      int("minutes", "Length (minutes)", { default: 60, rules: { validation: { min: 5, max: 600 } } }),
      int("buffer_min", "Clear-up after (minutes)", { default: 0, rules: { validation: { min: 0, max: 120 } } }),
      price("price", "Price", { default: 0, rules: { validation: { min: 0 } } }),
      choice("online", "Paid", PAY_MODES, { default: "none" }),
      price("deposit", "Deposit", { ...opt, rules: { requiredWhen: { column: "online", in: ["deposit"] }, validation: { min: 0.01 } } }),
      // A plain yes for a door to hold a booking to: `agrees` has no "not equal" (MON-4).
      { ref: "pays_online", type: "int", nullable: true, label: l("Takes money online"), rules: { formula: { if: [{ neq: ["online", "none"] }, 1, 0] } } },
      bool("bookable_online", "Bookable online", true),
      choice("anyone_pick", "\"Anyone\" goes to", { even: "Share evenly", order: "In team order" }, { default: "even" }),
      text("bring", 200, "What to bring", opt),
      bool("active", "Offered", true),
      int("position", "Position", { default: 0 }),
    ],
  },
  {
    ref: "team",
    label: l("Team member"),
    labelPlural: l("Team"),
    keyField: "name",
    belongs: [{ column: "user_id" }],
    columns: [
      id,
      text("name", 80, "Name", { semantic: "name", rules: { personal: false } }),
      text("role_title", 80, "Role", opt),
      text("tint", 7, "Colour", { default: "#6f8bb0" }),
      bool("active", "Active", true),
      bool("bookable_online", "Bookable online", true),
      int("position", "Team order", { default: 0 }),
      // Their Adminium sign-in: what makes a booking "theirs".
      text("user_id", 64, "Adminium sign-in", { ...opt, rules: { staff: true } }),
      // Where a connect link goes. A person with no sign-in gets no staff notice (MOD-17).
      text("email", 254, "Work e-mail", { ...opt, semantic: "email", rules: { validation: { format: "email" } } }),
    ],
  },
  {
    ref: "team_services",
    label: l("Service a person does"),
    labelPlural: l("Services people do"),
    belongs: [{ column: "team_id", person: "user_id" }],
    unique: [["team_id", "service_id"]],
    columns: [id, fk("team_id", "team", "Team member"), fk("service_id", "services", "Service")],
  },
  {
    ref: "team_hours",
    label: l("Team hours"),
    labelPlural: l("Team hours"),
    belongs: [{ column: "team_id", person: "user_id" }],
    unique: [["team_id", "weekday"]],
    columns: [
      id,
      fk("team_id", "team", "Team member"),
      weekday(),
      hhmm("opens", "Starts", { default: "09:00", rules: { notAfter: { column: "closes" } } }),
      hhmm("closes", "Finishes", { default: "17:00" }),
      hhmm("break_start", "Break from", { ...opt, rules: { notBefore: { column: "opens" }, notAfter: { column: "break_end" } } }),
      hhmm("break_end", "Break until", { ...opt, rules: { notAfter: { column: "closes" } } }),
    ],
  },
  {
    ref: "time_off",
    label: l("Time off"),
    labelPlural: l("Time off"),
    keyField: "why",
    belongs: [{ column: "team_id", person: "user_id" }],
    columns: [
      id,
      fk("team_id", "team", "Team member"),
      at("starts_at", "From", { rules: { venueLocal: true } }),
      at("ends_at", "Until", { rules: { venueLocal: true, notBefore: { column: "starts_at" } } }),
      text("why", 120, "Why", opt),
    ],
  },
  {
    // The busy times of a person's connected calendar: start and end only, written by the engine, read by no role (cT1).
    ref: "calendar_busy",
    label: l("Calendar busy time"),
    labelPlural: l("Calendar busy times"),
    private: true,
    columns: [
      id,
      fk("team_id", "team", "Team member"),
      at("starts_at", "From"),
      at("ends_at", "Until"),
      text("account", 64, "Account"),
    ],
  },
  {
    ref: "customers",
    label: l("Customer"),
    labelPlural: l("Customers"),
    keyField: "name",
    belongs: [{ through: { table: "bookings", link: "customer_id", user: "team_id", person: "user_id" } }],
    columns: [
      id,
      // Empty once the person asked to be forgotten.
      text("name", 120, "Name", { ...opt, semantic: "name" }),
      // Empty for a walk-in with no address. Unique once folded.
      text("email", 254, "E-mail", { ...opt, unique: true, semantic: "email", rules: { normalize: "email", validation: { format: "email" } } }),
      text("phone", 32, "Phone", { ...opt, rules: { validation: { format: "phone" } } }),
      language("language"),
      // The `surveys` consent, as the consent log keeps it (cQ10).
      bool("review_requests", "Ask for reviews", true),
      text("staff_note", 500, "Note for the studio", { ...opt, rules: { personal: true } }),
      at("forgotten_at", "Details deleted", opt),
      at("created_at", "Added", { ...opt, role: "created_at", rules: stamp("now", "create") }),
    ],
  },
  {
    ref: "waitlist",
    label: l("Waiting-list entry"),
    labelPlural: l("Waiting list"),
    keyField: "name",
    columns: [
      id,
      fk("customer_id", "customers", "Customer", opt),
      // Both empty once the person is erased; the door requires them.
      text("name", 120, "Name", { ...opt, semantic: "name" }),
      text("email", 254, "E-mail", { ...opt, semantic: "email", rules: { normalize: "email", validation: { format: "email" } } }),
      language("language"),
      fk("service_id", "services", "Service"),
      fk("team_id", "team", "With (empty: anyone)", opt),
      date("day", "Day"),
      choice("state", "State", { waiting: "Waiting", offered: "Offered", booked: "Booked", closed: "Closed" }, {
        default: "waiting",
        tones: { waiting: "info", offered: "accent", booked: "pos", closed: "neutral" },
      }),
      text("client_key", 64, "Retry key", { ...opt, unique: true }),
      at("created_at", "Added", { ...opt, role: "created_at", rules: stamp("now", "create") }),
    ],
    states: WAITLIST_LIFE,
  },
  {
    // Not kept by law: the money is, in `payments`. Erasing a person blanks the copies on their bookings (ACC-10).
    ref: "bookings",
    label: l("Booking"),
    labelPlural: l("Bookings"),
    keyField: "code",
    belongs: [{ column: "team_id", person: "user_id" }],
    indexes: [["starts_at"], ["customer_id", "starts_at"]],
    booking: {
      start: "starts_at",
      minutes: "minutes",
      buffer: "buffer_min",
      resource: "team_id",
      kind: "service_id",
      countWhere: { column: "state", values: HOLDS_TIME },
      // An offer holds nothing, and is judged as a new booking when it is taken (cQ33).
      placedFrom: ["offered"],
      eligible: {
        table: "team_services",
        resource: "team_id",
        kind: "service_id",
        order: { table: "team", column: "position", active: "active", public: "bookable_online" },
      },
      hours: {
        practice: { table: "opening_hours", weekday: "weekday", open: "open", opens: "opens", closes: "closes" },
        own: { table: "team_hours", resource: "team_id", weekday: "weekday", opens: "opens", closes: "closes", breakStart: "break_start", breakEnd: "break_end", within: "practice" },
      },
      closures: { table: "closures", from: "from_date", to: "to_date", resource: "team_id", active: "active" },
      busy: [
        { table: "time_off", resource: "team_id", start: "starts_at", end: "ends_at" },
        { table: "calendar_busy", resource: "team_id", start: "starts_at", end: "ends_at", engine: { account: "account" } },
      ],
      anyone: { pick: { column: "anyone_pick" }, made: "made_at", flag: "picked_by_anyone" },
      grid: setting("grid_min"),
      windowDays: setting("window_days"),
      windowFor: "guests",
      noticeMinutes: setting("notice_min"),
    },
    // Offers & gift cards: what a code, a pack use or a card takes off, inside the save (CR-OFF-1).
    adjust: {
      by: { addOn: "offers" },
      needs: "offers",
      lines: [
        {
          self: true,
          price: "price",
          discount: "line_discount",
          what: [
            { column: "service_id", as: "item" },
            { column: "category_id", as: "category" },
          ],
        },
      ],
      order: {
        discount: "discount",
        customer: { link: "customer_id", address: "email", proved: "customer_proved", counts: { column: "state", in: ["done"] } },
      },
      codes: { table: "booking_codes", via: "booking_id", typed: "typed", code: "code_id", voucher: "voucher_id", removed: "removed_at" },
      uses: "uses",
      frozen: { to: ["done", "no_show", "cancelled", "lapsed"] },
    },
    postings: [
      // A pack use or a code: taken with the booking, kept on a late cancel or a no-show, given back otherwise (cQ31).
      { id: "uses", into: { addOn: "offers", ledger: "value", action: "redeem" }, needs: "offers", post: { on: { create: true } }, reverse: { on: { column: "gives_back", in: [1] } }, map: {} },
    ],
    // A visit may be reviewed once, by its customer: kept by Forms & surveys.
    review: {
      by: { addOn: "forms" },
      needs: "reviews",
      about: { link: "service_id", name: ["service_id", "name"], detail: ["team_id", "name"] },
      when: { path: ["state"], in: ["arrived", "done"] },
      person: ["customer_id"],
      // A typed address proves nothing: a booking's own link reviews only a proved booking (§0.2).
      proved: ["customer_proved"],
      shownName: { full: "name" },
      stamp: "reviewed_at",
    },
    states: BOOKING_LIFE,
    columns: [
      id,
      // ── who and what ──
      int("number", "Number (running)", { ...opt, rules: { sequence: { start: 1001 } } }),
      text("code", 20, "Code", { ...opt, unique: true, rules: { format: { from: "number", prefixSetting: setting("code_prefix") } } }),
      fk("service_id", "services", "Service", { rules: { linkable: { where: [{ column: "active", eq: true }] } } }),
      fk("category_id", "categories", "Category", { ...opt, rules: frozen("service_id", "category_id") }),
      // Empty on a create means Anyone: Adminium picks, and says so in the next column.
      fk("team_id", "team", "With", opt),
      { ref: "picked_by_anyone", type: "bool", nullable: true, label: l("Picked by \"Anyone\"") },
      // 1 while Adminium's pick stays unsaid: "Anyone", still being paid for. What the public reads withhold the person by (§7).
      {
        ref: "who_hidden",
        type: "int",
        nullable: true,
        label: l("Who is not said yet"),
        // (The guard writes the person and its flag after this is worked out: on the create, the person is still empty.)
        rules: { formula: { if: [{ and: [{ eq: ["state", "paying"] }, { or: [{ isNull: "team_id" }, { eq: ["picked_by_anyone", true] }] }] }, 1, 0] } },
      },
      fk("customer_id", "customers", "Customer", opt),
      // Who proved who they are when it was made: the signed-in customer, or the staff member. Empty for a guest (ACC-6).
      text("proved_by", 64, "Proved by", { ...opt, rules: stamp({ claim: "id", staff: "user-id" }, "create") }),
      // The yes/no the review word and Offers read. Only Offers' step writes it, so without Offers it stays empty and a booking's
      // own link reviews nothing: signing in, or the review mail's own link (T06), still does. `proved_by` above is the desk's mark.
      { ref: "customer_proved", type: "bool", nullable: true, label: l("Made signed in or at the desk") },
      // Empty once the person is erased; every door and the desk's form require it.
      text("name", 120, "Name", { ...opt, semantic: "name" }),
      text("email", 254, "E-mail", { ...opt, semantic: "email", rules: { normalize: "email", validation: { format: "email" } } }),
      text("phone", 32, "Phone", { ...opt, rules: { validation: { format: "phone" } } }),
      language("language"),
      text("note", 500, "Note from the guest", { ...opt, rules: { personal: true } }),
      text("staff_note", 500, "Note for the studio", { ...opt, rules: { personal: true } }),
      // A statistic only: nothing may branch on it (MOD-16).
      choice("channel", "Booked through", CHANNELS, { default: "desk" }),
      at("made_at", "Made", { ...opt, rules: stamp("now", "create") }),
      text("client_key", 64, "Retry key", { ...opt, unique: true }),
      fk("waitlist_id", "waitlist", "From the waiting list", opt),
      // ── when ──
      at("starts_at", "Starts", { rules: { venueLocal: true } }),
      int("minutes", "Minutes", { default: 60, rules: frozen("service_id", "minutes") }),
      int("buffer_min", "Clear-up (minutes)", { default: 0, rules: frozen("service_id", "buffer_min") }),
      // Until when a guest may move it, and cancel it for free: the moment the cancel window opens.
      at("free_until", "Free to change until", { ...opt, rules: stamp({ moment: { column: "starts_at", minus: { hours: setting("cancel_hours") } } }, { columns: ["starts_at"] }) }),
      // The calendar file's count: a change of time or a cancel is a new revision of the same event (cT12).
      int("revision", "Revision", { default: 0 }),
      // ── money ──
      money("price", "Price", frozen("service_id", "price")),
      choice("pay_mode", "Paid", PAY_MODES, { ...opt, rules: frozen("service_id", "online") }),
      money("deposit", "Deposit", frozen("service_id", "deposit")),
      // Which public door made it, and whether that door fits how the service is paid (MON-4). A door's `agrees` also binds
      // every staff create, so the check reads this: a booking the desk makes has no door, and always fits.
      choice("door", "Booked through door", { at_studio: "Paid at the studio", with_money: "With money online", deposits_off: "Deposits switched off" }, opt),
      { ref: "service_pays", type: "int", nullable: true, label: l("Service takes money online"), rules: frozen("service_id", "pays_online") },
      {
        ref: "door_fits",
        type: "int",
        nullable: true,
        label: l("The door fits the service"),
        rules: {
          formula: {
            if: [
              // A row made from the waiting list is an offer, and nothing else (the entry could never move on otherwise).
              { isNull: "waitlist_id" },
              {
                if: [
                  {
                    or: [
                      { and: [{ eq: ["door", "at_studio"] }, { eq: ["service_pays", 1] }] },
                      { and: [{ eq: ["door", "with_money"] }, { eq: ["service_pays", 0] }] },
                      { and: [{ eq: ["door", "deposits_off"] }, { eq: ["service_pays", 0] }] },
                    ],
                  },
                  0,
                  1,
                ],
              },
              { if: [{ eq: ["state", "offered"] }, 1, 0] },
            ],
          },
        },
      },
      // Written by the door that asks for money, or by the desk with a deposit link. Fixed once the booking is made.
      bool("ask_online", "Asked to pay online", false),
      // The owner's switch as it stood when the row was made: an offer of a money service asks for money while it was on.
      text("deposits_then", 8, "Deposits online when made", { ...opt, rules: { default: { from: setting("online_payments") } } }),
      // What codes and a pack took off (Offers), the booking's whole and its one line.
      amount("discount", "Reductions"),
      amount("line_discount", "Reduction on the visit"),
      // What the visit comes to, after a code or a pack.
      money("net_price", "Price after reductions", { formula: { max: [0, { sub: [c0("price"), c0("discount")] }] } }),
      // What is asked online: the deposit or the price, less what a code or a pack covered. An offer asks by the switch.
      money("asked", "Asked online", {
        formula: {
          if: [
            { isNull: "waitlist_id" },
            { if: [{ eq: ["ask_online", true] }, ASKED, 0] },
            { if: [{ eq: ["deposits_then", "on"] }, ASKED, 0] },
          ],
        },
      }),
      // What the payments hold, online or at the studio, up to what the visit comes to.
      money("paid", "Paid", { rollup: { from: "payments", via: "booking_id", sum: "kept", balance: { column: "balance", of: "net_price" }, cap: true } }),
      amount("balance", "Still owing"),
      // What is still to pay online: it falls to nothing as money lands (MON-1).
      money("pay_due", "Still to pay online", { formula: { max: [0, { sub: ["asked", c0("paid")] }] } }),
      money("refunded", "Refunded", { rollup: { from: "payments", via: "booking_id", sum: "returned" } }),
      // R5: a deposit link holds the time until `link_until`; pressing Pay starts the usual minutes.
      bool("deposit_link", "Deposit link sent", false),
      at("link_until", "Deposit link holds until", {
        ...opt,
        rules: stamp({ addMinutes: { hours: setting("link_hold_hours"), notAfter: { column: "starts_at" } } }, onState("state", "paying")),
      }),
      bool("pay_started", "Pay pressed", false),
      at("pay_until", "Pay by", {
        ...opt,
        rules: stamp({ addMinutes: { minutes: setting("hold_min"), notAfter: { column: "starts_at" } } }, onStateBool("pay_started")),
      }),
      // ── state ──
      choice("state", "State", BOOKING_STATES, {
        default: "booked",
        tones: { offered: "accent", paying: "warn", booked: "info", arrived: "pos", done: "neutral", no_show: "danger", cancelled: "neutral", lapsed: "neutral" },
      }),
      // An offer ends by itself: so many hours from when it is made, and never after the visit starts (MOD-8).
      at("offer_until", "Offer open until", {
        ...opt,
        // Never inside a guest's notice either: the desk may not offer a time a guest could not book (cQ33).
        rules: stamp({ addMinutes: { hours: setting("offer_hours"), notAfter: { column: "starts_at", minus: { minutes: setting("notice_min") } } } }, onState("state", "offered")),
      }),
      at("arrived_at", "Arrived at", { ...opt, rules: { stamp: { set: "now", on: onState("state", "arrived"), clearOnBack: true } } }),
      at("done_at", "Done at", { ...opt, rules: { stamp: { set: "now", on: onState("state", "done"), clearOnBack: true } } }),
      at("cancelled_at", "Cancelled at", { ...opt, rules: stamp("now", onState("state", "cancelled")) }),
      choice("cancelled_by", "Cancelled by", { customer: "The customer", studio: "The studio" }, opt),
      text("cancel_reason", 200, "Why it was cancelled", { ...opt, rules: { requiredWhen: { column: "cancelled_by", in: ["studio"] } } }),
      // Empty unless a customer cancelled inside the window (MON-9).
      { ref: "late_cancel", type: "bool", nullable: true, label: l("Late cancellation") },
      // 1 once the booking ended in a way that gives a pack use or a card's part back: a free cancel, or a time let go.
      // A late cancel and a no-show keep it (MON-10, cQ31). What the reverse of the `uses` posting watches.
      {
        ref: "gives_back",
        type: "int",
        nullable: true,
        label: l("Gives back what it used"),
        rules: { formula: { if: [{ or: [{ and: [{ eq: ["state", "cancelled"] }, { isNull: "late_cancel" }] }, { eq: ["state", "lapsed"] }] }, 1, 0] } },
      },
      choice("lapsed_by", "Let go by", { guest: "The guest", desk: "The desk", time: "The clock" }, opt),
      // ── its own link ──
      text("link_token", 16, "Link code", { ...opt, rules: { code: { length: 16, hiddenFromStaff: true, renew: { on: { column: "email", changed: true } } } } }),
      bool("link_stopped", "Link stopped", false),
      // Thirty days after the visit, so the review request and its reminder still open it.
      at("link_expires", "Link works until", { ...opt, rules: stamp({ moment: { column: "starts_at", plus: { days: 30 } } }, { columns: ["starts_at"] }) }),
      at("reviewed_at", "Reviewed", opt),
      // Pressed "Review us on Google", through the booking's own session: the Overview's count (REV-14).
      bool("google_pressed", "Pressed the Google link", false),
      at("google_pressed_at", "Pressed the Google link at", { ...opt, rules: stamp("now", onStateBool("google_pressed")) }),
    ],
  },
  {
    ref: "booking_codes",
    label: l("Code on a booking"),
    labelPlural: l("Codes on bookings"),
    columns: [
      id,
      fk("booking_id", "bookings", "Booking"),
      text("typed", 40, "Typed"),
      addOnLink("code_id", "offers", "codes", "Code"),
      addOnLink("voucher_id", "offers", "vouchers", "Voucher"),
      at("removed_at", "Removed", opt),
    ],
  },
  {
    ref: "purchases",
    keep: KEPT_FOR_TAX,
    label: l("Purchase"),
    labelPlural: l("Purchases"),
    keyField: "code",
    states: PURCHASE_LIFE,
    columns: [
      id,
      int("number", "Number (running)", { ...opt, rules: { sequence: { start: 5001 } } }),
      text("code", 20, "Code", { ...opt, unique: true, rules: { format: { from: "number", prefix: "LPO-" } } }),
      text("buyer_name", 120, "Buyer", { semantic: "name" }),
      text("buyer_email", 254, "Buyer's e-mail", { semantic: "email", rules: { normalize: "email", validation: { format: "email" } } }),
      fk("customer_id", "customers", "Customer", opt),
      language("language"),
      choice("state", "State", { paying: "Being paid", paid: "Paid", cancelled: "Cancelled", lapsed: "Let go" }, {
        default: "paying",
        tones: { paying: "warn", paid: "pos", cancelled: "neutral", lapsed: "neutral" },
      }),
      money("total", "Total", { rollup: { from: "purchase_lines", via: "purchase_id", sum: "amount" } }),
      money("paid", "Paid", { rollup: { from: "payments", via: "purchase_id", sum: "kept", balance: { column: "due", of: "total" }, cap: true } }),
      amount("due", "Still to pay"),
      money("refunded", "Refunded", { rollup: { from: "payments", via: "purchase_id", sum: "returned" } }),
      at("made_at", "Made", { ...opt, rules: stamp("now", "create") }),
      at("pay_until", "Pay by", { ...opt, rules: stamp({ addMinutes: { minutes: setting("hold_min") } }, "create") }),
      text("client_key", 64, "Retry key", { ...opt, unique: true }),
      text("staff_note", 500, "Note for the studio", { ...opt, rules: { personal: true } }),
      text("link_token", 16, "Link code", { ...opt, rules: { code: { length: 16, hiddenFromStaff: true } } }),
      bool("link_stopped", "Link stopped", false),
      at("link_expires", "Link works until", { ...opt, rules: stamp({ addMinutes: { hours: 90 * 24 } }, "create") }),
    ],
  },
  {
    ref: "purchase_lines",
    keep: KEPT_FOR_TAX,
    label: l("Purchase line"),
    labelPlural: l("Purchase lines"),
    columns: [
      id,
      fk("purchase_id", "purchases", "Purchase", { index: true }),
      choice("kind", "Kind", { card: "Gift card", pack: "Pack" }),
      fk("gift_amount_id", "gift_amounts", "Gift amount", opt),
      fk("pack_id", "pack_products", "Pack", opt),
      // What was sold, at what it cost then. The server decides it from the row chosen.
      amount("amount", "Amount"),
      text("to_name", 120, "To", { ...opt, semantic: "name" }),
      text("to_email", 254, "To (e-mail)", { ...opt, semantic: "email", rules: { normalize: "email", validation: { format: "email" } } }),
      text("message", 300, "Message", opt),
      text("sender", 120, "From", opt),
      language("language"),
      date("send_on", "Send on", opt),
    ],
  },
  {
    ref: "gift_amounts",
    label: l("Gift card amount"),
    labelPlural: l("Gift card amounts"),
    keyField: "amount",
    columns: [id, price("amount", "Amount", { unique: true, rules: { validation: { min: 1 } } }), int("position", "Position", { default: 0 }), bool("active", "On sale", true)],
  },
  {
    ref: "pack_products",
    label: l("Pack on sale"),
    labelPlural: l("Packs on sale"),
    keyField: "name",
    columns: [
      id,
      text("name", 80, "Name", { semantic: "name" }),
      price("price", "Price", { rules: { validation: { min: 1 } } }),
      int("uses", "Visits", { default: 5, rules: { validation: { min: 1, max: 100 } } }),
      fk("service_id", "services", "Covers this service", opt),
      fk("category_id", "categories", "Or this category", opt),
      int("valid_days", "Lasts (days)", { default: 365, rules: { validation: { min: 1, max: 1830 } } }),
      int("position", "Position", { default: 0 }),
      bool("active", "On sale", true),
    ],
  },
  {
    // Money in and out, as Hotel keeps it: for a booking or for a purchase (cT10).
    ref: "payments",
    keep: KEPT_FOR_TAX,
    label: l("Payment"),
    labelPlural: l("Payments"),
    columns: [
      id,
      fk("booking_id", "bookings", "Booking", { ...opt, index: true }),
      fk("purchase_id", "purchases", "Purchase", { ...opt, index: true }),
      choice("kind", "Kind", { taken: "Taken", given_back: "Given back" }, { default: "taken" }),
      price("amount", "Amount", { rules: { validation: { min: 0.01 } } }),
      choice("method", "Method", { online: "Online", gift_card: "Gift card", cash: "Cash", card: "Card" }, { default: "online" }),
      at("paid_at", "Paid at", { default: "now" }),
      text("payment_ref", 64, "Payment reference", { ...opt, unique: true }),
      text("provider", 40, "Paid through", opt),
      text("currency", 3, "Currency", opt),
      // What went back of it, a running total Adminium writes.
      price("refunded", "Refunded", { default: 0 }),
      // What the row holds: a row of money given back counts against the booking, whatever way it went.
      money("kept", "Kept", { formula: { if: [{ eq: ["kind", "given_back"] }, { sub: [0, "amount"] }, { sub: ["amount", c0("refunded")] }] } }),
      money("returned", "Given back", { formula: { if: [{ eq: ["kind", "given_back"] }, "amount", c0("refunded")] } }),
      text("client_key", 64, "Retry key", { ...opt, unique: true }),
    ],
  },
  {
    // The outbox: one row per e-mail. T15 writes the kinds and templates; the review request and its reminder are two of them (cT7).
    ref: "messages",
    label: l("E-mail"),
    labelPlural: l("E-mails"),
    keyField: "kind",
    columns: [
      id,
      text("kind", 40, "Kind"),
      choice("status", "Status", { queued: "Going out", sent: "Sent", failed: "Not sent", skipped: "Skipped" }, {
        default: "queued",
        tones: { queued: "info", sent: "pos", failed: "danger", skipped: "neutral" },
      }),
      text("to_address", 254, "Sent to", { ...opt, semantic: "email" }),
      language("language"),
      fk("booking_id", "bookings", "Booking", opt),
      fk("purchase_id", "purchases", "Purchase", opt),
      fk("waitlist_id", "waitlist", "Waiting-list entry", opt),
      fk("customer_id", "customers", "Customer", opt),
      at("due_at", "Due", opt),
      at("created_at", "Created", { ...opt, role: "created_at", rules: stamp("now", "create") }),
      at("sent_at", "Sent", opt),
      text("error", 500, "What went wrong", opt),
      text("repeat_key", 64, "Resend key", opt),
      // The old time, for "your visit moved" (FIL-10).
      text("was", 1000, "As it was", opt),
      choice("skip_reason", "Why it was skipped", {
        overtaken: "A later e-mail took its place",
        paid: "Paid",
        void: "Void",
        "no-longer-needed": "No longer needed",
        "by-hand": "Skipped by hand",
      }, opt),
    ],
  },
];

/** A stamp written when a yes/no column becomes yes (a value trigger fires on a create too). */
function onStateBool(column: string) {
  return { column, values: [true] };
}

export const TABLE_REFS = TABLES.map((t) => t.ref);
