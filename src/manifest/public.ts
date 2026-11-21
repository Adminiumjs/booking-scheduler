/**
 * What the studio's pages may read and write, through two browser keys (ACC-4).
 *
 * The `customer` key: the studio's public face (services, the team by name,
 * free or full times, opening hours), the doors that make a booking and join
 * the waiting list, and, once a person signs in with a code e-mailed to them,
 * their own bookings and waiting-list rows.
 *
 * The `link` key: one booking, by the code in its own link (in the address's
 * fragment). It reads that booking and nothing of `customers`, of other
 * bookings, of packs or of cards. It cancels and moves it within the rules,
 * takes an offer, and pays.
 *
 * A booking comes through one of three doors, by how its service is paid
 * (MON-4, cQ32):
 *   A  at the studio: always, for a service that takes no money online;
 *   B  with money: while the owner takes deposits online AND payments answer.
 *      The booking waits for its payment, its time held for a few minutes;
 *   C  a money service, unpaid: only while the owner switched deposits off.
 *      A payment service that is merely paused opens neither B nor C.
 *
 * The caps are the ones ruled (cQ4, §7). A guest's typed address is not proof:
 * it finds or makes a customer, and proves nothing (ACC-6).
 *
 * What never leaves through these keys: another customer's anything, staff
 * notes, who "Anyone" will be before it is booked, a link's code.
 */
import { setting } from "./tables.ts";

export const LINK_KEY = "link";
export const PUBLIC_KEYS = { [LINK_KEY]: {} };

/** What a guest sees of a booking: never the staff note, the retry key or the link's code. */
export const BOOKING_SELECT = [
  "id",
  "code",
  "service_id",
  "team_id",
  "name",
  "email",
  "phone",
  "language",
  "note",
  "channel",
  "starts_at",
  "minutes",
  "free_until",
  "state",
  "price",
  "pay_mode",
  "deposit",
  "discount",
  "asked",
  "paid",
  "pay_due",
  "refunded",
  "deposit_link",
  "link_until",
  "pay_until",
  "offer_until",
  "late_cancel",
  "cancelled_by",
  "cancel_reason",
  "lapsed_by",
  "link_expires",
  "reviewed_at",
  "customer_proved",
];

/** What making a booking answers: an endpoint anyone may call selects nothing personal. */
export const MADE_SELECT = BOOKING_SELECT.filter((c) => !["team_id", "name", "email", "phone", "note", "cancel_reason"].includes(c));
/** A change's answer: the page reads the person again through a read that keeps "Anyone" unsaid. */
export const CHANGED_SELECT = BOOKING_SELECT.filter((c) => c !== "team_id");

export const SERVICE_SELECT = ["id", "name", "category_id", "blurb", "minutes", "price", "online", "deposit", "pays_online", "bring", "position"];
export const TEAM_SELECT = ["id", "name", "role_title", "tint", "position"];
export const SETTINGS_SELECT = [
  "id",
  "studio_name",
  "tagline",
  "address_line1",
  "city",
  "region",
  "zip",
  "email",
  "website",
  "grid_min",
  "notice_min",
  "window_days",
  "cancel_hours",
  "hold_min",
  "online_booking",
  "online_payments",
  "reviews_on",
  "google_review_link",
];

/**
 * Who "Anyone" will be stays unsaid until the booking is booked (§7). The engine withholds a column only on a row's own link,
 * so a door's answer and every change's answer leave the person out, and a signed-in read comes in two halves.
 */
const NOT_YET_WHO = { withhold: { columns: ["team_id"], when: { where: [{ column: "who_hidden", eq: 1 }] } } };

const IS_ON = [{ column: "active", op: "eq", value: true }];

