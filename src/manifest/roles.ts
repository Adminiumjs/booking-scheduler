/**
 * Who may do what, enforced by Adminium on every read and write (plan §7).
 *
 *   owner       everything in the app: prices, settings, refunds, reviews,
 *               finding and erasing a person. Not the payment switch or the
 *               Google and Microsoft apps: those are whoever manages them in
 *               Adminium (ACC-12).
 *   front-desk  the desk's screens only. Every booking, client and waiting
 *               guest, with prices and what was paid (cQ24). Books, moves,
 *               cancels, marks the day's steps, lets a time go, sends deposit
 *               links. Never a price change, a refund, settings, an export, or
 *               a review's state.
 *   specialist  the desk's screens only, their OWN rows only: their bookings
 *               without money, e-mail or phone; those clients' names and
 *               staff notes; their own team row, hours, days off and time off.
 *
 * The desk shows or hides a control from the person's grants, but these lists
 * are what refuse the write. One plain read from another role would lift a
 * row limit, so a specialist holds this role and no other.
 */
import { PAGE_REFS } from "./pages.ts";
import { TABLE_REFS, TABLES } from "./tables.ts";

const grant = (table: string, ...actions: string[]) => actions.map((action) => `table:@${table}:${action}`);
const view = (page: string) => `page:@${page}:view`;
const pii = (table: string) => `table:@${table}:read_pii`;

/** The columns of a table Adminium decides: no role types them. */
const decided = (ref: string): Set<string> =>
  new Set(
    TABLES.find((t) => t.ref === ref)!
      .columns.filter((c) => {
        const rules = c.rules ?? {};
        return c.ref === "id" || ["rollup", "formula", "copy", "stamp", "sequence", "format", "code"].some((rule) => rules[rule] !== undefined);
      })
      .map((c) => c.ref),
  );
const typed = (ref: string, ...leaveOut: string[]): string[] =>
  TABLES.find((t) => t.ref === ref)!
    .columns.map((c) => c.ref)
    .filter((c) => !decided(ref).has(c) && !leaveOut.includes(c));
const allBut = (ref: string, ...leaveOut: string[]): string[] =>
  TABLES.find((t) => t.ref === ref)!
    .columns.map((c) => c.ref)
    .filter((c) => !leaveOut.includes(c));

/** What on a booking is the guest's, the guard's or an add-on's: no member of staff types it. */
export const NOT_TYPED_ON_A_BOOKING = [
  "specialist_told_at",
  "made_proved",
  "card_paid",
  "no_review_request",
  // The guest's own yes to texts: staff never tick it for them (plan 80, Q7).
  "texts_ok",
  "picked_by_anyone",
  "door",
  "customer_proved",
  "deposits_then",
  "discount",
  "line_discount",
  "pay_due",
  "pay_started",
  "late_cancel",
  "revision",
  "reviewed_at",
  "google_pressed",
];

/** What a specialist may never read of a booking: money, and how to reach the customer (§7). */
export const NOT_THE_SPECIALISTS = [
  "paid_online",
  "shown_paid",
  "rest_at_studio",
  "made_proved",
  "card_paid",
  "no_review_request",
  "texts_ok",
  "text_reminds",
  "price",
  "pay_mode",
  "deposit",
  "ask_online",
  "who_hidden",
  "door",
  "deposits_then",
  "gives_back",
  "service_pays",
  "door_fits",
  "discount",
  "line_discount",
  "net_price",
  "asked",
  "paid",
  "balance",
  "pay_due",
  "refunded",
  "deposit_link",
  "link_until",
  "pay_started",
  "pay_until",
  "email",
  "phone",
  "proved_by",
  "client_key",
  "link_token",
  "link_expires",
  "link_stopped",
];
export const SPECIALIST_BOOKING_READS = allBut("bookings", ...NOT_THE_SPECIALISTS);

/** The reviews Forms & surveys keeps. */
const REVIEWS_READ = [
  { addOn: "forms", table: "reviews", actions: ["read"] },
  { addOn: "forms", table: "review_totals", actions: ["read"] },
];
const REVIEWS_MODERATE = [
  { addOn: "forms", table: "reviews", actions: ["read", "update"], limit: { writable: ["state", "hide_reason", "reply"] } },
  { addOn: "forms", table: "review_totals", actions: ["read"] },
];

