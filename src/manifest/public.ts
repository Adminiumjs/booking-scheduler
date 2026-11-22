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
import { GIFT_MESSAGE_DIGITS, GIFT_MESSAGE_MAX } from "../limits.ts";
import { setting } from "./tables.ts";

export const LINK_KEY = "link";
/** One sale of a gift card or a pack, for the way back from the pay page: a key opens one kind of row by its link. */
export const SALE_KEY = "sale";
export const PUBLIC_KEYS = { [LINK_KEY]: {}, [SALE_KEY]: {} };

/** What a guest sees of a booking: never the staff note, the retry key or the link's code. */
export const BOOKING_SELECT = [
  "id",
  "code",
  "service_id",
  "team_id",
  "picked_by_anyone",
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
  "card_paid",
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
  "made_proved",
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
const TYPED = ["service_id", "team_id", "starts_at", "name", "email", "phone", "language", "note", "channel", "client_key", "no_review_request"];

/** The box on the booking form: ticked, the person's standing "no" to review requests, with the sentence they saw (cQ10). */
const NO_REVIEWS = {
  column: "no_review_request",
  purpose: "surveys",
  means: "no",
  wording: {
    version: 1,
    text: {
      "en-US": "Don't send me a review request after my visit",
      "de-DE": "Senden Sie mir nach meinem Besuch keine Bewertungsanfrage",
      "fr-FR": "Ne m'envoyez pas de demande d'avis après ma visite",
      "da-DK": "Send mig ikke en anmodning om anmeldelse efter mit besøg",
      "cs-CZ": "Neposílejte mi po návštěvě žádost o recenzi",
      "ar-EG": "لا ترسلوا لي طلب تقييم بعد زيارتي",
      "zh-CN": "到访后请勿向我发送评价请求",
      "zh-TW": "到訪後請勿傳送評價邀請給我",
    },
  },
};

/** A pack or a code the guest holds, sent as `held:<id>`, spent inside the save (CR-OFF-1, MON-3). */
const CODES = { via: "booking_id", writable: ["typed"], select: ["id"], max: 2 };
/** A gift card paying what is due online (R2). Never a figure: the card and the booking say what it pays. */
const CARD = { via: "booking_id", writable: ["card_code"], defaults: { method: "gift_card" }, select: ["id", "amount"], max: 1 };

/** A guest met for the first time is made from this booking; one already known is found, and never changed. */
const WHO = {
  claimedBy: { table: "customers", column: "customer_id", optional: true },
  identity: { table: "customers", email: "email", link: "customer_id", fill: { name: "name", phone: "phone", language: "language" } },
  shareLink: "link_token",
  humanCheck: true,
  level: "verified",
  clientKey: "client_key",
  dryRun: true,
  consent: NO_REVIEWS,
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
  children: { booking_codes: CODES },
  anonymous: { perValue: { columns: ["email", "phone"], n: 3 }, perIpHour: 4, perKeyHour: 60, plainText: ["name"] },
});

/** B: with money. Tighter per visitor, because each one holds a time unpaid for a few minutes (MON-7). */
const DOOR_WITH_MONEY = door({
  requireSetting: [setting("online_booking"), { ...setting("online_payments"), in: ["on"] }],
  requirePayments: "on",
  pay: true,
  defaults: { door: "with_money", state: "paying", ask_online: true, pay_started: true },
  children: { booking_codes: CODES, payments: CARD },
  anonymous: { perValue: { columns: ["email", "phone"], n: 3 }, perIpHour: 3, perKeyHour: 40, plainText: ["name"] },
});