const PUBLIC_FACE = [
  { table: "settings", methods: ["GET"], select: SETTINGS_SELECT },
  { table: "categories", methods: ["GET"], select: ["id", "name", "icon", "position"] },
  // BOOK-12: a service switched off for online booking is gone from here, and refused at every door.
  {
    table: "services",
    methods: ["GET"],
    select: SERVICE_SELECT,
    filters: [...IS_ON, { column: "bookable_online", op: "eq", value: true }],
    pagination: { defaultLimit: 60, maxLimit: 100, order: "position.asc" },
  },
  {
    table: "team",
    methods: ["GET"],
    select: TEAM_SELECT,
    filters: [...IS_ON, { column: "bookable_online", op: "eq", value: true }],
    pagination: { defaultLimit: 60, maxLimit: 100, order: "position.asc" },
  },
  { table: "team_services", methods: ["GET"], select: ["id", "team_id", "service_id"], pagination: { defaultLimit: 100, maxLimit: 100, order: "id.asc" } },
  { table: "opening_hours", methods: ["GET"], select: ["id", "weekday", "opens", "closes", "open"] },
  // The studio's own closures. A person's day off is never public: it shows only as no free times.
  {
    table: "closures",
    methods: ["GET"],
    select: ["id", "from_date", "to_date", "name"],
    filters: [...IS_ON, { column: "studio_wide", op: "eq", value: 1 }, { column: "to_date", op: "from-today" }],
  },
  { table: "gift_amounts", methods: ["GET"], select: ["id", "amount", "position"], filters: IS_ON },
  { table: "pack_products", methods: ["GET"], select: ["id", "name", "price", "uses", "service_id", "category_id", "valid_days", "position"], filters: IS_ON },
  // Free or full, never who.
  { table: "bookings", kind: "availability", methods: ["GET"] },
];

/** What every door takes from the guest. `channel` is their word, a statistic only (MOD-16). */
const TYPED = ["service_id", "team_id", "starts_at", "name", "email", "phone", "language", "note", "channel", "client_key"];

/** A guest met for the first time is made from this booking; one already known is found, and never changed. */
const WHO = {
  claimedBy: { table: "customers", column: "customer_id", optional: true },
  identity: { table: "customers", email: "email", link: "customer_id", fill: { name: "name", phone: "phone", language: "language" } },
  shareLink: "link_token",
  humanCheck: true,
  level: "verified",
  clientKey: "client_key",
  dryRun: true,
  // Signed in: at most three visits ahead (cQ4).
  maxOpen: { column: "state", values: ["booked", "paying"], n: 3, upcoming: "starts_at" },
};

/**
 * BOOK-12 (a service switched off for online booking) needs no word here: a guest may name only a row a read of the key shows
 * them, and `services` shows none of those. That the door fits how the service is paid is the table's own rule (`door_fits`).
 */
const door = (more: Record<string, unknown>) => ({
  table: "bookings",
  methods: ["POST"],
  select: MADE_SELECT,
  writable: TYPED,
  writableValues: { channel: ["page", "embed"] },
  requires: ["service_id", "starts_at", "name", "email"],
  ...WHO,
  ...more,
});

/** A: paid at the studio. */
const DOOR_AT_STUDIO = door({
  requireSetting: [setting("online_booking")],
  defaults: { door: "at_studio" },
  anonymous: { perValue: { columns: ["email", "phone"], n: 3 }, perIpHour: 4, perKeyHour: 60, plainText: ["name"] },
});

/** B: with money. Tighter per visitor, because each one holds a time unpaid for a few minutes (MON-7). */
const DOOR_WITH_MONEY = door({
  requireSetting: [setting("online_booking"), { ...setting("online_payments"), in: ["on"] }],
  requirePayments: "on",
  pay: true,
  defaults: { door: "with_money", state: "paying", ask_online: true, pay_started: true },
  anonymous: { perValue: { columns: ["email", "phone"], n: 3 }, perIpHour: 3, perKeyHour: 40, plainText: ["name"] },
});

/** C: a money service, while the owner has switched deposits off: paid at the studio. */
const DOOR_DEPOSITS_OFF = door({
  requireSetting: [setting("online_booking"), { ...setting("online_payments"), in: ["off"] }],
  defaults: { door: "deposits_off" },
  anonymous: { perValue: { columns: ["email", "phone"], n: 3 }, perIpHour: 4, perKeyHour: 60, plainText: ["name"] },
});

/** The waiting list, signed in or not. A second join answers the same: it never says who is already waiting (ACC-13). */
const JOIN_WAITLIST = {
  table: "waitlist",
  methods: ["POST"],
  select: ["id", "service_id", "team_id", "day", "state"],
  writable: ["service_id", "team_id", "day", "name", "email", "language", "client_key"],
  requires: ["service_id", "day", "name", "email"],
  requireSetting: [setting("online_booking")],
  claimedBy: { table: "customers", column: "customer_id", optional: true },
  identity: { table: "customers", email: "email", link: "customer_id", fill: { name: "name", language: "language" } },
  humanCheck: true,
  level: "verified",
  clientKey: "client_key",
  anonymous: { perValue: { columns: ["email"], n: 3 }, perIpHour: 4, perKeyHour: 60, plainText: ["name"] },
};