/** A client's packs and gift cards, as the desk's panel shows them: never a whole code or a card's link. */
export const VOUCHER_READS = ["id", "code_last4", "public_name", "what", "uses_total", "uses_taken", "uses_left", "holder_email", "holder_key", "holder_name", "status", "expires_on", "issued_at"];
export const GIFT_CARD_READS = ["id", "kind", "label", "owner_email", "owner_key", "status", "opening", "taken", "balance", "expires_on", "recipient_name", "recipient_email", "sender_name", "send_on", "issued_at"];
const OFFERS_READ = [
  { addOn: "offers", table: "vouchers", actions: ["read"], limit: { readable: VOUCHER_READS } },
  { addOn: "offers", table: "gift_cards", actions: ["read"], limit: { readable: GIFT_CARD_READS } },
];

/**
 * A gift card's whole code is the card: whoever reads it can spend it. A guest's typed code stays in the row that paid with it,
 * and no role reads that column, the owner's included. A code typed on a booking is the same (`typed`).
 */
export const PAYMENT_READS = allBut("payments", "card_code");
export const BOOKING_CODE_READS = allBut("booking_codes", "typed");

/** What the desk writes when it makes a booking. The state's moves are held to the table's own. */
const DESK_BOOKING_MAKES = typed("bookings", ...NOT_TYPED_ON_A_BOOKING);
/**
 * What it may change afterwards. Never the service (it would copy a new price and deposit), who the customer is, whether money
 * is asked, or the waiting-list row: those are fixed when the booking is made (MON-2, L2a-F13).
 */
const DESK_BOOKING_WRITES = DESK_BOOKING_MAKES.filter((c) => !["service_id", "customer_id", "ask_online", "deposit_link", "waitlist_id", "channel"].includes(c));

/** Records of money and of what was sent: nobody deletes them. */
const NO_DELETE = ["messages", "payments", "bookings", "purchases", "purchase_lines", "purchase_refunds", "calendar_busy"];
/** A table no role opens: the desk reads busy blocks through the sync's own route (T08). */
const CLOSED = ["calendar_busy"];