/** C: a money service, while the owner has switched deposits off: paid at the studio. */
const DOOR_DEPOSITS_OFF = door({
  requireSetting: [setting("online_booking"), { ...setting("online_payments"), in: ["off"] }],
  defaults: { door: "deposits_off" },
  children: { booking_codes: CODES },
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
  // Signed in, the caps below do not count: at most five days of waiting at once.
  maxOpen: { column: "state", values: ["waiting", "offered"], n: 5 },
  anonymous: { perValue: { columns: ["email"], n: 3 }, perIpHour: 4, perKeyHour: 60, plainText: ["name"] },
};

const SALE_SELECT = ["id", "code", "state", "total", "due", "pay_until"];
const SALE_DOOR = {
  table: "purchases",
  methods: ["POST"],
  select: SALE_SELECT,
  requireSetting: [setting("online_booking"), { ...setting("online_payments"), in: ["on"] }],
  requirePayments: "on",
  pay: true,
  humanCheck: true,
  level: "verified",
  clientKey: "client_key",
  // The way back from the pay page reads the sale through its own link: a guest has no other session.
  shareLink: "link_token",
};
/** A gift card, by anyone (G12). The amount is the studio's own row; the page names which. */
const BUY_CARD = {
  ...SALE_DOOR,
  writable: ["buyer_name", "buyer_email", "language", "client_key"],
  requires: ["buyer_name", "buyer_email"],
  claimedBy: { table: "customers", column: "customer_id", optional: true },
  // Signed in, the caps below do not count: two orders waiting for payment at once, as for a pack.
  maxOpen: { column: "state", values: ["paying"], n: 2 },
  anonymous: { perValue: { columns: ["buyer_email"], n: 3 }, perIpHour: 3, perKeyHour: 30, plainText: ["buyer_name"] },
  children: {
    purchase_lines: { via: "purchase_id", writable: ["gift_amount_id", "to_name", "to_email", "message", "send_on"], defaults: { kind: "card" }, requires: ["gift_amount_id", "to_name", "to_email"], select: ["id", "amount"], min: 1, max: 1, plainText: ["to_name", { column: "message", digits: GIFT_MESSAGE_DIGITS, max: GIFT_MESSAGE_MAX }] },
  },
};
/** A pack, by a signed-in customer only: it needs a holder who proved their address (G13). */
const BUY_PACK = {
  ...SALE_DOOR,
  // Who the receipt goes to. Who holds the pack is the signed-in customer's own row (`holder_*`), whatever is typed here.
  writable: ["buyer_name", "buyer_email", "language", "client_key"],
  requires: ["buyer_name", "buyer_email"],
  claimedBy: { table: "customers", column: "customer_id" },
  defaults: { customer_proved: true },
  maxOpen: { column: "state", values: ["paying"], n: 2 },
  children: { purchase_lines: { via: "purchase_id", writable: ["pack_id"], defaults: { kind: "pack" }, requires: ["pack_id"], select: ["id", "amount"], min: 1, max: 1 } },
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

/** Turning an offer down, so its waiting-list row can close (cQ29). */
const LET_OFFER_GO = { methods: ["PATCH"], select: CHANGED_SELECT, writable: ["state", "lapsed_by"], writableValues: { state: ["lapsed"], lapsed_by: ["guest"] }, writableWhen: { state: ["offered"] } };

/** Taking an offer while it is open: as it is, or through paying when the service asks for money (MOD-8). */
const TAKE_OFFER = { methods: ["PATCH"], select: CHANGED_SELECT, writable: ["state"], writableValues: { state: ["booked"] }, writableWhen: { state: ["offered"], offer_until: "from-now" } };
const TAKE_OFFER_PAYING = { methods: ["PATCH"], select: CHANGED_SELECT, writable: ["state"], writableValues: { state: ["paying"] }, defaults: { pay_started: true }, writableWhen: { state: ["offered"], offer_until: "from-now" } };

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
    // "Delete my details" also stops every link of their bookings and blanks what those rows copied of them. The page cancels
    // the visits ahead first, and says so (cQ29).
    forget: { columns: ["email", "name", "phone", "review_requests"], stamp: "forgotten_at", links: true, copies: true },
  },
  { table: "bookings", methods: ["GET"], ...SIGNED_IN, select: BOOKING_SELECT, filters: [{ column: "who_hidden", op: "eq", value: 0 }] },
  { table: "bookings", methods: ["GET"], ...SIGNED_IN, select: CHANGED_SELECT, filters: [{ column: "who_hidden", op: "eq", value: 1 }] },
  { table: "bookings", ...SIGNED_IN, ...OWN_CANCEL },
  { table: "bookings", ...SIGNED_IN, ...OWN_MOVE },
  { table: "bookings", ...SIGNED_IN, ...OWN_PAY },
  { table: "bookings", ...SIGNED_IN, ...OWN_GOOGLE },
  { table: "waitlist", methods: ["GET"], ...SIGNED_IN, select: ["id", "service_id", "team_id", "day", "state"] },
  // "Take me off the list" (G8). An open offer is let go first, which puts its row back to waiting.
  { table: "waitlist", methods: ["PATCH"], ...SIGNED_IN, select: ["id", "state"], writable: ["state"], writableValues: { state: ["closed"] }, writableWhen: { state: ["waiting"] } },
  { table: "bookings", ...SIGNED_IN, ...LET_OFFER_GO },
  { table: "bookings", ...SIGNED_IN, ...TAKE_OFFER },
  { table: "bookings", ...SIGNED_IN, ...TAKE_OFFER_PAYING },

  // ── the studio's public face ─────────────────────────────────────────────────
  ...PUBLIC_FACE,

  // ── making a booking: three doors ────────────────────────────────────────────
  DOOR_AT_STUDIO,
  DOOR_WITH_MONEY,
  DOOR_DEPOSITS_OFF,
  JOIN_WAITLIST,
  BUY_CARD,
  BUY_PACK,

  // ── one booking, by its own link ─────────────────────────────────────────────
  { table: "bookings", methods: ["GET"], ...OWN_LINK_CLAIM, select: BOOKING_SELECT, ...NOT_YET_WHO },
  // Free or full, for moving this booking: its own time is not counted against it (L1a-F5).
  { table: "bookings", key: LINK_KEY, kind: "availability", methods: ["GET"] },
  { table: "bookings", ...OWN_LINK, ...OWN_CANCEL },
  { table: "bookings", ...OWN_LINK, ...OWN_MOVE },
  { table: "bookings", ...OWN_LINK, ...OWN_PAY },
  { table: "bookings", ...OWN_LINK, ...OWN_GOOGLE },
  // A sale, by its own link: only whether it was paid, for the way back from the pay page.
  { table: "purchases", methods: ["GET"], key: SALE_KEY, claim: { by: "token", column: "link_token", expires: "link_expires", stopped: "link_stopped", own: true, address: "buyer_email" }, select: SALE_SELECT },
  // An offer from the waiting list, while it is open: taken as it is, or through paying when the service asks for money,
  // which starts the usual minutes (MOD-8, ACC-4). The table's moves say which fits.
  { table: "bookings", ...OWN_LINK, ...TAKE_OFFER },
  { table: "bookings", ...OWN_LINK, ...TAKE_OFFER_PAYING },
];
