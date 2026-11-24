/**
 * The studio's e-mails: the `messages` table is the outbox, one row per mail,
 * and the desk's "E-mails sent" lists them.
 *
 *   booked            a booking with nothing paid online (pay at the studio);
 *   deposit_receipt   a booking whose money landed: what was paid, what is left;
 *   deposit_link      the desk booked it and asks for the deposit by mail (R5);
 *   let_go            the money did not come in time, so the time is free again;
 *   reminder          10 AM the day before, unless the booking was made or moved
 *                     inside the last day: its own mail is the reminder (cQ11);
 *   moved             a new time, with the calendar file moved in place;
 *   cancelled(_late)  the customer cancelled, in time or inside the window;
 *   cancelled_studio  the studio cancelled, with its reason and the refund (cQ28);
 *   offer             a time from the waiting list, on the offer's own link;
 *   review_request    10 AM the morning after a visit (cT7);
 *   review_reminder   once more, some days later, only while it is unanswered.
 *
 * And two texts (plan 80), each its own kind, sent only through the studio's own
 * text provider, and only to a guest who agreed and has not said STOP:
 *
 *   reminder_text     beside the reminder, for a booking whose box was ticked;
 *                     a reminder the sending hours would push past the visit is
 *                     skipped, never sent late (Q9);
 *   offer_text        beside the offer. It carries no link (a text never does),
 *                     so it sends the guest to the offer's e-mail or the phone.
 *
 * The rest are not the app's to word: the sign-in code is the engine's (FIL-11),
 * gift cards are Offers' (L3-F13), connect links are the core's (L3-F14).
 *
 * The log is the dedupe: a kind already written for a booking is not written
 * again, except a move, which is told each time. A mail goes to the customer's
 * address, or a guest's own address on the booking, in the booking's language.
 * A reply reaches the studio's own address.
 */

export const KINDS = [
  "booked",
  "deposit_receipt",
  "deposit_link",
  "let_go",
  "reminder",
  "moved",
  "cancelled",
  "cancelled_late",
  "cancelled_studio",
  "offer",
  "review_request",
  "review_reminder",
] as const;
export type Kind = (typeof KINDS)[number];

/** The kinds sent as texts. One kind has one channel, so a text is a kind of its own (plan 80, §4.2). */
export const TEXT_KINDS = ["reminder_text", "offer_text"] as const;
export type TextKind = (typeof TEXT_KINDS)[number];
/** How the desk and the console name them. */
export const TEXT_NAMES: Record<TextKind, string> = { reminder_text: "Reminder text", offer_text: "Waiting-list offer text" };

/** A template's key: the app's own, in the one spelling keys take. */
export const templateKey = (kind: string) => `bookings-${kind.replace(/_/g, "-")}`;

const onBooking = (column: string, to: unknown, where?: Record<string, unknown>) => ({
  onChange: { table: "bookings", column, to, ...(where === undefined ? {} : { where }) },
});

/** A row that went through `paying` has this stamp, whatever it paid in the end. */
const WENT_THROUGH_PAYING = { column: "link_until", isNull: false };
const NEVER_PAYING = { column: "link_until", isNull: true };

/** Both review mails hear the same move and leave the same way (cQ23: `arrived` counts, so a forgotten "Done" still asks). */
const reviewMail = (kind: Kind, date: string, days: number | { setting: { table: string; column: string } }) => ({
  kind,
  link: "booking_id",
  gate: { setting: { table: "settings", column: "reviews_on" } },
  ...onBooking("state", ["arrived", "done"]),
  due: { date, days, at: "10:00" },
  // One for each time the visit is marked arrived: an arrival taken back drops the waiting mail, and the real one asks again.
  repeatBy: "arrived_at",
  supersede: "review",
  dropWhen: [
    { column: "reviewed_at", isNull: false, reason: "no-longer-needed" },
    { column: "state", in: ["booked", "no_show", "cancelled"], reason: "no-longer-needed" },
  ],
});