export const ROLES = [
  {
    key: "owner",
    name: "Owner",
    permissions: [
      "app:@:staff",
      ...TABLE_REFS.filter((table) => !CLOSED.includes(table)).flatMap((table) =>
        // Adminium alone writes a sale's refund, from the owner's cancel: a row by hand would refund with no recall of the pack.
        table === "purchase_refunds" ? grant(table, "read") : NO_DELETE.includes(table) ? grant(table, "read", "create", "update") : grant(table, "read", "create", "update", "delete"),
      ),
      ...["bookings", "customers", "waitlist", "purchases", "purchase_lines", "messages", "team"].flatMap((table) => [pii(table), ...grant(table, "export")]),
      ...PAGE_REFS.flatMap((page) => [view(page), `page:@${page}:edit`]),
      "privacy:@:people",
      "payments:@:refund",
      "addOn:holiday-calendars:settings",
      // Anyone's calendar: connect, send or copy a link, disconnect (§7).
      "accounts:@:connect",
      "accounts:@:send-link",
      "accounts:@:disconnect",
      // A guest's reply to a reminder ("running ten minutes late"), read and answered on Adminium's Texts page (plan 80, Q2).
      "texts:@:read",
      "texts:@:reply",
    ],
    limits: {
      bookings: {
        writable: DESK_BOOKING_WRITES,
        creatable: DESK_BOOKING_MAKES,
        creatableValues: { state: ["booked", "paying", "offered"], channel: ["desk"], lapsed_by: ["desk"], cancelled_by: ["studio"] },
        writableValues: { lapsed_by: ["desk"], cancelled_by: ["studio"] },
      },
      // Money is recorded by the payment itself, or by hand as cash or a card at the studio.
      payments: {
        readable: PAYMENT_READS,
        creatable: ["booking_id", "purchase_id", "kind", "amount", "method", "paid_at", "client_key"],
        creatableValues: { method: ["cash", "card"] },
      },
      booking_codes: { readable: BOOKING_CODE_READS },
    },
    tables: [...REVIEWS_MODERATE, ...OFFERS_READ],
  },
  {
    key: "front-desk",
    name: "Front desk",
    screensOnly: true,
    permissions: [
      "app:@:staff",
      ...["bookings", "customers", "waitlist", "messages", "team"].flatMap(pii),
      ...["settings", "opening_hours", "closures", "categories", "services", "team", "team_services", "team_hours", "time_off", "bookings", "booking_codes", "customers", "waitlist", "payments", "purchases", "purchase_lines", "gift_amounts", "pack_products", "messages"].flatMap((table) =>
        grant(table, "read"),
      ),
      ...grant("bookings", "create", "update"),
      ...grant("customers", "create", "update"),
      ...grant("waitlist", "update"),
      // Sends a connect link to the address on the row; never copies one, never disconnects (cQ12).
      "accounts:@:send-link",
    ],
    limits: {
      bookings: {
        writable: DESK_BOOKING_WRITES,
        creatable: DESK_BOOKING_MAKES,
        creatableValues: { state: ["booked", "paying", "offered"], channel: ["desk"], lapsed_by: ["desk"], cancelled_by: ["studio"] },
        writableValues: { lapsed_by: ["desk"], cancelled_by: ["studio"] },
      },
      // Never `email` on a customer who exists: it is what they sign in with, so changing it would hand over their account.
      customers: { writable: ["name", "phone", "language", "review_requests", "staff_note"], creatable: ["name", "email", "phone", "language", "staff_note"] },
      waitlist: { writable: ["state"], writableValues: { state: ["closed"] } },
      team: { readable: allBut("team", "email") },
      payments: { readable: PAYMENT_READS },
      booking_codes: { readable: BOOKING_CODE_READS },
    },
    tables: [...REVIEWS_READ, ...OFFERS_READ],
  },
  {
    key: "specialist",
    name: "Specialist",
    screensOnly: true,
    permissions: [
      "app:@:staff",
      ...["bookings", "customers"].flatMap(pii),
      ...["settings", "opening_hours", "closures", "categories", "services", "team", "team_services", "team_hours", "time_off", "bookings", "customers"].flatMap((table) => grant(table, "read")),
      ...grant("bookings", "update"),
      ...grant("time_off", "create", "delete"),
      // Their own calendar. Connecting asks for update on the row, so they hold it on their own row, and may write none of it.
      ...grant("team", "update"),
      "accounts:@:connect",
      "accounts:@:disconnect",
    ],
    limits: {
      bookings: {
        rows: { read: { reach: "own" }, update: { reach: "own" } },
        readable: SPECIALIST_BOOKING_READS,
        writable: ["state"],
        writableValues: { state: ["arrived", "done", "no_show"] },
        writableFrom: { state: ["booked", "arrived"] },
      },
      customers: { rows: { read: { reach: "own" } }, readable: ["id", "name", "staff_note"] },
      // `writable` takes at least one column: the key, which nobody can change.
      team: { rows: { read: { reach: "own" }, update: { reach: "own" } }, readable: allBut("team", "user_id"), writable: ["id"] },
      team_hours: { rows: { read: { reach: "own" } } },
      team_services: { rows: { read: { reach: "own" } } },
      time_off: { rows: { read: { reach: "own" }, delete: { reach: "own" } }, creatable: ["team_id", "starts_at", "ends_at", "why"] },
      // Their own days off. The studio's closures reach them through the free times (a departure from §7's "read": a row
      // of this table may name a colleague's holiday).
      closures: { rows: { read: { reach: "own" } }, readable: ["id", "team_id", "from_date", "to_date", "name", "active"] },
      services: { readable: ["id", "name", "category_id", "minutes", "buffer_min", "active", "position"] },
      categories: { readable: ["id", "name", "icon", "position"] },
      settings: { readable: ["id", "studio_name", "grid_min", "cancel_hours", "event_detail"] },
    },
  },
];