/** Cancelling a booked visit: the table's rule says whether it is late. */
const OWN_CANCEL = { methods: ["PATCH"], select: CHANGED_SELECT, writable: ["state"], writableValues: { state: ["cancelled"] }, defaults: { cancelled_by: "customer" }, writableWhen: { state: ["booked"] } };
/** Moving it: while it is booked and outside the cancel window (BOOK-7). The guard judges the new time as a guest's. */
const OWN_MOVE = {
  methods: ["PATCH"],
  select: CHANGED_SELECT,
  writable: ["starts_at", "team_id"],
  writableWhen: { state: ["booked"], free_until: "from-now" },
};
/** Pressing Pay starts the usual minutes; a card or a pack that left nothing due books it (MON-3, MON-5). */
const OWN_PAY = { methods: ["PATCH"], select: CHANGED_SELECT, writable: ["pay_started", "state"], writableValues: { pay_started: [true], state: ["booked"] }, writableWhen: { state: ["paying"] } };
/** Pressed "Review us on Google". */
const OWN_GOOGLE = { methods: ["PATCH"], select: CHANGED_SELECT, writable: ["google_pressed"], writableValues: { google_pressed: [true] }, writableWhen: { state: ["arrived", "done"] } };

const SIGNED_IN = { level: "verified", claimedBy: { table: "customers", column: "customer_id" } };
/** The one entry that opens the link's row. */
const OWN_LINK_CLAIM = {
  key: LINK_KEY,
  claim: { by: "token", column: "link_token", expires: "link_expires", stopped: "link_stopped", own: true, address: "email" },
};
/** Every other change through the link: the same row, the session's own. */
const OWN_LINK = { key: LINK_KEY, level: "verified", claimedBy: { table: "bookings", column: "id" } };

export const PUBLIC_ACCESS = [
  // ── the customer who signs in with a code e-mailed to them ──────────────────
  {
    table: "customers",
    methods: ["GET", "PATCH"],
    select: ["id", "name", "email", "phone", "language", "review_requests"],
    writable: ["name", "phone", "language", "review_requests"],
    claim: { verify: "email-link", email: "email" },
    humanCheck: true,
    // "Delete my details" also stops every link of their bookings. T13's rule cancels the visits ahead (cQ29).
    forget: { columns: ["email", "name", "phone", "review_requests"], stamp: "forgotten_at", links: true },
  },
  { table: "bookings", methods: ["GET"], ...SIGNED_IN, select: BOOKING_SELECT, filters: [{ column: "who_hidden", op: "eq", value: 0 }] },
  { table: "bookings", methods: ["GET"], ...SIGNED_IN, select: CHANGED_SELECT, filters: [{ column: "who_hidden", op: "eq", value: 1 }] },
  { table: "bookings", ...SIGNED_IN, ...OWN_CANCEL },
  { table: "bookings", ...SIGNED_IN, ...OWN_MOVE },
  { table: "bookings", ...SIGNED_IN, ...OWN_PAY },
  { table: "bookings", ...SIGNED_IN, ...OWN_GOOGLE },
  { table: "waitlist", methods: ["GET"], ...SIGNED_IN, select: ["id", "service_id", "team_id", "day", "state"] },

  // ── the studio's public face ─────────────────────────────────────────────────
  ...PUBLIC_FACE,

  // ── making a booking: three doors ────────────────────────────────────────────
  DOOR_AT_STUDIO,
  DOOR_WITH_MONEY,
  DOOR_DEPOSITS_OFF,
  JOIN_WAITLIST,

  // ── one booking, by its own link ─────────────────────────────────────────────
  { table: "bookings", methods: ["GET"], ...OWN_LINK_CLAIM, select: BOOKING_SELECT, ...NOT_YET_WHO },
  { table: "bookings", ...OWN_LINK, ...OWN_CANCEL },
  { table: "bookings", ...OWN_LINK, ...OWN_MOVE },
  { table: "bookings", ...OWN_LINK, ...OWN_PAY },
  { table: "bookings", ...OWN_LINK, ...OWN_GOOGLE },
  // An offer from the waiting list, while it is open: taken as it is, or through paying when the service asks for money,
  // which starts the usual minutes (MOD-8, ACC-4). The table's moves say which fits.
  { table: "bookings", ...OWN_LINK, methods: ["PATCH"], select: CHANGED_SELECT, writable: ["state"], writableValues: { state: ["booked"] }, writableWhen: { state: ["offered"], offer_until: "from-now" } },
  { table: "bookings", ...OWN_LINK, methods: ["PATCH"], select: CHANGED_SELECT, writable: ["state"], writableValues: { state: ["paying"] }, defaults: { pay_started: true }, writableWhen: { state: ["offered"], offer_until: "from-now" } },
];