export const OUTBOX = {
  table: "messages",
  columns: {
    kind: "kind",
    status: "status",
    to: "to_address",
    language: "language",
    due: "due_at",
    sentAt: "sent_at",
    error: "error",
    skipReason: "skip_reason",
    was: "was",
    repeatKey: "repeat_key",
    // One code beside each text's sentence (`sent`, `no-consent`, `not-set-up`, …): what the desk reads.
    textReason: "text_reason",
  },
  links: { booking: "booking_id", customer: "customer_id" },
  recipient: {
    via: "customer_id",
    table: "customers",
    email: "email",
    name: "name",
    // The booking's own language, whatever the person's row says.
    language: { column: "language" },
    // The person's number, for a text whose booking holds none (a desk's offer from the waiting list).
    phone: "phone",
    // A text goes first to the number typed on its booking: the box's yes was given for that number (plan 80, §4.4), and a
    // returning guest's typed number never changes their customer row (ACC-6).
    textPhone: { via: "booking_id", column: "phone" },
    // A guest has no customer row yet: the booking carries their details.
    fallback: { via: "booking_id", email: "email", name: "name", language: "language", phone: "phone" },
  },
  // The studio's phone, else its e-mail: what a text that cannot take a STOP reply gives for stopping (N1).
  settings: { table: "settings", name: "studio_name", replyTo: "email", phone: "phone" },
  pages: { manage: "/b", booking: "/book" },
  kinds: Object.fromEntries([...KINDS, ...TEXT_KINDS].map((kind) => [kind, templateKey(kind)])),
  channels: Object.fromEntries(TEXT_KINDS.map((kind) => [kind, "sms"])),
  classes: Object.fromEntries([...KINDS, ...TEXT_KINDS].map((kind) => [kind, "service"])),
  // The guest asked to be told when a time opens, and the offer may close within hours (it ends before the visit's notice):
  // it goes when the desk makes it, not the next morning. A reminder keeps the sending hours.
  waiting: ["offer_text"],
  // The two review mails are the only ones a person can refuse (cQ10): the box, the stop link and Your visits' switch.
  purposes: { review_request: "surveys", review_reminder: "surveys" },
  reviewLinks: { kinds: ["review_request", "review_reminder"], link: "booking", page: "/review" },
  producers: [
    // Nothing paid online: at the studio, or an offer taken with nothing to pay.
    { kind: "booked", link: "booking_id", onCreate: { table: "bookings", where: { column: "state", eq: "booked" } } },
    { kind: "booked", link: "booking_id", ...onBooking("state", "booked", NEVER_PAYING) },
    // The money landed, or a code or a card covered it.
    { kind: "deposit_receipt", link: "booking_id", ...onBooking("state", "booked", WENT_THROUGH_PAYING) },
    { kind: "deposit_link", link: "booking_id", onCreate: { table: "bookings", where: { column: "deposit_link", eq: true } } },
    // Only a time that was waiting for money. Letting it go yourself needs no mail about it.
    {
      kind: "let_go",
      link: "booking_id",
      ...onBooking("state", "lapsed", WENT_THROUGH_PAYING),
      holdSeconds: 5,
      dropWhen: [{ column: "lapsed_by", eq: "guest", reason: "no-longer-needed" }],
    },
    {
      kind: "reminder",
      link: "booking_id",
      before: {
        table: "bookings",
        at: "starts_at",
        lead: { via: "service_id", table: "services", column: "remind_hours", max: 48, at: "10:00" },
        where: { column: "reminds", eq: 1 },
      },
    },
    // The text beside it: the same moment, only where the guest ticked the box on this booking.
    {
      kind: "reminder_text",
      link: "booking_id",
      before: {
        table: "bookings",
        at: "starts_at",
        lead: { via: "service_id", table: "services", column: "remind_hours", max: 48, at: "10:00" },
        where: { column: "text_reminds", eq: 1 },
      },
    },
    {
      kind: "moved",
      link: "booking_id",
      // A new time or a new person: the guest was told who, and when.
      onChange: { table: "bookings", columns: ["starts_at", "team_id"], changed: true, where: { column: "state", eq: "booked" } },
      repeat: true,
      was: ["starts_at"],
    },
    // A cancel by the customer. The late flag is set in the same write, so the on-time words wait a moment and give way to it.
    {
      kind: "cancelled",
      link: "booking_id",
      ...onBooking("state", "cancelled", { column: "cancelled_by", eq: "customer" }),
      was: ["shown_paid"],
      holdSeconds: 30,
      dropWhen: [{ column: "late_cancel", eq: true, reason: "no-longer-needed" }],
    },
    { kind: "cancelled_late", link: "booking_id", ...onBooking("late_cancel", true, { column: "cancelled_by", eq: "customer" }), was: ["shown_paid"] },
    { kind: "cancelled_studio", link: "booking_id", ...onBooking("state", "cancelled", { column: "cancelled_by", eq: "studio" }), was: ["shown_paid"] },
    { kind: "offer", link: "booking_id", onCreate: { table: "bookings", where: { column: "state", eq: "offered" } } },
    // Held a moment and asked again at the last one: an offer taken, turned down or run out by then is not texted (a text
    // that waits for the day's limit included).
    {
      kind: "offer_text",
      link: "booking_id",
      onCreate: { table: "bookings", where: { column: "state", eq: "offered" } },
      holdSeconds: 5,
      dropWhen: [{ column: "state", in: ["paying", "booked", "lapsed", "cancelled"], reason: "no-longer-needed" }],
    },
    reviewMail("review_request", "starts_at", 1),
    // Counted from the morning of the request, so "4 days" in Settings is 4 days after it.
    reviewMail("review_reminder", "review_from", { setting: { table: "settings", column: "review_reminder_days" } }),
  ],
};
